/*
 * debugTrace.ts – Minimal store instrumentation for chat debugging.
 *
 * Subscribes to Redux store changes and logs chat session metrics to the
 * console so we can verify that messages are flowing through the state layer.
 *
 * Guarded behind a development-only check so it will be tree-shaken in
 * production builds.
 *
 * TODO // CLEANUP_DEV – Remove before production GA.
 */

import { store } from './shared/store';

// Bail out in production – this side-effect file should only be imported in dev.
if (import.meta.env.MODE === 'development') {
  let prevActiveSessionId: string | null = null;
  let prevMsgCount = 0;

  store.subscribe(() => {
    const state = store.getState();
    const activeSessionId = (state.entities as any)?.activeSessionId || null;
    const activeSession = activeSessionId ? (state.entities as any)?.sessions?.entities?.[activeSessionId] : null;
    const msgCount = activeSession?.messageIds?.length ?? 0;

    // Only log when something meaningful changes to reduce console spam.
    if (activeSessionId !== prevActiveSessionId || msgCount !== prevMsgCount) {
       
      console.log('%c[debugTrace]', 'color: magenta; font-weight: bold', {
        activeSessionId,
        msgCount,
      });
      prevActiveSessionId = activeSessionId;
      prevMsgCount = msgCount;
    }
  });
} 