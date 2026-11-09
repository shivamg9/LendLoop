"use client";

import { useMutation, useQuery } from "convex/react";
import { CategoryLabel } from "@/components/tools/CategoryLabel";
import { Button } from "@/components/ui/Button";
import { EmptyState, InlineError, LoadingState } from "@/components/ui/States";
import { api } from "@/convex/_generated/api";
import { useMutationState } from "@/lib/useMutationState";
import { Table, Td } from "./Table";

export function ToolsPanel() {
  const tools = useQuery(api.admin.listTools);
  const remove = useMutationState(useMutation(api.admin.removeTool));
  if (tools === undefined) return <LoadingState />;
  if (tools.length === 0) return <EmptyState title="No listings" />;

  return (
    <div className="space-y-2">
      <InlineError message={remove.error} />
      <Table headers={["Tool", "Category", "Owner", ""]}>
        {tools.map((t) => (
          <tr key={t._id}>
            <Td>{t.name}</Td>
            <Td><CategoryLabel category={t.category} /></Td>
            <Td className="text-stone-500">{t.ownerName}</Td>
            <Td className="text-right">
              <Button
                variant="danger"
                disabled={remove.pending}
                onClick={() => {
                  if (window.confirm(`Remove "${t.name}" by ${t.ownerName}?`)) void remove.run({ toolId: t._id });
                }}
              >
                Remove
              </Button>
            </Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
