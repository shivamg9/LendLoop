"use client";

import { useQuery } from "convex/react";
import { AuthGate } from "@/components/layout/AuthGate";
import { LenderActions } from "@/components/loans/LoanActions";
import { LoanCard } from "@/components/loans/LoanCard";
import { LoanList } from "@/components/loans/LoanList";
import { PageHeader } from "@/components/ui/PageHeader";
import { api } from "@/convex/_generated/api";

export default function IncomingPage() {
  return (
    <>
      <PageHeader title="Incoming requests" description="Requests to borrow your tools." />
      <AuthGate>
        <Incoming />
      </AuthGate>
    </>
  );
}

function Incoming() {
  const loans = useQuery(api.loans.incoming);
  return (
    <LoanList
      loans={loans}
      emptyTitle="No incoming requests"
      emptyHint="When someone asks to borrow one of your tools, it shows up here."
      render={(loan) => (
        <LoanCard key={loan._id} loan={loan} counterpartLabel="Borrower" showTrust={false} actions={<LenderActions loan={loan} />} />
      )}
    />
  );
}
