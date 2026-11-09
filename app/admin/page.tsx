"use client";

import { useState } from "react";
import { AutomationPanel } from "@/components/admin/AutomationPanel";
import { LoansPanel } from "@/components/admin/LoansPanel";
import { ToolsPanel } from "@/components/admin/ToolsPanel";
import { UsersPanel } from "@/components/admin/UsersPanel";
import { AuthGate } from "@/components/layout/AuthGate";
import { PageHeader } from "@/components/ui/PageHeader";

const TABS = {
  users: { label: "Users", Panel: UsersPanel },
  tools: { label: "Listings", Panel: ToolsPanel },
  loans: { label: "Loans", Panel: LoansPanel },
  automation: { label: "Automation", Panel: AutomationPanel },
} as const;

type Tab = keyof typeof TABS;

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("users");
  const { Panel } = TABS[tab];

  return (
    <>
      <PageHeader title="Admin" description="Moderate listings, review loans, manage trust and automation health." />
      <AuthGate adminOnly>
        <div role="tablist" className="mb-4 flex gap-1 overflow-x-auto border-b border-stone-200">
          {(Object.keys(TABS) as Tab[]).map((key) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm ${
                tab === key ? "border-emerald-700 font-medium text-stone-900" : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              {TABS[key].label}
            </button>
          ))}
        </div>
        <Panel />
      </AuthGate>
    </>
  );
}
