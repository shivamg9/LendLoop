"use client";

import { useMutation } from "convex/react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { InlineError } from "@/components/ui/States";
import { inputClass, labelClass } from "@/components/ui/fields";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { LIMITS } from "@/convex/lib/constants";
import { todayIso } from "@/convex/lib/dates";
import { useMutationState } from "@/lib/useMutationState";

type Props = { toolId: Id<"tools">; onSuccess: () => void; onCancel: () => void };

export function BorrowForm({ toolId, onSuccess, onCancel }: Props) {
  const today = todayIso();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const { run, pending, error } = useMutationState(useMutation(api.loans.request));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (await run({ toolId, startDate, endDate })) onSuccess();
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 rounded-md bg-stone-50 p-3">
      <div className="grid grid-cols-2 gap-2">
        <label className={labelClass}>
          <span>From</span>
          <input type="date" required min={today} value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          <span>To</span>
          <input type="date" required min={startDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
        </label>
      </div>
      <p className="text-xs text-stone-500">Up to {LIMITS.maxLoanDays} days. Dates are in UTC.</p>
      <InlineError message={error} />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>{pending ? "Sending…" : "Send request"}</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
