export const activityTypes = ["badminton", "football", "pickleball", "dining", "travel", "other"] as const;
export type ActivityType = (typeof activityTypes)[number];

export const activityLabels: Record<ActivityType, string> = {
  badminton: "Cầu lông",
  football: "Bóng đá",
  pickleball: "Pickleball",
  dining: "Ăn uống",
  travel: "Du lịch",
  other: "Khác"
};

export function isActivityType(value: unknown): value is ActivityType {
  return typeof value === "string" && activityTypes.some((type) => type === value);
}

export function getActivityType(value: unknown): ActivityType {
  return isActivityType(value) ? value : "other";
}
