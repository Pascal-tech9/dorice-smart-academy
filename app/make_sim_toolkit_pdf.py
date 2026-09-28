"""Generate a printable "How to pay via M-Pesa SIM Toolkit" PDF.

One-page A4 guide for parents — clear, simple, with screenshots described
in text. Saved to app/static/files/sim-toolkit-guide.pdf.
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor, black, white
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


HERE = os.path.dirname(os.path.abspath(__file__))
OUT  = os.path.join(HERE, "static", "files", "sim-toolkit-guide.pdf")
os.makedirs(os.path.dirname(OUT), exist_ok=True)


# --- Dorice brand colors ---
GREEN_900 = HexColor("#0E2A20")
GREEN_700 = HexColor("#1B4332")
GREEN_100 = HexColor("#D6EAD7")
GOLD      = HexColor("#D4A017")
INK       = HexColor("#1F1F1F")
INK_SOFT  = HexColor("#5A5A5A")
PAPER_DIM = HexColor("#F5F2EA")


def draw(c):
    W, H = A4
    margin = 1.5 * cm

    # --- Background paper ---
    c.setFillColor(white)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # --- Header band ---
    c.setFillColor(GREEN_900)
    c.rect(0, H - 5 * cm, W, 5 * cm, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(margin, H - 1.8 * cm, "DORICE SMART ACADEMY")
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(margin, H - 3.2 * cm, "How to pay school fees via M-Pesa")
    c.setFont("Helvetica", 12)
    c.drawString(margin, H - 4.2 * cm,
                 "Step-by-step guide for parents — works on any phone, no app needed")

    # --- Big paybill box ---
    y = H - 7.5 * cm
    c.setFillColor(GREEN_700)
    c.roundRect(margin, y - 3.2 * cm, W - 2 * margin, 3.2 * cm, 8, fill=1, stroke=0)

    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(margin + 1 * cm, y - 1 * cm, "PAYBILL")
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 38)
    c.drawString(margin + 1 * cm, y - 2.3 * cm, "400222")

    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(W / 2, y - 1 * cm, "ACCOUNT NUMBER")
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 38)
    c.drawString(W / 2, y - 2.3 * cm, "369369")

    c.setFillColor(HexColor("#C7D2CB"))
    c.setFont("Helvetica", 9)
    c.drawString(margin + 1 * cm, y - 2.95 * cm, "Business: Dorice Smart Academy")
    c.drawString(W / 2,         y - 2.95 * cm,
                 "Type your student's name in the Account Name field if asked")

    # --- Steps ---
    steps = [
        ("1", "Open the M-Pesa menu on your phone",
              "On Safaricom: SIM Toolkit → M-Pesa → Lipa na M-Pesa → Pay Bill"),
        ("2", "Enter the Paybill number",
              "Type 400222 and press OK"),
        ("3", "Enter the Account number",
              "Type 369369 and press OK. (Some phones ask for an Account Name — type your child's full name and grade, e.g. Achieng Atieno, Grade 5)"),
        ("4", "Enter the amount you are paying",
              "e.g. 5000 for term fees, then press OK"),
        ("5", "Enter your M-Pesa PIN",
              "Your secret PIN — never share this with anyone"),
        ("6", "Wait for the confirmation SMS",
              "You'll receive an SMS with an M-Pesa confirmation code (e.g. QJG7X2K3YZ). Keep it — the school will ask for it to unlock your child's results."),
    ]
    y = H - 11.2 * cm
    for num, title, body in steps:
        # Step badge
        c.setFillColor(GOLD)
        c.circle(margin + 0.6 * cm, y - 0.3 * cm, 0.6 * cm, fill=1, stroke=0)
        c.setFillColor(GREEN_900)
        c.setFont("Helvetica-Bold", 16)
        c.drawCentredString(margin + 0.6 * cm, y - 0.55 * cm, num)

        # Title
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(margin + 1.6 * cm, y - 0.4 * cm, title)

        # Body
        c.setFillColor(INK_SOFT)
        c.setFont("Helvetica", 10.5)
        c.drawString(margin + 1.6 * cm, y - 1.1 * cm, body)

        y -= 1.6 * cm

    # --- Help box ---
    c.setFillColor(PAPER_DIM)
    c.roundRect(margin, 2 * cm, W - 2 * margin, 3.2 * cm, 6, fill=1, stroke=0)
    c.setFillColor(GREEN_900)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin + 0.8 * cm, 4.4 * cm, "Need help?")
    c.setFillColor(INK)
    c.setFont("Helvetica", 10.5)
    c.drawString(margin + 0.8 * cm, 3.7 * cm,
                 "Call the school office on 0115 622615 (Mon-Fri 7:00am-4:30pm).")
    c.drawString(margin + 0.8 * cm, 3.2 * cm,
                 "Or sign in to doricesmart.ac.ke and click \"Pay with M-Pesa\" — we'll send")
    c.drawString(margin + 0.8 * cm, 2.7 * cm,
                 "an M-Pesa prompt straight to your phone so you don't have to type anything.")
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(margin + 0.8 * cm, 2.2 * cm, '"Safety First" — Dorice Smart Academy, Lumakanda')

    # --- Footer line ---
    c.setStrokeColor(GOLD)
    c.setLineWidth(2)
    c.line(margin, 1.2 * cm, W - margin, 1.2 * cm)

    c.setFillColor(INK_SOFT)
    c.setFont("Helvetica", 8)
    c.drawString(margin, 0.7 * cm,
                 "© 2026 Dorice Smart Academy · Lumakanda, Kakamega County")
    c.drawRightString(W - margin, 0.7 * cm, "Keep this page handy — share with grandparents & guardians")


def main():
    c = canvas.Canvas(OUT, pagesize=A4)
    draw(c)
    c.showPage()
    c.save()
    size = os.path.getsize(OUT)
    print(f"Wrote {OUT} ({size} bytes)")


if __name__ == "__main__":
    main()
