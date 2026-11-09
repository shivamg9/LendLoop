"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import { AuthGate } from "@/components/layout/AuthGate";
import { CategoryFilter } from "@/components/tools/CategoryFilter";
import { ToolCard } from "@/components/tools/ToolCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { api } from "@/convex/_generated/api";
import type { Category } from "@/convex/lib/constants";

export default function ToolsPage() {
  return (
    <>
      <PageHeader title="All tools" description="Find something to borrow from your neighbours." />
      <AuthGate>
        <ToolCatalogue />
      </AuthGate>
    </>
  );
}

function ToolCatalogue() {
  const [category, setCategory] = useState<Category | undefined>();
  const tools = useQuery(api.tools.listWithAvailability, { category });

  return (
    <>
      <CategoryFilter value={category} onChange={setCategory} />
      {tools === undefined ? (
        <LoadingState label="Loading tools…" />
      ) : tools.length === 0 ? (
        <EmptyState title="No tools here yet">Try another category, or list one of your own.</EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => <ToolCard key={tool._id} tool={tool} />)}
        </div>
      )}
    </>
  );
}
