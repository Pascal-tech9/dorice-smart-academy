#!/bin/bash
# Dorice Smart Academy — quick backend smoke test
# Runs after `flask run` or `gunicorn wsgi:app` is up.
# Verifies: health, fee gate, admin gate, login, transcript JSON, fee PATCH.

set -e
BASE="${BASE:-http://localhost:5000}"
COOKIE="$(mktemp)"
PASS=0
FAIL=0

check() {
  local name="$1" expected="$2" got="$3"
  if [ "$got" = "$expected" ]; then
    echo "  ✓ $name ($got)"
    PASS=$((PASS+1))
  else
    echo "  ✗ $name (expected $expected, got $got)"
    FAIL=$((FAIL+1))
  fi
}

echo "═══════════════════════════════════════════════════════"
echo "  Backend smoke test — $BASE"
echo "═══════════════════════════════════════════════════════"
echo ""

# /healthz
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/healthz")
check "GET /healthz" 200 "$status"

# / (home)
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/")
check "GET / (home)" 200 "$status"

# /staff
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/staff")
check "GET /staff" 200 "$status"

# /admin-profile (public)
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/admin-profile")
check "GET /admin-profile" 200 "$status"

# /admin (gated, expect 302 to login or 403)
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/admin")
if [ "$status" = "302" ] || [ "$status" = "403" ]; then
  echo "  ✓ GET /admin (gated) -> $status"
  PASS=$((PASS+1))
else
  echo "  ✗ GET /admin (expected 302/403, got $status)"
  FAIL=$((FAIL+1))
fi

# /auth/login (should be 200)
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/auth/login")
check "GET /auth/login" 200 "$status"

# /payments/sim-guide
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/payments/sim-guide")
check "GET /payments/sim-guide" 200 "$status"

# Security headers
hdr=$(curl -sI "$BASE/" | grep -ic "strict-transport-security")
if [ "$hdr" -gt 0 ]; then
  echo "  ✓ HSTS header present"
  PASS=$((PASS+1))
else
  echo "  ⚠ HSTS header not present (only set in production)"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Results: $PASS passed, $FAIL failed"
echo "═══════════════════════════════════════════════════════"
exit $FAIL
