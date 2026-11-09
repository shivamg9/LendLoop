"use client";

import { useQuery } from "convex/react";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { api } from "@/convex/_generated/api";
import { timeAgo } from "@/lib/format";
import { Table, Td } from "./Table";

export function AutomationPanel() {
  const health = useQuery(api.admin.automationHealth);
  if (health === undefined) return <LoadingState />;

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-2 font-medium">n8n workflow failures</h3>
        {health.workflowFailures.length === 0 ? (
          <EmptyState title="No workflow failures reported" />
        ) : (
          <Table headers={["When", "Workflow", "Node", "Message", "Execution"]}>
            {health.workflowFailures.map((f) => (
              <tr key={f._id}>
                <Td className="whitespace-nowrap text-stone-500">{timeAgo(f.at)}</Td>
                <Td>{f.workflowName}</Td>
                <Td>{f.nodeName ?? "—"}</Td>
                <Td className="max-w-md break-words text-red-700">{f.message}</Td>
                <Td className="text-stone-500">{f.executionId ?? "—"}</Td>
              </tr>
            ))}
          </Table>
        )}
      </section>
      <section>
        <h3 className="mb-2 font-medium">Undelivered notifications (retries exhausted)</h3>
        {health.failedEvents.length === 0 ? (
          <EmptyState title="All notifications delivered" />
        ) : (
          <Table headers={["When", "Event", "Attempts", "Last error"]}>
            {health.failedEvents.map((e) => (
              <tr key={e._id}>
                <Td className="whitespace-nowrap text-stone-500">{timeAgo(e.at)}</Td>
                <Td>{e.eventType}</Td>
                <Td>{e.attempts}</Td>
                <Td className="max-w-md break-words text-red-700">{e.lastError ?? "—"}</Td>
              </tr>
            ))}
          </Table>
        )}
      </section>
    </div>
  );
}
