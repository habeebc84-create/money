"use client";

import { useEffect, useState } from "react";

export type ThemePref = "system" | "light" | "dark";
export const THEME_KEY = "kaasu:theme";

/** Runs before paint (inlined in <head>) so there is no flash of the wrong theme. */
export const themeScript = `(function(){try{var p=localStorage.getItem('${THEME_KEY}')||'system';var d=p==='dark'||(p==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';}catch(e){document.documentElement.dataset.theme='light';}})();`;

function apply(pref: ThemePref): boolean {
  const dark = pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0c1410" : "#f3efe4");
  return dark;
}

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>("system");
  const [dark, setDark] = useState(false);
  useEffect(() => {
    let p: ThemePref = "system";
    try { p = (localStorage.getItem(THEME_KEY) as ThemePref) || "system"; } catch { /* storage blocked */ }
    if (!["system", "light", "dark"].includes(p)) p = "system";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPref(p);
    setDark(apply(p));
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => { if ((localStorage.getItem(THEME_KEY) || "system") === "system") setDark(apply("system")); };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const set = (p: ThemePref) => {
    setPref(p);
    try { localStorage.setItem(THEME_KEY, p); } catch { /* ignore */ }
    setDark(apply(p));
  };
  return { pref, dark, setPref: set };
}
