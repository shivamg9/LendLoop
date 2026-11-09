import type { FunctionReturnType } from "convex/server";
import type { ReactNode } from "react";
import { TrustedBadge } from "@/components/ui/Badge";
import type { api } from "@/convex/_generated/api";
import { formatDate } from "@/lib/format";
import { ActivityLine } from "./ActivityLine";
import { LoanStatusBadge } from "./LoanStatusBadge";

export type LoanView = FunctionReturnType<typeof api.loans.myRequests>[number];

type Props = { loan: LoanView; counterpartLabel: string; showTrust: boolean; actions?: ReactNode };

export function LoanCard({ loan, counterpartLabel, showTrust, actions }: Props) {
  return (
    <li className="rounded-lg border border-stone-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-medium">{loan.toolName}</h3>
          <p className="mt-0.5 text-sm text-stone-600">
            {formatDate(loan.startDate)} – {formatDate(loan.endDate)}
          </p>
        </div>
        <LoanStatusBadge status={loan.status} overdue={loan.overdue} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-stone-500">
        <span>{counterpartLabel}: {loan.counterpart.name}</span>
        {showTrust && loan.counterpart.trustedLender && <TrustedBadge />}
      </div>
      {actions && <div className="mt-3">{actions}</div>}
      <ActivityLine activity={loan.activity} />
    </li>
  );
}
