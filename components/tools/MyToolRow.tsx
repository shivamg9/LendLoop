"use client";

import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { InlineError } from "@/components/ui/States";
import { api } from "@/convex/_generated/api";
import { useMutationState } from "@/lib/useMutationState";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { CategoryLabel } from "./CategoryLabel";
import { ToolForm } from "./ToolForm";

type MyTool = FunctionReturnType<typeof api.tools.listMine>[number];

export function MyToolRow({ tool }: { tool: MyTool }) {
  const [editing, setEditing] = useState(false);
  const update = useMutationState(useMutation(api.tools.update));
  const remove = useMutationState(useMutation(api.tools.remove));

  if (editing) {
    const { name, category, condition, description } = tool;
    return (
      <li className="rounded-lg border border-stone-200 bg-white p-4">
        <ToolForm
          initial={{ name, category, condition, description }}
          submitLabel="Save changes"
          pending={update.pending}
          error={update.error}
          onCancel={() => setEditing(false)}
          onSubmit={async (input) => {
            const ok = await update.run({ toolId: tool._id, input });
            if (ok) setEditing(false);
            return ok;
          }}
        />
      </li>
    );
  }

  return (
    <li className="rounded-lg border border-stone-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-medium">{tool.name}</h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <CategoryLabel category={tool.category} />
            <Badge>Condition: {tool.condition}</Badge>
            <AvailabilityBadge availability={tool.availability} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
          <Button
            variant="danger"
            disabled={remove.pending}
            onClick={() => {
              if (window.confirm(`Delete "${tool.name}"? Pending requests will be declined.`)) void remove.run({ toolId: tool._id });
            }}
          >
            Delete
          </Button>
        </div>
      </div>
      {tool.description && <p className="mt-2 text-sm text-stone-600">{tool.description}</p>}
      <div className="mt-2"><InlineError message={remove.error} /></div>
    </li>
  );
}
