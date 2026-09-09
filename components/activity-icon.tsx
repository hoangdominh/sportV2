import { activityLabels, getActivityType } from "@/lib/activity";

const icons = { badminton: "🏸", football: "⚽", pickleball: "🏓", dining: "🍽️", travel: "🧳", other: "📌" };

export function ActivityIcon({ activityType }: { activityType?: string }) {
  const type = getActivityType(activityType);
  return <span role="img" aria-label={activityLabels[type]} title={activityLabels[type]} className="mr-1.5 inline-block shrink-0 align-middle text-base">{icons[type]}</span>;
}
