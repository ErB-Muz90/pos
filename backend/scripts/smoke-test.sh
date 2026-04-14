#!/usr/bin/env bash
# ============================================================
# Bandu POS — Pre-launch Smoke Test
# Usage: API_URL=https://api.yourdomain.com bash smoke-test.sh
# ============================================================
set -euo pipefail

API="${API_URL:-http://localhost:3000}/api/v1"
PASS=0; FAIL=0

ok()   { echo "  ✅ $1"; ((PASS++)); }
fail() { echo "  ❌ $1"; ((FAIL++)); }
section() { echo; echo "── $1 ──────────────────────────────"; }

# ── 1. Health ────────────────────────────────────────────────
section "Health"
STATUS=$(curl -sf "$API/../health" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status',''))" 2>/dev/null || echo "error")
[ "$STATUS" = "ok" ] && ok "GET /health → ok" || fail "GET /health → $STATUS"

# ── 2. Register two orgs ─────────────────────────────────────
section "Org Registration"
ORG1=$(curl -sf -X POST "$API/auth/register-org" \
  -H "Content-Type: application/json" \
  -d '{"orgName":"Smoke Org A","businessType":"GeneralRetail","taxPin":"A000001","branchName":"Main","adminUsername":"smoke_a","adminEmail":"a@smoke.test","adminPassword":"SmokePass1!","adminFullName":"Admin A"}' 2>/dev/null || echo "{}")
TOKEN_A=$(echo "$ORG1" | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))" 2>/dev/null || echo "")
[ -n "$TOKEN_A" ] && ok "Org A registered, got JWT" || fail "Org A registration failed"

ORG2=$(curl -sf -X POST "$API/auth/register-org" \
  -H "Content-Type: application/json" \
  -d '{"orgName":"Smoke Org B","businessType":"GeneralRetail","taxPin":"B000002","branchName":"Main","adminUsername":"smoke_b","adminEmail":"b@smoke.test","adminPassword":"SmokePass1!","adminFullName":"Admin B"}' 2>/dev/null || echo "{}")
TOKEN_B=$(echo "$ORG2" | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))" 2>/dev/null || echo "")
[ -n "$TOKEN_B" ] && ok "Org B registered, got JWT" || fail "Org B registration failed"

# ── 3. Tenant isolation ──────────────────────────────────────
section "Tenant Isolation"
if [ -n "$TOKEN_A" ] && [ -n "$TOKEN_B" ]; then
  # Create a product in Org A
  PROD=$(curl -sf -X POST "$API/products" \
    -H "Authorization: Bearer $TOKEN_A" \
    -H "Content-Type: application/json" \
    -d '{"name":"Smoke Product","sellingPrice":100,"costPrice":50}' 2>/dev/null || echo "{}")
  PROD_ID=$(echo "$PROD" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',d).get('id',''))" 2>/dev/null || echo "")
  [ -n "$PROD_ID" ] && ok "Org A: product created ($PROD_ID)" || fail "Org A: product creation failed"

  # Org B should NOT see Org A's product
  if [ -n "$PROD_ID" ]; then
    HTTP=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "Authorization: Bearer $TOKEN_B" \
      "$API/products/$PROD_ID" 2>/dev/null || echo "000")
    [ "$HTTP" = "404" ] || [ "$HTTP" = "403" ] && ok "Org B cannot access Org A product (HTTP $HTTP)" || fail "Tenant leak! Org B got HTTP $HTTP for Org A product"
  fi
else
  fail "Skipping isolation test — registration failed"
fi

# ── 4. Subscription guard ────────────────────────────────────
section "Subscription Guard"
if [ -n "$TOKEN_A" ]; then
  # Verify /auth/me works (GET — always allowed)
  ME=$(curl -sf -H "Authorization: Bearer $TOKEN_A" "$API/auth/me" 2>/dev/null || echo "{}")
  ORG_ID=$(echo "$ME" | python3 -c "import sys,json; print(json.load(sys.stdin).get('organizationId',''))" 2>/dev/null || echo "")
  [ -n "$ORG_ID" ] && ok "GET /auth/me returns organizationId" || fail "GET /auth/me failed"
fi

# ── 5. Rate limiting ─────────────────────────────────────────
section "Rate Limiting"
HTTP_429=0
for i in $(seq 1 12); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"nobody","password":"wrong"}' 2>/dev/null || echo "000")
  [ "$CODE" = "429" ] && HTTP_429=1 && break
done
[ "$HTTP_429" = "1" ] && ok "Auth rate limit triggered after 10 attempts" || fail "Rate limit not triggered after 12 attempts"

# ── Summary ──────────────────────────────────────────────────
echo
echo "══════════════════════════════════════"
echo "  Results: $PASS passed, $FAIL failed"
echo "══════════════════════════════════════"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
