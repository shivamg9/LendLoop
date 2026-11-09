"use client";

import { useMutation, useQuery } from "convex/react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, InlineError, LoadingState } from "@/components/ui/States";
import { api } from "@/convex/_generated/api";
import { useMutationState } from "@/lib/useMutationState";
import { Table, Td } from "./Table";

export function UsersPanel() {
  const users = useQuery(api.admin.listUsers);
  const toggle = useMutationState(useMutation(api.admin.setTrustedLender));
  if (users === undefined) return <LoadingState />;
  if (users.length === 0) return <EmptyState title="No users yet" />;

  return (
    <div className="space-y-2">
      <InlineError message={toggle.error} />
      <Table headers={["Name", "Email", "Role", "Trusted Lender"]}>
        {users.map((u) => (
          <tr key={u._id}>
            <Td>{u.name}</Td>
            <Td className="text-stone-500">{u.email}</Td>
            <Td>{u.role === "admin" ? <Badge tone="blue">admin</Badge> : <Badge>user</Badge>}</Td>
            <Td>
              <Button
                variant={u.trustedLender ? "primary" : "secondary"}
                disabled={toggle.pending}
                aria-pressed={u.trustedLender}
                onClick={() => toggle.run({ userId: u._id, trusted: !u.trustedLender })}
              >
                {u.trustedLender ? "✓ Trusted" : "Mark trusted"}
              </Button>
            </Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
