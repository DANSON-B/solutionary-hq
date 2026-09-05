/**
 * Cleaning-specific checklist templates by service type.
 * Used to auto-populate job checklists when a cleaning job is created.
 */

export const CLEANING_CHECKLISTS: Record<string, string[]> = {
  standard: [
    "Vacuum all floors",
    "Mop hard floors",
    "Dust all surfaces",
    "Clean kitchen counters",
    "Clean sinks & faucets",
    "Clean toilets",
    "Wipe mirrors",
    "Empty trash bins",
    "Make beds",
    "Wipe light switches & door handles",
  ],
  deep: [
    "Vacuum all floors & under furniture",
    "Mop & scrub hard floors",
    "Dust all surfaces including ceiling fans",
    "Clean & degrease stovetop",
    "Clean inside microwave",
    "Scrub shower & bathtub",
    "Clean toilets inside & out",
    "Clean all mirrors & glass",
    "Wipe baseboards",
    "Clean window sills & tracks",
    "Dust blinds & curtains",
    "Empty & wipe trash bins",
    "Clean light fixtures",
    "Wipe cabinet exteriors",
  ],
  "move-in/out": [
    "Vacuum all floors & closets",
    "Mop & scrub all hard floors",
    "Clean inside all cabinets & drawers",
    "Clean inside refrigerator",
    "Clean inside oven",
    "Clean inside dishwasher",
    "Scrub shower, bathtub & tiles",
    "Clean all toilets",
    "Clean all mirrors & windows interior",
    "Wipe baseboards throughout",
    "Clean window sills & tracks",
    "Clean light switches & outlets",
    "Clean garage floor (if applicable)",
    "Remove cobwebs throughout",
    "Clean laundry area",
    "Final walkthrough inspection",
  ],
};

export function getChecklistForType(title: string): string[] {
  const lower = title.toLowerCase();
  if (lower.includes("move") || lower.includes("move-in") || lower.includes("move-out")) {
    return CLEANING_CHECKLISTS["move-in/out"];
  }
  if (lower.includes("deep")) {
    return CLEANING_CHECKLISTS["deep"];
  }
  return CLEANING_CHECKLISTS["standard"];
}
