# Taking LendLoop to production

What I would change before real users, roughly in priority order.

## Delivery and integrations
- **Real email provider.** Replace the two mock Set nodes with Resend, Postmark or SES (one node each; the fields are already `to / subject / text`). Configure SPF, DKIM and DMARC, and handle bounces and unsubscribes (List-Unsubscribe header, per-user notification preferences).
- **Receiver-side dedupe** on `eventId` in WF1 (Postgres or Redis key with a TTL), so a retry after a timeout never double-sends.
- **Dead-letter handling.** Add a "Retry" button in Admin for `failed` outbox rows, plus a cron sweep for `pending` rows older than N minutes in case a scheduled job is ever lost.

## Secrets
- **Rotation without downtime.** Accept two secrets during a rotation window (`LENDLOOP_WEBHOOK_SECRET` and `LENDLOOP_WEBHOOK_SECRET_NEXT`). Sign with the new one and verify against both, then drop the old one. Add a key id header (`X-LendLoop-Key-Id`).
- Use a separate secret per direction (Convex→n8n vs n8n→Convex), so a leak on one side can't forge the other.
- Store secrets in a manager (Doppler, 1Password, AWS/GCP Secret Manager) and inject them at deploy time. Keep n8n env access blocked and use n8n credentials or external secrets instead of `$env`.

## n8n
- **Queue mode + Postgres.** `EXECUTIONS_MODE=queue` with Redis and dedicated worker and webhook processes. Postgres instead of SQLite. Task runners in external mode.
- Run n8n behind TLS with SSO, and IP-allowlist the webhook path, or put it behind a gateway that also checks the signature.
- Keep workflows in git and deploy them by CI (import + publish) instead of editing in the UI. Pin the n8n version and upgrade deliberately.

## Application hardening
- **Rate limiting.** Use `@convex-dev/rate-limiter` on `loans.request`, `tools.create` and the HTTP routes, per user and per IP.
- **Audit log.** Add an append-only `auditLog` table written by admin actions (remove listing, trust toggle) and loan transitions: who, what, when, before/after.
- **CSP and security headers.** `clerkMiddleware({ contentSecurityPolicy })` or `next.config` headers: strict CSP with nonces, `frame-ancestors 'none'`, HSTS, `Referrer-Policy`, `Permissions-Policy`.
- **Clerk.** Production instance, email verification required, bot protection, a session lifetime policy, and webhook-based user sync (`user.updated`/`user.deleted`) so email changes and deletions propagate even when a user doesn't sign in.
- Paginate all lists. Cap the number of open requests per borrower.
- Timezones: store the user's timezone and compute "today" and "overdue" per user.

## Observability
- **Sentry** for Next.js (client + server) and Convex (log streams → Sentry or Datadog).
- **Datadog/Grafana** dashboards for outbox lag (oldest `pending`), failure rate, n8n execution errors and webhook latency. Alert on `failed` events and on any `automationFailures` insert.
- Structured logs with `eventId`/`loanId` correlation across Convex and n8n.

## Data
- **Backups.** Scheduled Convex exports (`npx convex export`) to encrypted object storage, plus n8n Postgres backups. Test the restore path.
- Retention: prune `automationEvents`, `reminders` and `automationFailures` after 90 days via a cron.
- GDPR: a user-deletion flow that removes or anonymizes users, tools and loans, and data export on request.

## Delivery pipeline
- CI already runs typecheck, lint, tests and the workflow secret scan. Add: `next build`, Playwright E2E against a preview Convex deployment, `npm audit`/Dependabot, CodeQL, and required checks + reviews on `main`.
- Separate Convex dev, preview and prod deployments, and use `npx convex deploy` from CI only. Keep `ALLOW_SEED` unset in prod.
