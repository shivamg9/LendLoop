#!/usr/bin/env bash
# Fails if exported n8n workflows contain credentials or secret-looking values.
# Also checks for the literal values in n8n/.env when that file exists (local runs).
set -euo pipefail
dir="${1:-n8n/workflows}"
status=0

check() {
  local label="$1" pattern="$2"
  if grep -nEH -- "$pattern" "$dir"/*.json; then
    echo "✖ $label found" >&2
    status=1
  fi
}

check "credentials block" '"credentials"[[:space:]]*:'
check "64+ char hex string (possible secret)" '[0-9a-fA-F]{64,}'
check "Clerk key" '(sk|pk)_(test|live)_'
check "email address" '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
check "bearer/authorization header value" '"(Authorization|authorization)"'

if [[ -f n8n/.env ]]; then
  while IFS='=' read -r key value; do
    [[ -z "$key" || "$key" == \#* || -z "${value:-}" || ${#value} -lt 12 ]] && continue
    if grep -qF -- "$value" "$dir"/*.json; then
      echo "✖ value of $key from n8n/.env found in workflows" >&2
      status=1
    fi
  done < n8n/.env
fi

[[ $status -eq 0 ]] && echo "✓ no secrets found in $dir"
exit $status
