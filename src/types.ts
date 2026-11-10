export type Equipment = 'barbell' | 'dumbbell' | 'machine/cable' | 'kettlebell' | 'bodyweight' | 'band';
export type LoadType = 'external' | 'none' | 'variable';

export interface Exercise {
  id: string;
  name: string;
  category: string;
  equipment: Equipment;
  loadType: LoadType;
  muscles: string[];
  aliases: string[];
  art: string | null;
  artSourceId: string | null;
  settings: string[];
  custom?: boolean;
}

export interface PlanSet { reps: number; }
export interface MachineSetting { label: string; value: string; }
export interface PlanExercise {
  id: string;
  exerciseId: string;
  name: string;
  equipment: Equipment;
  loadType: LoadType;
  muscles: string[];
  art: string | null;
  workingWeightKg: number | null;
  sets: PlanSet[];
  settings: MachineSetting[];
}
export interface Plan {
  id?: number;
  name: string;
  createdAt: number;
  updatedAt: number;
  exercises: PlanExercise[];
}

export interface SessionSet {
  reps: number;
  weightKg: number | null;
  previousReps: number | null;
  previousWeightKg: number | null;
  completed: boolean;
  completedAt?: number;
}
export interface SessionExercise extends PlanExercise {
  sets: SessionSet[];
  skipped?: boolean;
}
export interface WorkoutSession {
  id?: number;
  planId: number;
  planName: string;
  status: 'active' | 'completed' | 'discarded';
  startedAt: number;
  endedAt?: number;
  restEndAt?: number;
  exercises: SessionExercise[];
}
export interface AppSetting { key: string; value: unknown; }
