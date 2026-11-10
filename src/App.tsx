import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { BarChart3, Check, ChevronLeft, ChevronRight, CircleHelp, Clock3, Copy, Dumbbell, Home, ListChecks, Pencil, Plus, Search, Settings, Share, SkipForward, Trash2, Undo2, X } from 'lucide-react';
import { createSession, db, ensureSeedData } from './data/db';
import type { Exercise, Plan, PlanExercise, SessionExercise, SessionSet, WorkoutSession } from './types';

const ProgressView = lazy(() => import('./ProgressView'));

type Screen = 'today' | 'plans' | 'progress' | 'settings' | 'workout';
const equipmentLabel: Record<string, string> = { barbell: 'Barbell', dumbbell: 'Dumbbell', 'machine/cable': 'Machine & cable', kettlebell: 'Kettlebell', bodyweight: 'Bodyweight', band: 'Band' };

function uid() { return crypto.randomUUID(); }
function formatDate(value: number) { return new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(value); }
function formatElapsed(start: number, end = Date.now()) { const seconds = Math.max(0, Math.floor((end - start) / 1000)); return `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds % 3600 / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
function prettyGroup(value: string) { return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }

function Art({ exercise, size = 'normal' }: { exercise: Pick<Exercise, 'art' | 'name' | 'equipment'>; size?: 'small' | 'normal' | 'large' }) {
  return <div className={`art art-${size}`} aria-hidden="true">{exercise.art ? <img src={`${exercise.art}-start.webp`} alt="" loading="lazy" /> : <Dumbbell size={size === 'small' ? 18 : 24} strokeWidth={1.7} />}</div>;
}

function App() {
  const [screen, setScreen] = useState<Screen>('today');
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [editor, setEditor] = useState<Plan | null>(null);
  const [customName, setCustomName] = useState('');
  const [customEquipment, setCustomEquipment] = useState<Exercise['equipment']>('barbell');
  const [showCustom, setShowCustom] = useState(false);
  const [elapsedNow, setElapsedNow] = useState(Date.now());
  const [restSeconds, setRestSeconds] = useState(90);
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const [restEndAt, setRestEndAt] = useState<number | null>(null);
  const [restPaused, setRestPaused] = useState(false);
  const [chartRange, setChartRange] = useState(6);
  const [chartMode, setChartMode] = useState<'reps' | 'weight'>('reps');
  const [selectedExercises, setSelectedExercises] = useState<string[] | null>(null);
  const [summarySession, setSummarySession] = useState<WorkoutSession | null>(null);
  const [undoState, setUndoState] = useState<{ session: WorkoutSession; exerciseIndex: number; setIndex: number } | null>(null);
  const [updateReady, setUpdateReady] = useState(false);
  const [applyUpdate, setApplyUpdate] = useState<(() => void) | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const plans = useLiveQuery(() => db.plans.orderBy('updatedAt').reverse().toArray(), [], [] as Plan[]);
  const exercises = useLiveQuery(() => db.exercises.orderBy('name').toArray(), [], [] as Exercise[]);
  const completedSessions = useLiveQuery(() => db.sessions.where('status').equals('completed').toArray().then((items) => items.sort((a, b) => b.startedAt - a.startedAt)), [], [] as WorkoutSession[]);
  const activeSession = useLiveQuery(() => db.sessions.where('status').equals('active').first(), [], undefined);

  useEffect(() => { void ensureSeedData(); }, []);
  useEffect(() => { const online = () => setIsOnline(true); const offline = () => setIsOnline(false); window.addEventListener('online', online); window.addEventListener('offline', offline); return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); }; }, []);
  useEffect(() => { void db.settings.get('restSeconds').then((setting) => { if (typeof setting?.value === 'number') setRestSeconds(setting.value); }); }, []);
  useEffect(() => { const handler = (event: Event) => { setApplyUpdate((event as CustomEvent<() => void>).detail); setUpdateReady(true); }; window.addEventListener('kaizen-update-ready', handler); return () => window.removeEventListener('kaizen-update-ready', handler); }, []);
  useEffect(() => { const id = window.setInterval(() => setElapsedNow(Date.now()), 1000); return () => window.clearInterval(id); }, []);
  useEffect(() => {
    if (!activeSession?.restEndAt || activeSession.restEndAt <= Date.now()) return;
    setRestEndAt(activeSession.restEndAt);
    setRestRemaining(Math.ceil((activeSession.restEndAt - Date.now()) / 1000));
  }, [activeSession?.id]);
  useEffect(() => {
    if (!restEndAt || restPaused) return;
    const id = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((restEndAt - Date.now()) / 1000));
      setRestRemaining(left);
      if (left === 0) { setRestEndAt(null); setRestRemaining(null); void clearRestEnd(); notify('Rest complete. Start your next set when you’re ready.'); }
    }, 250);
    return () => window.clearInterval(id);
  }, [restEndAt, restPaused]);
  useEffect(() => { if (toast) { const id = window.setTimeout(() => setToast(''), 2400); return () => window.clearTimeout(id); } }, [toast]);
  useEffect(() => { if (undoState) { const id = window.setTimeout(() => setUndoState(null), 5000); return () => window.clearTimeout(id); } }, [undoState]);

  async function notify(message: string) { setToast(message); }
  async function updateRestPreference(value: number) { setRestSeconds(value); await db.settings.put({ key: 'restSeconds', value }); }
  async function clearRestEnd() { if (activeSession?.id) await db.sessions.update(activeSession.id, { restEndAt: undefined }); }
  async function updateSession(updated: WorkoutSession) { if (updated.id) await db.sessions.put(updated); }
  async function startPlan(plan: Plan) {
    if (activeSession) { setScreen('workout'); return; }
    const prior = await db.sessions.where('planId').equals(plan.id!).toArray().then((items) => items.filter((session) => session.status === 'completed').sort((a, b) => b.startedAt - a.startedAt));
    const id = await createSession(plan, prior[0]);
    await db.settings.put({ key: 'lastPlanId', value: plan.id });
    setScreen('workout');
    notify('Workout ready. Your session saves as you go.');
    const created = await db.sessions.get(id);
    if (created) setElapsedNow(Date.now());
  }
  async function savePlan() {
    if (!editor) return;
    if (!editor.name.trim()) { notify('Give your plan a name first.'); return; }
    const data = { ...editor, name: editor.name.trim(), updatedAt: Date.now() };
    if (data.id) await db.plans.put(data); else await db.plans.add(data);
    setEditor(null); setShowExercisePicker(false); setShowCustom(false); setScreen('plans'); notify('Plan saved.');
  }
  function newPlan() { setEditor({ name: '', createdAt: Date.now(), updatedAt: Date.now(), exercises: [] }); setScreen('plans'); }
  function editPlan(plan: Plan) { setEditor(structuredClone(plan)); setScreen('plans'); }
  function addExerciseToPlan(exercise: Exercise) {
    if (!editor) return;
    if (editor.exercises.some((item) => item.exerciseId === exercise.id)) { notify('That exercise is already in this plan.'); return; }
    const item: PlanExercise = { id: uid(), exerciseId: exercise.id, name: exercise.name, equipment: exercise.equipment, loadType: exercise.loadType, muscles: exercise.muscles, art: exercise.art, workingWeightKg: null, sets: [{ reps: 8 }, { reps: 8 }, { reps: 8 }], settings: exercise.settings.slice(0, 2).map((label) => ({ label, value: '' })) };
    setEditor({ ...editor, exercises: [...editor.exercises, item], updatedAt: Date.now() });
    setShowExercisePicker(false); setSearch('');
  }
  async function addCustomExercise() {
    if (!customName.trim()) return;
    const id = `custom-${uid()}`;
    const item: Exercise = { id, name: customName.trim(), category: 'Your exercises', equipment: customEquipment, loadType: customEquipment === 'bodyweight' ? 'none' : customEquipment === 'band' ? 'variable' : 'external', muscles: [], aliases: [], art: null, artSourceId: null, settings: [], custom: true };
    await db.exercises.add(item); if (editor) addExerciseToPlan(item); setCustomName(''); setShowCustom(false); notify(editor ? 'Custom exercise added to plan.' : 'Custom exercise added to your library.');
  }
  async function deletePlan(plan: Plan) {
    if (!plan.id || !window.confirm(`Delete “${plan.name}”? Completed sessions will stay in history.`)) return;
    await db.plans.delete(plan.id); setEditor(null); notify('Plan deleted.');
  }
  async function duplicatePlan(plan: Plan) {
    const copy = structuredClone(plan); copy.id = undefined; copy.name = `${plan.name} copy`; copy.createdAt = Date.now(); copy.updatedAt = Date.now(); copy.exercises = copy.exercises.map((exercise) => ({ ...exercise, id: uid() }));
    await db.plans.add(copy); notify('Plan duplicated.');
  }
  async function startRest() {
    if (restEndAt) { setRestPaused(true); setRestRemaining(Math.ceil((restEndAt - Date.now()) / 1000)); setRestEndAt(null); await clearRestEnd(); return; }
    const seconds = restPaused && restRemaining ? restRemaining : restSeconds;
    const endAt = Date.now() + seconds * 1000;
    setRestPaused(false); setRestEndAt(endAt); setRestRemaining(seconds);
    if (activeSession) { activeSession.restEndAt = endAt; await updateSession(activeSession); }
  }
  async function addRestTime(amount: number) {
    const base = restEndAt ?? (restRemaining ? Date.now() + restRemaining * 1000 : Date.now());
    const endAt = Math.max(Date.now(), base) + amount * 1000;
    setRestEndAt(endAt); setRestRemaining(Math.ceil((endAt - Date.now()) / 1000)); setRestPaused(false);
    if (activeSession) { activeSession.restEndAt = endAt; await updateSession(activeSession); }
  }
  async function clearRest() { setRestEndAt(null); setRestRemaining(null); setRestPaused(false); await clearRestEnd(); }
  async function changeSet(exerciseIndex: number, setIndex: number, field: 'reps' | 'weightKg', value: number | null) {
    if (!activeSession?.id) return;
    const next = structuredClone(activeSession);
    const set = next.exercises[exerciseIndex].sets[setIndex];
    if (field === 'reps') set.reps = Math.max(0, value ?? 0); else set.weightKg = value === null ? null : Math.max(0, value);
    await updateSession(next);
  }
  async function toggleComplete(exerciseIndex: number, setIndex: number) {
    if (!activeSession?.id) return;
    const next = structuredClone(activeSession);
    const set = next.exercises[exerciseIndex].sets[setIndex];
    set.completed = !set.completed; set.completedAt = set.completed ? Date.now() : undefined;
    await updateSession(next);
    if (set.completed) { setUndo({ session: next, exerciseIndex, setIndex }); setToast('Set saved'); }
  }
  const setUndo = (value: { session: WorkoutSession; exerciseIndex: number; setIndex: number }) => setUndoState(value);
  async function undoCompletion() {
    if (!undoState?.session.id) return;
    const live = await db.sessions.get(undoState.session.id); if (!live) return;
    live.exercises[undoState.exerciseIndex].sets[undoState.setIndex].completed = false;
    live.exercises[undoState.exerciseIndex].sets[undoState.setIndex].completedAt = undefined;
    await db.sessions.put(live); setUndoState(null); setToast('Set marked incomplete');
  }
  async function skipExercise(index: number) {
    if (!activeSession) return;
    const next = structuredClone(activeSession); next.exercises[index].skipped = true; await updateSession(next); setToast('Exercise skipped');
  }
  async function addWorkoutSet(index: number) {
    if (!activeSession?.id) return;
    const next = structuredClone(activeSession); const sets = next.exercises[index].sets; const previous = sets[sets.length - 1];
    sets.push({ reps: previous?.reps ?? 8, weightKg: previous?.weightKg ?? next.exercises[index].workingWeightKg, previousReps: null, previousWeightKg: null, completed: false });
    await updateSession(next); setToast('Set added');
  }
  async function focusWorkoutExercise(index: number) {
    if (!activeSession?.id) return;
    const next = { ...activeSession, currentExerciseIndex: index }; await updateSession(next);
  }
  async function finishWorkout() {
    if (!activeSession?.id) return;
    if (!activeSession.exercises.some((exercise) => exercise.sets.some((set) => set.completed)) && !window.confirm('Finish this session without any completed sets?')) return;
    const finished = structuredClone(activeSession); finished.status = 'completed'; finished.endedAt = Date.now(); finished.restEndAt = undefined;
    await db.sessions.put(finished); await clearRest(); setSummarySession(finished); setScreen('today');
  }
  async function discardWorkout() {
    if (!activeSession?.id || !window.confirm('Discard this workout? Its uncompleted work will be removed.')) return;
    await db.sessions.delete(activeSession.id); await clearRest(); setScreen('today'); notify('Workout discarded.');
  }
  async function reorderExercise(index: number, direction: -1 | 1) {
    if (!editor) return; const target = index + direction;
    if (target < 0 || target >= editor.exercises.length) return;
    const next = [...editor.exercises]; [next[index], next[target]] = [next[target], next[index]]; setEditor({ ...editor, exercises: next });
  }
  function updatePlanExercise(index: number, updater: (item: PlanExercise) => PlanExercise) {
    if (!editor) return; const next = [...editor.exercises]; next[index] = updater(next[index]); setEditor({ ...editor, exercises: next });
  }
  async function exportData() {
    const [allPlans, allSessions, allExercises] = await Promise.all([db.plans.toArray(), db.sessions.toArray(), db.exercises.toArray()]);
    const backup = { app: 'Kaizen', schemaVersion: 1, exportedAt: new Date().toISOString(), plans: allPlans, sessions: allSessions.filter((session) => session.status !== 'active'), customExercises: allExercises.filter((exercise) => exercise.custom) };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `kaizen-backup-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url); notify('Backup downloaded.');
  }
  async function importData(file?: File) {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (data.app !== 'Kaizen' || data.schemaVersion !== 1 || !Array.isArray(data.plans) || !Array.isArray(data.sessions)) throw new Error('This file is not a supported Kaizen backup.');
      const merge = window.confirm(`Found ${data.plans.length} plans and ${data.sessions.length} sessions. Choose OK to merge; Cancel to replace local workout data.`);
      if (!merge && !window.confirm('Replace all current plans, custom exercises, and completed sessions with this backup?')) return;
      await db.transaction('rw', db.plans, db.sessions, db.exercises, async () => {
        if (!merge) {
          await db.plans.clear(); await db.sessions.clear();
          const customItems = await db.exercises.filter((exercise) => exercise.custom === true).toArray();
          await db.exercises.bulkDelete(customItems.map((exercise) => exercise.id));
        }
        const planIds = new Map<number, number>();
        for (const plan of data.plans as Plan[]) {
          const oldId = plan.id; const copy = { ...plan, id: undefined }; const newId = await db.plans.add(copy);
          if (oldId !== undefined) planIds.set(oldId, newId);
        }
        for (const session of data.sessions as WorkoutSession[]) if (session.status === 'completed') { const copy = { ...session, id: undefined, planId: planIds.get(session.planId) ?? session.planId }; await db.sessions.add(copy); }
        if (Array.isArray(data.customExercises)) for (const exercise of data.customExercises as Exercise[]) { if (!(await db.exercises.get(exercise.id))) await db.exercises.add(exercise); }
      });
      notify(merge ? 'Backup merged.' : 'Backup restored.');
    } catch (error) { notify(error instanceof Error ? error.message : 'Could not read this backup.'); }
  }

  const filteredExercises = useMemo(() => (exercises ?? []).filter((exercise) => {
    const query = search.trim().toLowerCase(); const textMatch = !query || [exercise.name, ...exercise.aliases, ...exercise.muscles].join(' ').toLowerCase().includes(query);
    return textMatch && (category === 'All' || exercise.category === category);
  }), [exercises, search, category]);

  if (!plans || !exercises || !completedSessions) return <div className="loading"><span className="brand-mark">K</span><p>Getting your training space ready…</p></div>;

  const recentSession = completedSessions[0];
  const activePlan = plans[0];

  return <div className="app-shell">
    <header className="app-header"><a className="wordmark" href="#today" onClick={(event) => { event.preventDefault(); setScreen(activeSession ? 'workout' : 'today'); }}><span className="brand-mark">K</span><span>KAIZEN</span></a><div className="header-actions"><span className={`local-badge ${isOnline ? '' : 'offline'}`}><i /> {isOnline ? 'On this device' : 'Offline · saved here'}</span><button className="icon-button profile-button" aria-label="About Kaizen" onClick={() => setScreen('settings')}><CircleHelp size={17} /></button></div></header>
    <main className="main-content">
      {screen === 'today' && <TodayView plan={activePlan} activeSession={activeSession} recentSession={recentSession} onStart={() => activeSession ? setScreen('workout') : activePlan && void startPlan(activePlan)} onEdit={() => activePlan && editPlan(activePlan)} onPlans={() => setScreen('plans')} onProgress={() => setScreen('progress')} onDiscard={() => void discardWorkout()} />}
      {screen === 'plans' && <PlansView plans={plans} editor={editor} exercises={exercises} filteredExercises={filteredExercises} search={search} category={category} showPicker={showExercisePicker} showCustom={showCustom} customName={customName} customEquipment={customEquipment} onSearch={setSearch} onCategory={setCategory} onNew={newPlan} onEdit={editPlan} onStartPlan={(plan) => void startPlan(plan)} onDelete={(plan) => void deletePlan(plan)} onDuplicate={(plan) => void duplicatePlan(plan)} onSave={() => void savePlan()} onCancel={() => { setEditor(null); setShowExercisePicker(false); }} onName={(name) => editor && setEditor({ ...editor, name })} onOpenPicker={() => setShowExercisePicker(true)} onClosePicker={() => setShowExercisePicker(false)} onAddExercise={addExerciseToPlan} onSetCustom={setShowCustom} onCustomName={setCustomName} onCustomEquipment={setCustomEquipment} onCreateCustom={() => void addCustomExercise()} onRemoveExercise={(index) => { if (editor) setEditor({ ...editor, exercises: editor.exercises.filter((_, i) => i !== index) }); }} onUpdateExercise={updatePlanExercise} onReorder={reorderExercise} />}
      {screen === 'progress' && <Suspense fallback={<div className="loading-inline">Loading progress…</div>}><ProgressView onOpenSession={setSummarySession} sessions={completedSessions} range={chartRange} onRange={setChartRange} mode={chartMode} onMode={setChartMode} selected={selectedExercises} onSelected={setSelectedExercises} /></Suspense>}
      {screen === 'settings' && <SettingsView restSeconds={restSeconds} onRestSeconds={(value) => void updateRestPreference(value)} onExport={() => void exportData()} onImport={(file) => void importData(file)} />}
      {screen === 'workout' && activeSession && <WorkoutView session={activeSession} elapsedNow={elapsedNow} restSeconds={restSeconds} restRemaining={restRemaining} restEndAt={restEndAt} restPaused={restPaused} onBack={() => setScreen('today')} onFinish={() => void finishWorkout()} onDiscard={() => void discardWorkout()} onChange={changeSet} onComplete={toggleComplete} onAddSet={addWorkoutSet} onFocusExercise={focusWorkoutExercise} onSkip={skipExercise} onRest={() => void startRest()} onRestAdd={addRestTime} onRestStop={() => void clearRest()} />}
      {screen === 'workout' && !activeSession && <div className="empty-state"><span className="eyebrow">NO ACTIVE SESSION</span><h1>Ready when you are.</h1><button className="button-primary" onClick={() => setScreen('today')}>Back to Today</button></div>}
    </main>
    {screen !== 'workout' && <BottomNav screen={screen} onNavigate={(target) => { if (activeSession && target !== 'workout') setScreen(target); else setScreen(target); }} />}
    {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}
    {undoState && <div className="undo-toast"><span>Set logged</span><button onClick={() => void undoCompletion()}><Undo2 size={15} /> Undo</button></div>}
    {summarySession && <SessionSummary session={summarySession} onClose={() => setSummarySession(null)} />}
    {updateReady && <div className="update-toast" role="status"><span>A new version is ready.</span><button onClick={() => applyUpdate?.()}>Refresh</button><button aria-label="Dismiss update" onClick={() => setUpdateReady(false)}><X size={15} /></button></div>}
  </div>;
}

