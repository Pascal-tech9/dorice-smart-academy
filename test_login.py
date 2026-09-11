"""Quick login flow tests for Dorice Smart Academy."""
import urllib.request
import urllib.parse
import re
import http.cookiejar

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

def get_csrf(url):
    r = opener.open(url, timeout=5)
    html = r.read().decode("utf-8", errors="ignore")
    m = re.search(r'name="csrf_token"[^>]*value="([^"]+)"', html)
    return m.group(1) if m else None, html

def test_login(email, password):
    csrf, _ = get_csrf("http://127.0.0.1:5000/auth/login")
    post_data = urllib.parse.urlencode({
        "csrf_token": csrf,
        "email": email,
        "password": password,
    }).encode()
    r = opener.open("http://127.0.0.1:5000/auth/login", data=post_data, timeout=5)
    return r.geturl(), r.read().decode("utf-8", errors="ignore")

# Test 1: parent with fees cleared
url1, html1 = test_login("parent@dorice.test", "demo123")
print("parent@dorice.test (fees_cleared=True):")
print(f"  Final URL: {url1}")
print(f"  {'PASS' if 'login' not in url1 else 'FAIL'}  Not stuck on login page")

# Test 2: results page — should show results
r2 = opener.open("http://127.0.0.1:5000/results", timeout=5)
results_url = r2.geturl()
results_html = r2.read().decode("utf-8", errors="ignore")
print(f"\nResults (fees_cleared parent):")
print(f"  URL: {results_url}")
print(f"  {'PASS' if 'payment' not in results_url else 'FAIL'}  Not redirected to payment gate")

# Test 3: arrears parent — results should be gated
csrf3, _ = get_csrf("http://127.0.0.1:5000/auth/login")
post3 = urllib.parse.urlencode({"csrf_token": csrf3, "email": "arrears@dorice.test", "password": "demo123"}).encode()
opener.open("http://127.0.0.1:5000/auth/login", data=post3, timeout=5)
r3 = opener.open("http://127.0.0.1:5000/results", timeout=5)
arrears_url = r3.geturl()
print(f"\nResults (arrears parent):")
print(f"  URL: {arrears_url}")
print(f"  {'PASS' if 'payment' in arrears_url else 'FAIL'}  Redirected to payment gate")

# Test 4: admin login
csrf4, _ = get_csrf("http://127.0.0.1:5000/auth/login")
post4 = urllib.parse.urlencode({"csrf_token": csrf4, "email": "Doricesmartprimaryschool89@gmail.com", "password": "demo123"}).encode()
r4 = opener.open("http://127.0.0.1:5000/auth/login", data=post4, timeout=5)
admin_url = r4.geturl()
admin_html = r4.read().decode("utf-8", errors="ignore")
print(f"\nAdmin login:")
print(f"  Final URL: {admin_url}")
print(f"  {'PASS' if 'login' not in admin_url else 'FAIL'}  Admin login succeeded")

# Test 5: admin dashboard
r5 = opener.open("http://127.0.0.1:5000/admin", timeout=5)
admin_dash_url = r5.geturl()
admin_dash_html = r5.read().decode("utf-8", errors="ignore")
print(f"\nAdmin dashboard:")
print(f"  URL: {admin_dash_url}")
print(f"  {'PASS' if 'admin' in admin_dash_url else 'FAIL'}  Dashboard accessible")

# Test 6: health check endpoint
try:
    r6 = opener.open("http://127.0.0.1:5000/healthz", timeout=5)
    health_html = r6.read().decode("utf-8", errors="ignore")
    print(f"\nHealth check:")
    print(f"  {'PASS'}  /healthz returns {r6.getcode()}")
except Exception as e:
    print(f"\nHealth check: FAIL  {e}")

# Test 7: admissions page (public)
r7 = opener.open("http://127.0.0.1:5000/admissions", timeout=5)
admissions_html = r7.read().decode("utf-8", errors="ignore")
print(f"\nAdmissions page:")
print(f"  {'PASS' if r7.getcode() == 200 else 'FAIL'}  Returns 200")
print(f"  {'PASS' if 'admission' in admissions_html.lower() else 'FAIL'}  Contains admission content")

print("\n--- All critical paths tested ---")
