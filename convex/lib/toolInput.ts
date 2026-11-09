import { v, type Infer } from "convex/values";
import { LIMITS } from "./constants";
import { assertLength } from "./errors";
import { vCategory, vCondition } from "./validators";

export const vToolInput = v.object({
  name: v.string(),
  category: vCategory,
  condition: vCondition,
  description: v.string(),
});

export type ToolInput = Infer<typeof vToolInput>;

export function cleanToolInput(input: ToolInput): ToolInput {
  return {
    ...input,
    name: assertLength("Name", input.name, LIMITS.toolName.min, LIMITS.toolName.max),
    description: assertLength("Description", input.description, LIMITS.toolDescription.min, LIMITS.toolDescription.max),
  };
}
