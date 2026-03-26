import type { MuscleGroup } from '../types'

export const MUSCLE_GROUPS: MuscleGroup[] = ['Chest', 'Shoulders', 'Back', 'Arms', 'Legs']

export const SUB_TYPES: Record<MuscleGroup, string[]> = {
  Chest: ['Upper Chest', 'Mid Chest', 'Lower Chest', 'Overall Chest'],
  Shoulders: ['Front Delt', 'Side Delt', 'Rear Delt', 'Traps'],
  Back: ['Lats', 'Upper Back', 'Lower Back', 'Rhomboids'],
  Arms: ['Biceps', 'Triceps', 'Forearms', 'Brachialis'],
  Legs: ['Quads', 'Hamstrings', 'Glutes', 'Calves', 'Adductors'],
}

export const EXERCISES: Record<MuscleGroup, Record<string, string[]>> = {
  Chest: {
    'Upper Chest': ['Incline Bench Press', 'Incline DB Press', 'Low Cable Fly', 'Guillotine Press'],
    'Mid Chest': ['Flat Bench Press', 'Flat DB Press', 'Machine Chest Press', 'Push-Ups'],
    'Lower Chest': ['Decline Press', 'Dip (Chest)', 'High Cable Fly', 'Decline DB Fly'],
    'Overall Chest': ['Cable Crossover', 'Pec Deck', 'Svend Press'],
  },
  Shoulders: {
    'Front Delt': ['Overhead Press', 'Arnold Press', 'Front Raise', 'Plate Front Raise'],
    'Side Delt': ['Lateral Raise', 'Cable Lateral', 'Upright Row', 'Machine Lateral'],
    'Rear Delt': ['Face Pull', 'Reverse Pec Deck', 'Rear Delt Fly', 'Cable Rear Delt'],
    Traps: ['Shrugs', 'Farmer Carry', 'Power Shrug', 'Behind Back Shrug'],
  },
  Back: {
    Lats: ['Pull-Up', 'Lat Pulldown', 'Single Arm Row', 'Straight Arm Pulldown'],
    'Upper Back': ['Barbell Row', 'T-Bar Row', 'Chest Supported Row', 'Seal Row'],
    'Lower Back': ['Hyperextension', 'RDL', 'Good Morning', 'Back Extension'],
    Rhomboids: ['Cable Row', 'Machine Row', 'Inverted Row', 'Band Pull Apart'],
  },
  Arms: {
    Biceps: ['Barbell Curl', 'DB Curl', 'Hammer Curl', 'Preacher Curl'],
    Triceps: ['Tricep Pushdown', 'Skull Crusher', 'Overhead Extension', 'Close Grip Bench'],
    Forearms: ['Wrist Curl', 'Reverse Curl', 'Farmer Hold', 'Pinwheel Curl'],
    Brachialis: ['Cross Body Hammer', 'Zottman Curl', 'Reverse Curl'],
  },
  Legs: {
    Quads: ['Back Squat', 'Leg Press', 'Leg Extension', 'Front Squat'],
    Hamstrings: ['Leg Curl', 'Romanian Deadlift', 'Nordic Curl', 'Glute Ham Raise'],
    Glutes: ['Hip Thrust', 'Bulgarian Split Squat', 'Cable Kickback', 'Step-Up'],
    Calves: ['Standing Calf Raise', 'Seated Calf Raise', 'Leg Press Calf', 'Donkey Calf'],
    Adductors: ['Copenhagen Plank', 'Cable Adduction', 'Sumo Squat', 'Adductor Machine'],
  },
}
