"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { InlineError } from "@/components/ui/States";
import { inputClass, labelClass } from "@/components/ui/fields";
import { CATEGORIES, CATEGORY_LABELS, CONDITIONS, LIMITS, type Category, type Condition } from "@/convex/lib/constants";
import type { ToolInput } from "@/convex/lib/toolInput";

const EMPTY: ToolInput = { name: "", category: "power_tools", condition: "good", description: "" };

type Props = {
  initial?: ToolInput;
  submitLabel: string;
  onSubmit: (input: ToolInput) => Promise<boolean>;
  onCancel?: () => void;
  pending: boolean;
  error: string | null;
};

export function ToolForm({ initial = EMPTY, submitLabel, onSubmit, onCancel, pending, error }: Props) {
  const [values, setValues] = useState<ToolInput>(initial);
  const set = <K extends keyof ToolInput>(key: K, value: ToolInput[K]) => setValues((v) => ({ ...v, [key]: value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if ((await onSubmit(values)) && initial === EMPTY) setValues(EMPTY);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className={labelClass}>
        <span>Name</span>
        <input
          required
          minLength={LIMITS.toolName.min}
          maxLength={LIMITS.toolName.max}
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          className={inputClass}
          placeholder="e.g. Cordless drill"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          <span>Category</span>
          <select value={values.category} onChange={(e) => set("category", e.target.value as Category)} className={inputClass}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
        </label>
        <label className={labelClass}>
          <span>Condition</span>
          <select value={values.condition} onChange={(e) => set("condition", e.target.value as Condition)} className={inputClass}>
            {CONDITIONS.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
          </select>
        </label>
      </div>
      <label className={labelClass}>
        <span>Short description <span className="font-normal text-stone-400">(optional)</span></span>
        <textarea
          rows={3}
          maxLength={LIMITS.toolDescription.max}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          className={inputClass}
        />
      </label>
      <InlineError message={error} />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : submitLabel}</Button>
        {onCancel && <Button variant="secondary" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
