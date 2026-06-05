import { create } from "zustand";

interface SettingsState {
  logo: string | null;
  referenceImage: string | null;
  setLogo: (logo: string | null) => void;
  setReferenceImage: (ref: string | null) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  logo: typeof window !== "undefined" ? localStorage.getItem("dv_logo") : null,
  referenceImage: typeof window !== "undefined" ? localStorage.getItem("dv_ref") : null,
  setLogo: (logo) => {
    if (typeof window !== "undefined") {
      if (logo) localStorage.setItem("dv_logo", logo);
      else localStorage.removeItem("dv_logo");
    }
    set({ logo });
  },
  setReferenceImage: (ref) => {
    if (typeof window !== "undefined") {
      if (ref) localStorage.setItem("dv_ref", ref);
      else localStorage.removeItem("dv_ref");
    }
    set({ referenceImage: ref });
  },
}));
