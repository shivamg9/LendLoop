import { Badge } from "@/components/ui/Badge";
import { CATEGORY_LABELS, type Category } from "@/convex/lib/constants";

export function CategoryLabel({ category }: { category: Category }) {
  return <Badge>{CATEGORY_LABELS[category]}</Badge>;
}