function TodayView({ plan, activeSession, recentSession, onStart, onEdit, onPlans, onProgress, onDiscard }: { plan?: Plan; activeSession?: WorkoutSession; recentSession?: WorkoutSession; onStart: () => void; onEdit: () => void; onPlans: () => void; onProgress: () => void; onDiscard: () => void }) {
  const count = plan?.exercises.length ?? 0; const sessionDuration = recentSession?.endedAt && recentSession.startedAt ? formatElapsed(recentSession.startedAt, recentSession.endedAt) : '';
  return <section className="screen-view"><div className="page-heading"><span className="eyebrow">{new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase()}</span><h1>{activeSession ? 'Pick up where you left off.' : 'Ready when you are.'}</h1><p>Small steps. Solid progress.</p></div>
    <article className="hero-card"><div className="hero-top"><div><span className="eyebrow">{activeSession ? 'YOUR ACTIVE SESSION' : 'YOUR NEXT SESSION'}</span><h2>{activeSession?.planName ?? plan?.name ?? 'Create your first plan'}</h2></div><span className="count-pill">{activeSession ? activeSession.exercises.filter((exercise) => exercise.sets.some((set) => set.completed)).length + ' sets done' : `${count} exercises`}</span></div><div className="hero-meta"><span><Clock3 size={15} /> {activeSession ? formatElapsed(activeSession.startedAt) : `~${Math.max(20, count * 8)} min`}</span><span><ListChecks size={15} /> {recentSession ? `Last trained ${formatDate(recentSession.startedAt)}` : 'Your first session'}</span></div><button className="button-primary hero-action" onClick={onStart}>{activeSession ? 'Continue workout' : 'Start workout'} <ChevronRight size={18} /></button></article>
    <div className="section-heading"><h2>{activeSession ? 'In this session' : 'Your plan'}</h2><button className="text-button" onClick={activeSession ? onStart : onEdit}>{activeSession ? 'Open workout' : plan ? 'Edit plan' : 'Create plan'}</button></div>
    {plan ? <div className="exercise-list">{plan.exercises.slice(0, 5).map((exercise) => <ExerciseRow key={exercise.id} exercise={exercise} detail={`${exercise.sets.length} sets · ${exercise.workingWeightKg === null ? 'Bodyweight' : `${exercise.workingWeightKg} kg total`}`} />)}{plan.exercises.length > 5 && <button className="list-more" onClick={onEdit}>+ {plan.exercises.length - 5} more exercises</button>}</div> : <div className="empty-card"><Dumbbell /><p>Build a plan from the exercise library.</p><button className="button-secondary" onClick={onPlans}>Browse plans</button></div>}
    <div className="section-heading"><h2>Recent progress</h2><button className="text-button" onClick={onProgress}>View trends</button></div>
    {recentSession ? <ProgressSnapshot session={recentSession} onOpen={onProgress} /> : <div className="quiet-card"><div className="quiet-icon"><BarChart3 /></div><div><strong>Your progress starts here</strong><p>Finish a session and your exercise trends will appear.</p></div></div>}
    {activeSession && <button className="quiet-link danger-link" onClick={onDiscard}>Discard active workout</button>}
    {recentSession?.endedAt && <p className="last-session">Last session · {formatDate(recentSession.startedAt)} · {sessionDuration}</p>}
  </section>;
}

