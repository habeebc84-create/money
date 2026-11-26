"use client";

import { useEffect } from "react";

/** Registers the offline service worker in production builds only. */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => { /* offline support unavailable; app still works */ });
  }, []);
  return null;
}
