import { create } from "zustand";

type TypingState = {
  typed: string;
  charOk: boolean[];        // per-position correctness history (drives corrected on delete)
  errors: number;           // chars ever typed wrong (accuracy)
  corrected: number;        // wrong chars actually deleted via Backspace
  nonMotorErrors: number;   // wrong keys that are not adjacent-key slips
  timestamps: number[];     // per-keystroke for hesitation analysis
  startTime: number | null;
  layoutWarning: boolean;   // Cyrillic detected
  capsLock: boolean;
  push: (ch: string, correct: boolean, t: number, motorTypo?: boolean) => void;
  backspace: (count?: number) => void; // pops N chars; deleted wrong chars count as corrected
  setCapsLock: (on: boolean) => void;
  reset: () => void;
};

export const useTypingStore = create<TypingState>((set) => ({
  typed: "",
  charOk: [],
  errors: 0,
  corrected: 0,
  nonMotorErrors: 0,
  timestamps: [],
  startTime: null,
  layoutWarning: false,
  capsLock: false,
  push: (ch, correct, t, motorTypo = false) =>
    set((s) => ({
      typed: s.typed + ch,
      charOk: [...s.charOk, correct],
      errors: s.errors + (correct ? 0 : 1),
      nonMotorErrors: s.nonMotorErrors + (!correct && !motorTypo ? 1 : 0),
      timestamps: [...s.timestamps, t],
      startTime: s.startTime ?? t,
    })),
  backspace: (count = 1) =>
    set((s) => {
      const n = Math.min(count, s.typed.length);
      if (n === 0) return {};
      const wrongDeleted = s.charOk.slice(-n).filter((ok) => !ok).length;
      return {
        typed: s.typed.slice(0, -n),
        charOk: s.charOk.slice(0, -n),
        timestamps: s.timestamps.slice(0, -n),
        corrected: s.corrected + wrongDeleted,
      };
    }),
  setCapsLock: (on) => set({ capsLock: on }),
  reset: () =>
    set({
      typed: "",
      charOk: [],
      errors: 0,
      corrected: 0,
      nonMotorErrors: 0,
      timestamps: [],
      startTime: null,
      layoutWarning: false,
    }),
}));