function ExerciseRow({ exercise, detail }: { exercise: Pick<Exercise, 'name' | 'equipment' | 'art'>; detail: string }) {
  return <div className="exercise-row"><Art exercise={exercise} size="small" /><div className="exercise-row-copy"><strong>{exercise.name}</strong><small>{detail}</small></div><ChevronRight className="muted-icon" size={18} /></div>;
}

function PlansView(props: {
  plans: Plan[]; editor: Plan | null; exercises: Exercise[]; filteredExercises: Exercise[]; search: string; category: string; showPicker: boolean; showCustom: boolean; customName: string; customEquipment: Exercise['equipment'];
  onSearch: (value: string) => void; onCategory: (value: string) => void; onNew: () => void; onEdit: (plan: Plan) => void; onStartPlan: (plan: Plan) => void; onDelete: (plan: Plan) => void; onDuplicate: (plan: Plan) => void; onSave: () => void; onCancel: () => void; onName: (name: string) => void;
  onOpenPicker: () => void; onClosePicker: () => void; onAddExercise: (exercise: Exercise) => void; onSetCustom: (value: boolean) => void; onCustomName: (name: string) => void; onCustomEquipment: (value: Exercise['equipment']) => void; onCreateCustom: () => void; onRemoveExercise: (index: number) => void;
  onUpdateExercise: (index: number, updater: (item: PlanExercise) => PlanExercise) => void; onReorder: (index: number, direction: -1 | 1) => void;
}) {
  if (props.editor) return <PlanEditor {...props} />;
  return <section className="screen-view"><div className="page-heading"><span className="eyebrow">YOUR TRAINING</span><div className="heading-row"><div><h1>Plans</h1><p>Built around the way you train.</p></div><button className="round-action" aria-label="Create plan" onClick={props.onNew}><Plus /></button></div></div>
    <div className="plan-list">{props.plans.map((plan) => <article className="plan-card" key={plan.id}><button className="plan-main" onClick={() => props.onEdit(plan)}><span className="plan-symbol"><Dumbbell /></span><span className="plan-name"><strong>{plan.name}</strong><small>{plan.exercises.length} exercises · Updated {formatDate(plan.updatedAt)}</small></span><ChevronRight size={18} /></button><div className="plan-actions"><button className="start-plan-action" onClick={() => props.onStartPlan(plan)}><Check size={14} /> Start</button><button onClick={() => props.onEdit(plan)}><Pencil size={14} /> Edit</button><button onClick={() => props.onDuplicate(plan)}><Copy size={14} /> Duplicate</button><button className="danger-link" onClick={() => props.onDelete(plan)}><Trash2 size={14} /> Delete</button></div></article>)}</div>
    <button className="button-secondary full-button" onClick={props.onNew}><Plus size={17} /> Create a plan</button><div className="section-heading"><h2>Exercise library</h2><span className="eyebrow">{props.exercises.length} MOVEMENTS</span></div><ExerciseBrowser {...props} compact />
    {props.showCustom && <Modal title="Create your exercise" onClose={() => props.onSetCustom(false)}><div className="custom-form"><label className="field-label" htmlFor="custom-exercise-name">EXERCISE NAME</label><input id="custom-exercise-name" className="search-input" placeholder="e.g. Smith machine squat" value={props.customName} onChange={(e) => props.onCustomName(e.target.value)} autoFocus /><label className="field-label" htmlFor="custom-equipment">EQUIPMENT</label><select id="custom-equipment" className="search-input" value={props.customEquipment} onChange={(e) => props.onCustomEquipment(e.target.value as Exercise['equipment'])}>{Object.entries(equipmentLabel).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><button className="button-primary full-button" onClick={props.onCreateCustom}>Create exercise</button></div></Modal>}
  </section>;
}

function PlanEditor(props: Parameters<typeof PlansView>[0]) {
  const editor = props.editor!;
  return <section className="screen-view editor-view"><div className="editor-top"><button className="back-button" onClick={props.onCancel}><ChevronLeft /> Plans</button><button className="text-button" onClick={props.onSave}>Save plan</button></div><label className="field-label" htmlFor="plan-title">PLAN NAME</label><input id="plan-title" className="title-input" value={editor.name} placeholder="e.g. Upper body A" onChange={(e) => props.onName(e.target.value)} autoFocus /><div className="section-heading editor-section"><h2>Exercises <span className="soft-count">{editor.exercises.length}</span></h2></div>
    {editor.exercises.length ? <div className="plan-exercises">{editor.exercises.map((exercise, index) => <article className="edit-exercise" key={exercise.id}><div className="edit-exercise-head"><Art exercise={exercise} size="small" /><div className="exercise-row-copy"><strong>{exercise.name}</strong><small>{equipmentLabel[exercise.equipment]}</small></div><div className="reorder-buttons"><button aria-label="Move up" onClick={() => props.onReorder(index, -1)}>↑</button><button aria-label="Move down" onClick={() => props.onReorder(index, 1)}>↓</button></div><button className="icon-button danger-icon" aria-label={`Remove ${exercise.name}`} onClick={() => props.onRemoveExercise(index)}><X size={18} /></button></div>
      <div className="edit-fields"><div><label>WORKING LOAD</label><div className="input-with-unit"><input type="number" min="0" step="0.5" value={exercise.workingWeightKg ?? ''} placeholder={exercise.loadType === 'none' ? '—' : '0'} disabled={exercise.loadType === 'none'} onChange={(e) => props.onUpdateExercise(index, (item) => ({ ...item, workingWeightKg: e.target.value === '' ? null : Number(e.target.value) }))} /><span>kg total</span></div></div><div><label>SETS</label><div className="input-with-unit"><input type="number" min="1" max="20" value={exercise.sets.length} onChange={(e) => props.onUpdateExercise(index, (item) => { const count = Math.max(1, Math.min(20, Number(e.target.value) || 1)); const sets = Array.from({ length: count }, (_, i) => item.sets[i] ?? { reps: 8 }); return { ...item, sets }; })} /><span>sets</span></div></div></div>
      <div className="set-targets">{exercise.sets.map((set, setIndex) => <label key={setIndex}>Set {setIndex + 1}<input type="number" min="0" max="999" value={set.reps} aria-label={`Target reps for ${exercise.name}, set ${setIndex + 1}`} onChange={(e) => props.onUpdateExercise(index, (item) => ({ ...item, sets: item.sets.map((value, j) => j === setIndex ? { reps: Math.max(0, Number(e.target.value) || 0) } : value) }))} /><span>reps</span></label>)}</div>
      <div className="machine-settings">{exercise.settings.map((setting, settingIndex) => <div className="machine-setting" key={settingIndex}><input aria-label="Machine setting label" value={setting.label} placeholder={`Setting ${settingIndex + 1}`} onChange={(e) => props.onUpdateExercise(index, (item) => ({ ...item, settings: item.settings.map((value, j) => j === settingIndex ? { ...value, label: e.target.value } : value) }))} /><input aria-label="Machine setting value" value={setting.value} placeholder="Value" onChange={(e) => props.onUpdateExercise(index, (item) => ({ ...item, settings: item.settings.map((value, j) => j === settingIndex ? { ...value, value: e.target.value } : value) }))} /></div>)}{exercise.settings.length < 2 && <button className="text-button add-setting" onClick={() => props.onUpdateExercise(index, (item) => ({ ...item, settings: [...item.settings, { label: `Setting ${item.settings.length + 1}`, value: '' }] }))}>+ Add machine setting</button>}</div>
    </article>)}</div> : <div className="empty-card"><Dumbbell /><p>Add exercises to shape your plan.</p></div>}
    <button className="button-secondary full-button add-exercise-button" onClick={props.onOpenPicker}><Plus size={17} /> Add exercise</button><p className="privacy-note">Changes to this plan will not change completed sessions.</p>
    {props.showPicker && <Modal title="Add exercises" onClose={props.onClosePicker}><ExerciseBrowser {...props} /></Modal>}
    {props.showCustom && <Modal title="Create your exercise" onClose={() => props.onSetCustom(false)}><div className="custom-form"><label className="field-label">EXERCISE NAME</label><input className="search-input" placeholder="e.g. Smith machine squat" value={props.customName} onChange={(e) => props.onCustomName(e.target.value)} autoFocus /><label className="field-label">EQUIPMENT</label><select className="search-input" value={props.customEquipment} onChange={(e) => props.onCustomEquipment(e.target.value as Exercise['equipment'])}>{Object.entries(equipmentLabel).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><button className="button-primary full-button" onClick={props.onCreateCustom}>Create & add</button></div></Modal>}
  </section>;
}

function ExerciseBrowser(props: Parameters<typeof PlansView>[0] & { compact?: boolean }) {
  const categories = ['All', ...Array.from(new Set(props.exercises.map((exercise) => exercise.category)))];
  return <div className="exercise-browser"><div className="search-box"><Search size={17} /><input placeholder="Search movements" value={props.search} onChange={(e) => props.onSearch(e.target.value)} /><button className="custom-mini" onClick={() => props.onSetCustom(true)}>＋ Custom</button></div><div className="filter-chips">{categories.map((item) => <button className={props.category === item ? 'selected' : ''} key={item} onClick={() => props.onCategory(item)}>{item}</button>)}</div><div className="catalog-list">{props.filteredExercises.map((exercise) => <button className="catalog-row" key={exercise.id} onClick={() => props.onAddExercise(exercise)}><Art exercise={exercise} size="small" /><span className="catalog-copy"><strong>{exercise.name}</strong><small>{equipmentLabel[exercise.equipment]}{exercise.muscles.length ? ` · ${prettyGroup(exercise.muscles[0])}` : ''}</small></span>{props.editor?.exercises.some((item) => item.exerciseId === exercise.id) ? <Check className="lime-icon" size={19} /> : <Plus size={18} className="muted-icon" />}</button>)}</div>{props.filteredExercises.length === 0 && <div className="empty-search">No movements found. Try a shorter search or add a custom exercise.</div>}</div>;
}

function WorkoutView(props: { session: WorkoutSession; elapsedNow: number; restSeconds: number; restRemaining: number | null; restEndAt: number | null; restPaused: boolean; onBack: () => void; onFinish: () => void; onDiscard: () => void; onChange: (ei: number, si: number, field: 'reps' | 'weightKg', value: number | null) => void; onComplete: (ei: number, si: number) => void; onAddSet: (index: number) => void; onFocusExercise: (index: number) => void; onSkip: (index: number) => void; onRest: () => void; onRestAdd: (seconds: number) => void; onRestStop: () => void }) {
  const { session } = props; const [expanded, setExpanded] = useState<number | null>(null);
  const totalSets = session.exercises.reduce((total, exercise) => total + exercise.sets.length, 0); const doneSets = session.exercises.reduce((total, exercise) => total + exercise.sets.filter((set) => set.completed).length, 0);
  const firstIncomplete = session.exercises.findIndex((exercise) => !exercise.skipped && exercise.sets.some((set) => !set.completed));
  const focusedExerciseIndex = session.currentExerciseIndex ?? null;
  const focusedExercise = focusedExerciseIndex === null ? undefined : session.exercises[focusedExerciseIndex];
  const currentIndex = focusedExercise && !focusedExercise.skipped && focusedExercise.sets.some((set) => !set.completed) ? focusedExerciseIndex! : Math.max(0, firstIncomplete);
  const currentExercise = session.exercises[currentIndex]; const currentSetIndex = currentExercise?.sets.findIndex((set) => !set.completed) ?? -1;
  return <section className="screen-view workout-screen"><div className="workout-bar"><button className="back-icon" onClick={props.onBack} aria-label="Back"><ChevronLeft /></button><div className="workout-heading"><strong>{session.planName}</strong><small>IN PROGRESS · {formatElapsed(session.startedAt, props.elapsedNow)}</small></div><button className="finish-link" onClick={props.onFinish}>Finish</button></div>
    <div className="session-progress-head"><span>{currentExercise ? `EXERCISE ${currentIndex + 1} OF ${session.exercises.length}` : 'ALL SETS DONE'}</span><span>{doneSets} / {totalSets} SETS</span></div><div className="session-progress"><span style={{ width: `${totalSets ? doneSets / totalSets * 100 : 0}%` }} /></div>
    {currentExercise && currentSetIndex >= 0 && <>
      <div className="active-exercise-card"><div className="active-exercise-art"><Art exercise={currentExercise} size="large" /></div><div className="active-exercise-copy"><span className="eyebrow">{equipmentLabel[currentExercise.equipment]}{currentExercise.muscles[0] ? ` · ${prettyGroup(currentExercise.muscles[0])}` : ''}</span><h1>{currentExercise.name}</h1>{currentExercise.settings.filter((setting) => setting.value).map((setting) => <span className="machine-chip" key={setting.label}>{setting.label} <b>{setting.value}</b></span>)}<p>Last session shown beside today’s set.</p></div></div>
      <div className="set-table-head"><span>SET</span><span>LAST TIME</span><span>TODAY</span><span /></div>
      <div className="set-table">{currentExercise.sets.map((set, setIndex) => <SetRow key={setIndex} set={set} index={setIndex} exercise={currentExercise} expanded={expanded === setIndex} onExpand={() => setExpanded(expanded === setIndex ? null : setIndex)} onChange={(field, value) => props.onChange(currentIndex, setIndex, field, value)} onComplete={() => props.onComplete(currentIndex, setIndex)} />)}</div>
      <button className="add-workout-set" onClick={() => props.onAddSet(currentIndex)}><Plus size={15} /> Add set</button>
      <div className="workout-controls"><button className={`rest-button ${props.restRemaining !== null ? 'rest-active' : ''}`} onClick={props.onRest}>{props.restRemaining !== null ? <><Clock3 size={17} /> {props.restPaused ? 'Resume' : 'Pause'} · {Math.floor(props.restRemaining / 60)}:{String(props.restRemaining % 60).padStart(2, '0')}</> : <><Clock3 size={17} /> Start rest</>}</button><button className="skip-button" onClick={() => props.onSkip(currentIndex)}><SkipForward size={16} /> Skip exercise</button></div>
      {props.restRemaining !== null && <div className="rest-adjust"><button onClick={() => props.onRestAdd(-15)}>−15 sec</button><button onClick={() => props.onRestAdd(15)}>+15 sec</button><button onClick={props.onRestStop}>Stop rest</button></div>}
      <button className="button-primary complete-next" onClick={() => props.onComplete(currentIndex, currentSetIndex)}><Check size={18} /> Log set {currentSetIndex + 1}</button>
    </>}
    {(!currentExercise || currentSetIndex < 0) && <div className="all-done-card"><span className="success-mark"><Check /></span><h1>That’s the work.</h1><p>Every set is logged. Finish now or review your workout.</p><button className="button-primary full-button" onClick={props.onFinish}>Finish workout</button></div>}
    <div className="session-exercise-list"><div className="section-heading"><h2>Session plan</h2><span className="soft-count">{doneSets} complete</span></div>{session.exercises.map((exercise, index) => <button key={exercise.id} className={`session-exercise ${index === currentIndex ? 'current' : ''} ${exercise.skipped ? 'skipped' : ''}`} onClick={() => { if (!exercise.skipped && exercise.sets.some((set) => !set.completed)) { props.onFocusExercise(index); setExpanded(null); } }} aria-current={index === currentIndex ? 'step' : undefined}><span className="session-index">{exercise.skipped ? '—' : exercise.sets.every((set) => set.completed) ? <Check size={15} /> : String(index + 1).padStart(2, '0')}</span><span><strong>{exercise.name}</strong><small>{exercise.sets.filter((set) => set.completed).length}/{exercise.sets.length} sets · {exercise.workingWeightKg === null ? 'Bodyweight' : `${exercise.workingWeightKg} kg total`}</small></span><ChevronRight size={17} /></button>)}</div>
    <button className="discard-link" onClick={props.onDiscard}>Discard this workout</button>
  </section>;
}

function SetRow({ set, index, exercise, expanded, onExpand, onChange, onComplete }: { set: SessionSet; index: number; exercise: SessionExercise; expanded: boolean; onExpand: () => void; onChange: (field: 'reps' | 'weightKg', value: number | null) => void; onComplete: () => void }) {
  return <article className={`set-row ${set.completed ? 'is-done' : ''}`}><button className="set-number" onClick={onExpand} aria-label={`Set ${index + 1}, ${set.completed ? 'completed' : 'not completed'}`}>{set.completed ? <Check size={16} /> : index + 1}</button><div className="prior-values"><strong>{set.previousReps ?? '—'}</strong><small>{set.previousWeightKg === null ? 'reps' : `${set.previousWeightKg} kg`}</small></div><div className="today-values"><NumberStepper label={`Set ${index + 1} reps`} value={set.reps} unit="reps" onChange={(value) => onChange('reps', value)} /><NumberStepper label={`Set ${index + 1} total weight`} value={set.weightKg} unit="kg" nullable={exercise.loadType === 'none'} onChange={(value) => onChange('weightKg', value)} /></div><button className={`set-check ${set.completed ? 'checked' : ''}`} onClick={onComplete} aria-label={set.completed ? 'Undo set completion' : 'Log this set'}>{set.completed ? <Check size={18} /> : <span />}</button>{expanded && <div className="set-expanded"><span>{set.previousReps === null ? 'New set · based on plan target' : `Last time: ${set.previousReps} reps${set.previousWeightKg !== null ? ` at ${set.previousWeightKg} kg` : ''}`}</span><button onClick={onComplete}>{set.completed ? 'Mark incomplete' : 'Log set'}</button></div>}</article>;
}
function NumberStepper({ label, value, unit, nullable = false, onChange }: { label: string; value: number | null; unit: string; nullable?: boolean; onChange: (value: number | null) => void }) {
  return <div className="stepper-wrap"><div className="number-stepper"><button aria-label={`Decrease ${label}`} onClick={() => onChange(Math.max(0, (value ?? 0) - (unit === 'kg' ? 0.5 : 1)))}>−</button><input aria-label={label} type="number" min="0" step={unit === 'kg' ? '0.5' : '1'} value={value ?? ''} placeholder={nullable ? '—' : '0'} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} /><button aria-label={`Increase ${label}`} onClick={() => onChange((value ?? 0) + (unit === 'kg' ? 0.5 : 1))}>+</button></div><span>{unit}</span></div>;
}

function ProgressSnapshot({ session, onOpen }: { session: WorkoutSession; onOpen: () => void }) {
  const latest = session.exercises.slice(0, 3);
  return <button className="snapshot-card" onClick={onOpen}><div className="snapshot-head"><span className="eyebrow">LAST SESSION · {formatDate(session.startedAt).toUpperCase()}</span><ChevronRight size={17} /></div><div className="snapshot-list">{latest.map((exercise) => <div key={exercise.id}><span>{exercise.name}</span><strong>{exercise.sets.filter((set) => set.completed).reduce((sum, set) => sum + set.reps, 0)} <small>reps</small></strong></div>)}</div><span className="snapshot-foot">See all trends <ChevronRight size={14} /></span></button>;
}

function SettingsView({ restSeconds, onRestSeconds, onExport, onImport }: { restSeconds: number; onRestSeconds: (value: number) => void; onExport: () => void; onImport: (file?: File) => void }) {
  return <section className="screen-view"><div className="page-heading"><span className="eyebrow">YOUR APP</span><h1>Settings</h1><p>Keep it simple. Make it yours.</p></div><div className="settings-section"><h2>Workout</h2><div className="setting-row"><div className="setting-icon">kg</div><div><strong>Weight unit</strong><small>All values are in kilograms</small></div><span className="fixed-label">FIXED</span></div><div className="setting-row"><div className="setting-icon"><Clock3 size={17} /></div><div className="setting-fill"><strong>Rest timer default</strong><small>Quick-start duration</small></div><select value={restSeconds} onChange={(e) => onRestSeconds(Number(e.target.value))} aria-label="Default rest duration"><option value={60}>60 seconds</option><option value={90}>90 seconds</option><option value={120}>2 minutes</option><option value={180}>3 minutes</option><option value={240}>4 minutes</option></select></div></div>
    <div className="settings-section"><h2>Your data</h2><div className="setting-row"><div className="setting-icon"><Share size={17} /></div><div><strong>Export backup</strong><small>Save plans and completed sessions as JSON</small></div><button className="text-button" onClick={onExport}>Export</button></div><div className="setting-row"><div className="setting-icon"><Undo2 size={17} /></div><div><strong>Restore backup</strong><small>Merge or replace from a Kaizen backup</small></div><label className="text-button file-button">Import<input type="file" accept="application/json,.json" onChange={(e) => onImport(e.target.files?.[0])} /></label></div><div className="privacy-box"><CircleHelp size={18} /><p>Your workouts stay in this browser on this device. Export a backup before switching browsers, clearing site data, or changing the site address.</p></div></div>
    <div className="settings-section"><h2>About Kaizen</h2><div className="about-credit"><Art exercise={{ art: null, name: 'exercise', equipment: 'barbell' }} size="small" /><span>Exercise data by <a href="https://repdb.co" target="_blank" rel="noreferrer">RepDB</a></span></div><p className="version-note">Kaizen · English · kilograms<br />Your training, saved locally.</p></div>
  </section>;
}

function BottomNav({ screen, onNavigate }: { screen: Screen; onNavigate: (screen: Screen) => void }) {
  const items: { id: Screen; label: string; icon: typeof Home }[] = [{ id: 'today', label: 'Today', icon: Home }, { id: 'plans', label: 'Plans', icon: ListChecks }, { id: 'progress', label: 'Progress', icon: BarChart3 }, { id: 'settings', label: 'Settings', icon: Settings }];
  return <nav className="bottom-nav" aria-label="Main navigation">{items.map(({ id, label, icon: Icon }) => <button key={id} className={screen === id ? 'active' : ''} onClick={() => onNavigate(id)} aria-current={screen === id ? 'page' : undefined}><Icon size={21} strokeWidth={1.8} /><span>{label}</span></button>)}</nav>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => { const key = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, [onClose]);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><section className="modal-sheet" role="dialog" aria-modal="true" aria-label={title}><div className="modal-handle" /><div className="modal-header"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button></div>{children}</section></div>;
}

function SessionSummary({ session, onClose }: { session: WorkoutSession; onClose: () => void }) {
  const totalSets = session.exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.completed).length, 0);
  const totalReps = session.exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.completed).reduce((reps, set) => reps + set.reps, 0), 0);
  return <Modal title="Workout details" onClose={onClose}><div className="summary-content"><span className="success-mark"><Check /></span><h2>{session.status === 'completed' ? 'That’s the work.' : 'Session saved'}</h2><p>{formatDate(session.startedAt)} · {formatElapsed(session.startedAt, session.endedAt)}</p><div className="summary-stats"><div><strong>{session.exercises.length}</strong><small>exercises</small></div><div><strong>{totalSets}</strong><small>sets</small></div><div><strong>{totalReps}</strong><small>reps</small></div></div><div className="summary-exercises">{session.exercises.map((exercise) => <div className="summary-exercise" key={exercise.id}><div><span>{exercise.name}</span><strong>{exercise.skipped ? 'Skipped' : `${exercise.sets.filter((set) => set.completed).length}/${exercise.sets.length}`}</strong></div>{exercise.sets.map((set, index) => set.completed && <small key={index}>Set {index + 1} · {set.reps} reps{set.weightKg !== null ? ` · ${set.weightKg} kg` : ''}</small>)}</div>)}</div><button className="button-primary full-button" onClick={onClose}>Done</button></div></Modal>;
}

export default App;
