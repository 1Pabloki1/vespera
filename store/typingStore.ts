import { create } from "zustand";

type TypingState = {
  typed: string;
  errors: number;          // chars ever typed wrong (accuracy)
  corrected: number;       // wrong chars later fixed
  nonMotorErrors: number;  // wrong keys that are not adjacent-key slips
  timestamps: number[];    // per-keystroke for hesitation analysis
  lastKeyWasError: boolean;
  startTime: number | null;
  layoutWarning: boolean;  // Cyrillic detected
  capsLock: boolean;
  push: (ch: string, correct: boolean, t: number, motorTypo?: boolean) => void;
  backspace: () => void;
  setCapsLock: (on: boolean) => void;
  reset: () => void;
};

export const useTypingStore = create<TypingState>((set) => ({
  typed: "",
  errors: 0,
  corrected: 0,
  nonMotorErrors: 0,
  timestamps: [],
  lastKeyWasError: false,
  startTime: null,
  layoutWarning: false,
  capsLock: false,
  push: (ch, correct, t, motorTypo = false) =>
    set((s) => ({
      typed: s.typed + ch,
      errors: s.errors + (correct ? 0 : 1),
      nonMotorErrors: s.nonMotorErrors + (!correct && !motorTypo ? 1 : 0),
      corrected: s.corrected + (!correct && s.lastKeyWasError ? 1 : 0),
      timestamps: [...s.timestamps, t],
      lastKeyWasError: !correct,
      startTime: s.startTime ?? t,
    })),
  backspace: () =>
    set((s) => ({
      typed: s.typed.slice(0, -1),
      timestamps: s.timestamps.slice(0, -1),
      lastKeyWasError: false,
    })),
  setCapsLock: (on) => set({ capsLock: on }),
  reset: () =>
    set({
      typed: "",
      errors: 0,
      corrected: 0,
      nonMotorErrors: 0,
      timestamps: [],
      lastKeyWasError: false,
      startTime: null,
      layoutWarning: false,
    }),
}));
