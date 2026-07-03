"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Zustand store for the Dynamic Quiz Generator.
 * Holds current step, history, collected variables, tracking params, and progress.
 */
export const useQuizStore = create(
  persist(
    (set, get) => ({
      currentStepId: null,
      history: [],
      variables: {},
      tracking: {},
      progress: 0,
      startedAt: Date.now(),
      isLoading: false,

      /* -------------------- initialization -------------------- */
      init: (config, urlParams) => {
        const tracking = {};
        (config.tracking?.captureParams || []).forEach((key) => {
          const val = urlParams.get(key);
          if (val) tracking[key] = val;
        });

        // seed defaults from variable definitions
        const seed = {};
        (config.variables || []).forEach((v) => {
          if (v.defaultValue !== undefined) seed[v.key] = v.defaultValue;
        });

        set({
          currentStepId: config.startStepId,
          history: [config.startStepId],
          variables: { ...seed, ...get().variables },
          tracking: { ...get().tracking, ...tracking },
          progress: 0,
          startedAt: Date.now(),
        });
      },

      /* -------------------- variables -------------------- */
      setVariable: (key, value) =>
        set((s) => ({ variables: { ...s.variables, [key]: value } })),

      setVariables: (obj) =>
        set((s) => ({ variables: { ...s.variables, ...obj } })),

      /* -------------------- navigation -------------------- */
      goToStep: (stepId, totalSteps) =>
        set((s) => {
          const history = [...s.history, stepId];
          const idx = totalSteps ? Math.min(history.length, totalSteps) : history.length;
          const progress = totalSteps ? Math.round((idx / totalSteps) * 100) : s.progress;
          return { currentStepId: stepId, history, progress };
        }),

      back: () =>
        set((s) => {
          if (s.history.length <= 1) return s;
          const history = s.history.slice(0, -1);
          return {
            currentStepId: history[history.length - 1],
            history,
          };
        }),

      setLoading: (v) => set({ isLoading: v }),

      reset: () =>
        set({
          currentStepId: null,
          history: [],
          variables: {},
          tracking: {},
          progress: 0,
          startedAt: Date.now(),
          isLoading: false,
        }),
    }),
    {
      name: "quiz_runtime_v1",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? window.sessionStorage : undefined)),
      partialize: (state) => ({
        variables: state.variables,
        tracking: state.tracking,
      }),
    }
  )
);
