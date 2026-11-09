"use client";

import { useQuery } from "convex/react";
import { LoanStatusBadge } from "@/components/loans/LoanStatusBadge";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { api } from "@/convex/_generated/api";
import { formatDate } from "@/lib/format";
import { Table, Td } from "./Table";

export function LoansPanel() {
  const loans = useQuery(api.admin.listLoans);
  if (loans === undefined) return <LoadingState />;
  if (loans.length === 0) return <EmptyState title="No loans yet" />;

  return (
    <Table headers={["Tool", "Lender", "Borrower", "Dates", "Status"]}>
      {loans.map((l) => (
        <tr key={l._id}>
          <Td>{l.toolName}</Td>
          <Td>{l.lenderName}</Td>
          <Td>{l.borrowerName}</Td>
          <Td className="whitespace-nowrap text-stone-500">{formatDate(l.startDate)} – {formatDate(l.endDate)}</Td>
          <Td><LoanStatusBadge status={l.status} overdue={l.overdue} /></Td>
        </tr>
      ))}
    </Table>
  );
}
