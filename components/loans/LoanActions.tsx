"use client";

import { useMutation } from "convex/react";
import { Button } from "@/components/ui/Button";
import { InlineError } from "@/components/ui/States";
import { api } from "@/convex/_generated/api";
import { useMutationState } from "@/lib/useMutationState";
import type { LoanView } from "./LoanCard";

export function LenderActions({ loan }: { loan: LoanView }) {
  const approve = useMutationState(useMutation(api.loans.approve));
  const decline = useMutationState(useMutation(api.loans.decline));
  const returned = useMutationState(useMutation(api.loans.markReturned));
  const busy = approve.pending || decline.pending || returned.pending;
  const args = { loanId: loan._id };

  if (loan.status === "pending") {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button disabled={busy} onClick={() => approve.run(args)}>Approve</Button>
          <Button variant="secondary" disabled={busy} onClick={() => decline.run(args)}>Decline</Button>
        </div>
        <InlineError message={approve.error ?? decline.error} />
      </div>
    );
  }
  if (loan.status === "approved") {
    return (
      <div className="space-y-2">
        <Button variant="secondary" disabled={busy} onClick={() => returned.run(args)}>Mark as returned</Button>
        <InlineError message={returned.error} />
      </div>
    );
  }
  return null;
}

export function BorrowerActions({ loan }: { loan: LoanView }) {
  const cancel = useMutationState(useMutation(api.loans.cancel));
  if (loan.status !== "pending") return null;
  return (
    <div className="space-y-2">
      <Button variant="secondary" disabled={cancel.pending} onClick={() => cancel.run({ loanId: loan._id })}>
        Cancel request
      </Button>
      <InlineError message={cancel.error} />
    </div>
  );
}
