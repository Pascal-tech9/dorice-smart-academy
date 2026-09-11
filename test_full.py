"""Full test suite for Dorice Smart Academy."""
import urllib.request
import http.cookiejar
import urllib.parse
import re
import sys

BASE = "http://127.0.0.1:5000"


def make_opener():
    return urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar())
    )


# Separate sessions so logins don't clobber each other
admin_opener   = make_opener()   # for admin (Mrs. Chapia)
student_opener = make_opener()   # for student portal
anon_opener    = make_opener()   # for unauthenticated requests

PASS = 0
FAIL = 0


def p(cond, name, got=""):
    global PASS, FAIL
    if cond:
        print(f"  PASS  {name}")
        PASS += 1
    else:
        print(f"  FAIL  {name}: {got}")
        FAIL += 1


def get_csrf(opener, url):
    r = opener.open(url, timeout=5)
    html = r.read().decode("utf-8", errors="ignore")
    m = re.search(r'name="csrf_token"[^>]*value="([^"]+)"', html)
    return (m.group(1) if m else None), html


def login(opener, email, password):
    csrf, _ = get_csrf(opener, f"{BASE}/auth/login")
    data = urllib.parse.urlencode({"csrf_token": csrf, "email": email, "password": password}).encode()
    r = opener.open(f"{BASE}/auth/login", data=data, timeout=5)
    return r.geturl()


print("=== Dorice Smart Academy — Full Test Suite ===\n")

# ── [1] Public / static routes ────────────────────────────────────
print("[1] Public pages")
for url, name in [
    (f"{BASE}/",                  "Home page returns 200"),
    (f"{BASE}/admissions/",       "Admissions page returns 200"),
    (f"{BASE}/auth/login",        "Login page returns 200"),
    (f"{BASE}/resources/",         "Resources page returns 200"),
    (f"{BASE}/student/login",     "Student login page returns 200"),
]:
    try:
        r = anon_opener.open(url, timeout=5)
        p(r.getcode() == 200, name)
    except Exception as e:
        p(False, name, e)

# ── [2] Home page content ─────────────────────────────────────────
print("\n[2] Home page content")
r = anon_opener.open(f"{BASE}/", timeout=5)
html = r.read().decode("utf-8", errors="ignore")
p("Dorice Smart Academy" in html,    "School name present")
p("0115 622615" in html or "0115622615" in html, "Phone number present")
p("gallery" in html.lower(),        "Gallery images present")
p("Lumakanda" in html,              "Location (Lumakanda) present")
p("bootstrap" in html.lower(),      "Bootstrap CSS loaded")
p("Internal Server Error" not in html, "No 500 error on home")

# ── [3] Login page structure ──────────────────────────────────────
print("\n[3] Login page structure")
r = anon_opener.open(f"{BASE}/auth/login", timeout=5)
html = r.read().decode("utf-8", errors="ignore")
p("<form" in html,                           "Form element present")
p("csrf" in html.lower(),                   "CSRF token present")
p('name="email"' in html,                   "Email field present")
p('name="password"' in html,                 "Password field present")

# ── [4] Admin login — separate session from anon ──────────────────
print("\n[4] Admin login (Doricesmartprimaryschool89@gmail.com / Onekenya2030)")
url = login(admin_opener, "Doricesmartprimaryschool89@gmail.com", "Onekenya2030")
p("login" not in url, f"Not stuck on login page  (got: {url})")

# ── [5] Admin dashboard ────────────────────────────────────────────
print("\n[5] Admin dashboard")
try:
    r = admin_opener.open(f"{BASE}/admin", timeout=5)
    dash_url  = r.geturl()
    dash_html = r.read().decode("utf-8", errors="ignore")
    p("admin" in dash_url.lower() or dash_url.endswith("/") or dash_url.endswith("/admin"),
      f"Dashboard accessible  (got: {dash_url})")
    p("Internal Server Error" not in dash_html, "No 500 on admin dashboard")
except Exception as e:
    p(False, f"Admin dashboard error: {e}")

# ── [6] Admin: results access ─────────────────────────────────────
# Uses admin_opener — different session from student_opener
print("\n[6] Admin can view results")
try:
    r = admin_opener.open(f"{BASE}/results/", timeout=5)
    res_url = r.geturl()
    p("login" not in res_url,
      f"Results accessible  (got: {res_url})")
except Exception as e:
    p(False, f"Admin results error: {e}")

# ── [7] Student login ──────────────────────────────────────────────
print("\n[7] Student portal login (DSA091 / 1234)")
try:
    csrf, _ = get_csrf(student_opener, f"{BASE}/student/login")
    data = urllib.parse.urlencode({"csrf_token": csrf, "admission_number": "DSA091", "pin": "1234"}).encode()
    r = student_opener.open(f"{BASE}/student/login", data=data, timeout=5)
    student_url = r.geturl()
    p("login" not in student_url,
      f"Student redirected to dashboard  (got: {student_url})")
except Exception as e:
    p(False, f"Student login error: {e}")

# ── [8] Results gate — unauthenticated → login ────────────────────
print("\n[8] Results gate (unauthenticated -> redirect)")
try:
    r = anon_opener.open(f"{BASE}/results/", timeout=5)
    p("login" in r.geturl(),
      f"Redirects to login  (got: {r.geturl()})")
except Exception as e:
    p(False, f"Results gate error: {e}")

# ── [9] Payments routes (correct paths, no trailing slash) ──────────
print("\n[9] Payments pages (admin session)")
for url, name in [
    (f"{BASE}/payments/pay",     "Pay form accessible"),
    (f"{BASE}/payments/request", "Request payment page accessible"),
    (f"{BASE}/payments/manual",  "Manual payment page accessible"),
]:
    try:
        r = admin_opener.open(url, timeout=5)
        p(r.getcode() in (200, 302), f"{name}  ({r.getcode()})")
    except Exception as e:
        p(False, f"{name}: {e}")

# ── [10] Messaging ──────────────────────────────────────────────────
print("\n[10] Messaging (admin)")
try:
    r = admin_opener.open(f"{BASE}/messages", timeout=5)
    p(r.getcode() in (200, 302), f"Messaging inbox accessible  ({r.getcode()})")
except Exception as e:
    p(False, f"Messaging error: {e}")

print(f"\n{'='*50}")
print(f"Results: {PASS} passed, {FAIL} failed")
sys.exit(0 if FAIL == 0 else 1)
