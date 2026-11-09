import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/convex/lib/constants";

type Props = { value: Category | undefined; onChange: (value: Category | undefined) => void };

export function CategoryFilter({ value, onChange }: Props) {
  const options: (Category | undefined)[] = [undefined, ...CATEGORIES];
  return (
    <div role="group" aria-label="Filter by category" className="mb-6 flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option ?? "all"}
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={`rounded-full border px-3 py-1 text-sm ${
            value === option ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
          }`}
        >
          {option ? CATEGORY_LABELS[option] : "All"}
        </button>
      ))}
    </div>
  );
}
