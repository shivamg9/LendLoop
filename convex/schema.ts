import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { vCategory, vCondition, vDeliveryStatus, vEventType, vIsoDate, vLoanStatus, vRole } from "./lib/validators";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    role: vRole,
    trustedLender: v.boolean(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  tools: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    category: vCategory,
    condition: vCondition,
    description: v.string(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_category", ["category"]),

  loans: defineTable({
    toolId: v.id("tools"),
    lenderId: v.id("users"),
    borrowerId: v.id("users"),
    startDate: vIsoDate,
    endDate: vIsoDate,
    status: vLoanStatus,
    decidedAt: v.optional(v.number()),
    returnedAt: v.optional(v.number()),
  })
    .index("by_tool_status", ["toolId", "status"])
    .index("by_borrower", ["borrowerId"])
    .index("by_lender", ["lenderId"])
    .index("by_status_endDate", ["status", "endDate"]),

  // Transactional outbox: written in the same mutation as the state change,
  // then delivered to n8n by a scheduled internal action.
  automationEvents: defineTable({
    eventType: vEventType,
    loanId: v.id("loans"),
    payload: v.object({
      eventId: v.string(),
      eventType: vEventType,
      loanId: v.string(),
      toolName: v.string(),
      recipientEmail: v.string(),
      recipientFirstName: v.string(),
      status: vLoanStatus,
      startDate: vIsoDate,
      endDate: vIsoDate,
    }),
    status: vDeliveryStatus,
    attempts: v.number(),
    lastError: v.optional(v.string()),
    sentAt: v.optional(v.number()),
  })
    .index("by_loan", ["loanId"])
    .index("by_status", ["status"]),

  reminders: defineTable({
    idempotencyKey: v.string(),
    loanId: v.id("loans"),
    status: v.union(v.literal("sent"), v.literal("failed")),
    sentAt: v.number(),
  })
    .index("by_key", ["idempotencyKey"])
    .index("by_loan", ["loanId"]),

  automationFailures: defineTable({
    workflowName: v.string(),
    nodeName: v.optional(v.string()),
    message: v.string(),
    executionId: v.optional(v.string()),
  }),
});
