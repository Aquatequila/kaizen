import Dexie, { type Table } from 'dexie';
import catalog from './exercises.json';
import type { AppSetting, Exercise, Plan, PlanExercise, SessionExercise, SessionSet, WorkoutSession } from '../types';

class KaizenDatabase extends Dexie {
  exercises!: Table<Exercise, string>;
  plans!: Table<Plan, number>;
  sessions!: Table<WorkoutSession, number>;
  settings!: Table<AppSetting, string>;

  constructor() {
    super('kaizen-local');
    this.version(1).stores({ exercises: 'id, name, category, equipment, custom', plans: '++id, name, updatedAt', sessions: '++id, planId, status, startedAt, endedAt', settings: 'key' });
  }
}

export const db = new KaizenDatabase();

const defaultPlanExercises: PlanExercise[] = [
  { id: crypto.randomUUID(), exerciseId: 'barbell-back-squat', name: 'Back squat', equipment: 'barbell', loadType: 'external', muscles: ['gluteus_maximus', 'quadriceps'], art: '/exercise-art/barbell-back-squat', workingWeightKg: 60, sets: [{ reps: 8 }, { reps: 8 }, { reps: 8 }], settings: [] },
  { id: crypto.randomUUID(), exerciseId: 'machines-and-cables-lat-pulldown', name: 'Lat pulldown', equipment: 'machine/cable', loadType: 'external', muscles: ['latissimus_dorsi'], art: '/exercise-art/machines-and-cables-lat-pulldown', workingWeightKg: 45, sets: [{ reps: 10 }, { reps: 10 }, { reps: 10 }], settings: [{ label: 'Seat', value: '4' }] },
  { id: crypto.randomUUID(), exerciseId: 'dumbbell-dumbbell-bench-press', name: 'Dumbbell bench press', equipment: 'dumbbell', loadType: 'external', muscles: ['pectoralis_major'], art: '/exercise-art/dumbbell-dumbbell-bench-press', workingWeightKg: 24, sets: [{ reps: 10 }, { reps: 10 }, { reps: 10 }], settings: [] },
];

export async function ensureSeedData() {
  await db.transaction('rw', db.exercises, db.plans, async () => {
    if (!(await db.exercises.count())) await db.exercises.bulkAdd(catalog as Exercise[]);
    if (!(await db.plans.count())) await db.plans.add({ name: 'Full body A', createdAt: Date.now(), updatedAt: Date.now(), exercises: defaultPlanExercises });
  });
}

export async function createSession(plan: Plan, lastSession?: WorkoutSession): Promise<number> {
  const previousByExercise = new Map<string, SessionExercise>();
  lastSession?.exercises.forEach((exercise) => previousByExercise.set(exercise.exerciseId, exercise));
  const exercises: SessionExercise[] = plan.exercises.map((exercise) => {
    const previous = previousByExercise.get(exercise.exerciseId);
    return {
      ...structuredClone(exercise),
      sets: exercise.sets.map((set, index) => {
        const prior = previous?.sets[index];
        return {
          reps: prior?.reps ?? set.reps,
          weightKg: prior?.weightKg ?? exercise.workingWeightKg,
          previousReps: prior?.reps ?? null,
          previousWeightKg: prior?.weightKg ?? null,
          completed: false,
        } satisfies SessionSet;
      }),
    };
  });
  return db.sessions.add({ planId: plan.id!, planName: plan.name, status: 'active', startedAt: Date.now(), exercises });
}
