import { Profile } from "../types";

const PROFILE_KEY = "budgetbold-profile";

const FALLBACK_PROFILE: Profile = { name: "", email: "" };

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...FALLBACK_PROFILE };
    const parsed = JSON.parse(raw) as Partial<Profile>;
    return {
      name: typeof parsed.name === "string" ? parsed.name : "",
      email: typeof parsed.email === "string" ? parsed.email : "",
    };
  } catch {
    return { ...FALLBACK_PROFILE };
  }
}

export function saveProfile(profile: Profile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    return;
  }
}
