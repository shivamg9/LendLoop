"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { CategoryLabel } from "./CategoryLabel";

export function PublicToolList() {
  const tools = useQuery(api.tools.listPublic);
  if (tools === undefined) return <LoadingState label="Loading tools…" />;
  if (tools.length === 0) return <EmptyState title="No tools listed yet">Be the first to lend one.</EmptyState>;

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => (
        <li key={tool._id} className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3">
          <span className="truncate font-medium">{tool.name}</span>
          <CategoryLabel category={tool.category} />
        </li>
      ))}
    </ul>
  );
}
