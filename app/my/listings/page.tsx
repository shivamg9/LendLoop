"use client";

import { useMutation, useQuery } from "convex/react";
import { AuthGate } from "@/components/layout/AuthGate";
import { MyToolRow } from "@/components/tools/MyToolRow";
import { ToolForm } from "@/components/tools/ToolForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { api } from "@/convex/_generated/api";
import { useMutationState } from "@/lib/useMutationState";

export default function MyListingsPage() {
  return (
    <>
      <PageHeader title="My listings" description="Tools you're lending to the community." />
      <AuthGate>
        <MyListings />
      </AuthGate>
    </>
  );
}

function MyListings() {
  const tools = useQuery(api.tools.listMine);
  const create = useMutationState(useMutation(api.tools.create));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <section>
        {tools === undefined ? (
          <LoadingState />
        ) : tools.length === 0 ? (
          <EmptyState title="You haven't listed anything yet">Use the form to lend your first tool.</EmptyState>
        ) : (
          <ul className="space-y-3">{tools.map((tool) => <MyToolRow key={tool._id} tool={tool} />)}</ul>
        )}
      </section>
      <section className="h-fit rounded-lg border border-stone-200 bg-white p-4 lg:order-last">
        <h2 className="mb-3 font-medium">List a tool</h2>
        <ToolForm submitLabel="List tool" pending={create.pending} error={create.error} onSubmit={(input) => create.run({ input })} />
      </section>
    </div>
  );
}
