import type { ButtonHTMLAttributes } from "react";

const VARIANTS = {
  primary: "bg-emerald-700 text-white hover:bg-emerald-800 disabled:bg-emerald-700/50",
  secondary: "border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 disabled:opacity-50",
  danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:opacity-50",
} as const;

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof VARIANTS };

export function Button({ variant = "primary", className = "", type = "button", ...props }: Props) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
