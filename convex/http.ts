import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { json, optionalString, parseJsonObject, signedHttpAction } from "./lib/signedHttp";

const http = httpRouter();

http.route({
  path: "/overdue-loans",
  method: "GET",
  handler: signedHttpAction(async (ctx) => json(await ctx.runQuery(internal.automationHttp.listOverdue, {}))),
});

http.route({
  path: "/reminders",
  method: "POST",
  handler: signedHttpAction(async (ctx, rawBody) => {
    const body = parseJsonObject(rawBody);
    const loanId = optionalString(body?.loanId, 64);
    const status = body?.status;
    if (!loanId || (status !== "sent" && status !== "failed")) {
      return json({ error: "invalid_body", expected: { loanId: "string", status: "sent | failed" } }, 400);
    }
    const result = await ctx.runMutation(internal.automationHttp.recordReminder, { loanId, status });
    if (result.kind === "not_found") return json({ error: "loan_not_found" }, 404);
    return json({ created: result.kind === "created", reminder: result.reminder }, result.kind === "created" ? 201 : 200);
  }),
});

http.route({
  path: "/automation-failures",
  method: "POST",
  handler: signedHttpAction(async (ctx, rawBody) => {
    const body = parseJsonObject(rawBody);
    const workflowName = optionalString(body?.workflowName, 200);
    const message = optionalString(body?.message, 1000);
    if (!workflowName || !message) return json({ error: "invalid_body" }, 400);
    await ctx.runMutation(internal.automationHttp.recordFailure, {
      workflowName,
      message,
      nodeName: optionalString(body?.nodeName, 200),
      executionId: optionalString(body?.executionId, 100),
    });
    return json({ recorded: true }, 201);
  }),
});

export default http;
