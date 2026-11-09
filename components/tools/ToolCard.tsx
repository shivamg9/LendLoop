"use client";

import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { Badge, TrustedBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { api } from "@/convex/_generated/api";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { BorrowForm } from "./BorrowForm";
import { CategoryLabel } from "./CategoryLabel";

type Tool = FunctionReturnType<typeof api.tools.listWithAvailability>[number];

export function ToolCard({ tool }: { tool: Tool }) {
  const [borrowing, setBorrowing] = useState(false);
  const [requested, setRequested] = useState(false);

  return (
    <article className="flex flex-col rounded-lg border border-stone-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium">{tool.name}</h3>
        <AvailabilityBadge availability={tool.availability} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <CategoryLabel category={tool.category} />
        <Badge>Condition: {tool.condition}</Badge>
      </div>
      {tool.description && <p className="mt-3 text-sm text-stone-600">{tool.description}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-stone-500">
        <span>Lent by {tool.isMine ? "you" : tool.owner.name}</span>
        {tool.owner.trustedLender && <TrustedBadge />}
      </div>
      {!tool.isMine && (
        <div className="mt-auto pt-3">
          {requested ? (
            <p className="text-sm text-emerald-800">Request sent. Track it under My requests.</p>
          ) : borrowing ? (
            <BorrowForm toolId={tool._id} onSuccess={() => setRequested(true)} onCancel={() => setBorrowing(false)} />
          ) : (
            <Button variant="secondary" onClick={() => setBorrowing(true)}>Request to borrow</Button>
          )}
        </div>
      )}
    </article>
  );
}
