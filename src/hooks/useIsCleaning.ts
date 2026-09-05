import { useAuth } from "@/contexts/AuthContext";

export function useIsCleaning(): boolean {
  const { business } = useAuth();

  const industry = business?.industry?.trim().toLowerCase();

  if (!industry) {
    return false;
  }

  return ["clean", "janitorial", "maid", "housekeeping"].some((keyword) =>
    industry.includes(keyword)
  );
}
