"use client";

import { useQuery } from "convex/react";
import { AuthGate } from "@/components/layout/AuthGate";
import { BorrowerActions } from "@/components/loans/LoanActions";
import { LoanCard } from "@/components/loans/LoanCard";
import { LoanList } from "@/components/loans/LoanList";
import { PageHeader } from "@/components/ui/PageHeader";
import { api } from "@/convex/_generated/api";

export default function MyRequestsPage() {
  return (
    <>
      <PageHeader title="My requests" description="Tools you've asked to borrow." />
      <AuthGate>
        <MyRequests />
      </AuthGate>
    </>
  );
}

function MyRequests() {
  const loans = useQuery(api.loans.myRequests);
  return (
    <LoanList
      loans={loans}
      emptyTitle="No requests yet"
      emptyHint="Browse tools and request one to borrow."
      render={(loan) => (
        <LoanCard key={loan._id} loan={loan} counterpartLabel="Lender" showTrust actions={<BorrowerActions loan={loan} />} />
      )}
    />
  );
}
