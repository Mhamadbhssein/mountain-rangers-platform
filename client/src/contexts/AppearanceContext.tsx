import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AppearancePreference = "light" | "auto" | "dark";
type ResolvedAppearance = "light" | "dark";

const STORAGE_KEY = "mr-appearance";

interface AppearanceContextValue {
  preference: AppearancePreference;
  resolved: ResolvedAppearance;
  setPreference: (value: AppearancePreference) => void;
}

const AppearanceContext = createContext<AppearanceContextValue | undefined>(undefined);

function readPreference(): AppearancePreference {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "dark" || stored === "auto" || stored === "light" ? stored : "light";
}

function systemPrefersDark() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}

/** Stores the member's Light / Auto / Dark choice; Auto follows the device setting. */
export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<AppearancePreference>(readPreference);
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return;
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setPreference = (value: AppearancePreference) => {
    setPreferenceState(value);
    window.localStorage.setItem(STORAGE_KEY, value);
  };

  const resolved: ResolvedAppearance = preference === "dark" || (preference === "auto" && systemDark) ? "dark" : "light";

  return <AppearanceContext.Provider value={{ preference, resolved, setPreference }}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error("useAppearance must be used within AppearanceProvider");
  return context;
}
