import type { ReactNode } from "react";
import { EmptyState, LoadingState } from "@/components/ui/States";
import type { LoanView } from "./LoanCard";

type Props = { loans: LoanView[] | undefined; emptyTitle: string; emptyHint: string; render: (loan: LoanView) => ReactNode };

export function LoanList({ loans, emptyTitle, emptyHint, render }: Props) {
  if (loans === undefined) return <LoadingState />;
  if (loans.length === 0) return <EmptyState title={emptyTitle}>{emptyHint}</EmptyState>;
  return <ul className="space-y-3">{loans.map(render)}</ul>;
}
