import { Badge } from "@/components/ui/Badge";
import type { Availability } from "@/convex/tools";
import { formatDate } from "@/lib/format";

export function AvailabilityBadge({ availability }: { availability: Availability }) {
  return availability.state === "available" ? (
    <Badge tone="green">Available</Badge>
  ) : (
    <Badge tone="amber">On loan until {formatDate(availability.until)}</Badge>
  );
}
