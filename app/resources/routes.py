"""Learning Resources — 'Modern Notes' page with a dedicated
Junior Secondary (Gr 7-9) Computer Studies / pre-technical studies
section, as the spec calls for.
"""
from flask import Blueprint, render_template

resources_bp = Blueprint("resources", __name__)


# Note catalog. In a real deployment these would point to PDFs hosted
# in /static/notes/. We keep the catalog data in the route so the
# template is purely presentational.
NOTES = [
    # --- Lower & Upper Primary ---
    {
        "id": "p1-literacy",
        "title": "Literacy Building Blocks (Gr 1-3)",
        "category": "Lower Primary",
        "subject": "English / Kiswahili",
        "summary": "Phonics charts, sight-word lists, and short reading passages aligned to the CBC literacy strand.",
        "file": "notes/primary-literacy.pdf",
        "new": False,
    },
    {
        "id": "p1-numeracy",
        "title": "Numeracy Workbook (Gr 1-3)",
        "category": "Lower Primary",
        "subject": "Mathematics",
        "summary": "Worked examples for counting, place value, addition and subtraction within the CBC numeracy strand.",
        "file": "notes/primary-numeracy.pdf",
        "new": False,
    },
    {
        "id": "p4-science",
        "title": "Science & Technology (Gr 4-6)",
        "category": "Upper Primary",
        "subject": "Science & Technology",
        "summary": "Activity sheets and home-experiment ideas for the Gr 4-6 S&T strand.",
        "file": "notes/primary-science.pdf",
        "new": True,
    },
    # --- Junior Secondary: Computer Studies + pre-technical ---
    {
        "id": "js-comp-foundations",
        "title": "Computer Studies: Foundations of Computing",
        "category": "Junior Secondary (Gr 7-9)",
        "subject": "Computer Studies",
        "summary": "Hardware, software, file management, and digital citizenship. CBC-aligned for Gr 7 entry.",
        "file": "notes/js-comp-foundations.pdf",
        "new": True,
    },
    {
        "id": "js-comp-wordprocessing",
        "title": "Word Processing with LibreOffice Writer",
        "category": "Junior Secondary (Gr 7-9)",
        "subject": "Computer Studies",
        "summary": "Hands-on exercises for formatting documents, tables, and references — the practical backbone of pre-technical studies.",
        "file": "notes/js-comp-word.pdf",
        "new": True,
    },
    {
        "id": "js-comp-scratch",
        "title": "Programming Logic with Scratch & Flowcharts",
        "category": "Junior Secondary (Gr 7-9)",
        "subject": "Computer Studies",
        "summary": "Sequence, selection, iteration — taught visually in Scratch, then translated into flowcharts.",
        "file": "notes/js-comp-scratch.pdf",
        "new": True,
    },
    {
        "id": "js-comp-html",
        "title": "Intro to Web: HTML & CSS Basics",
        "category": "Junior Secondary (Gr 7-9)",
        "subject": "Computer Studies / Pre-technical",
        "summary": "Build a single-page portfolio. Covers tags, attributes, semantic structure, and basic CSS.",
        "file": "notes/js-comp-html.pdf",
        "new": False,
    },
    {
        "id": "js-comp-safety",
        "title": "Online Safety & Digital Citizenship",
        "category": "Junior Secondary (Gr 7-9)",
        "subject": "Computer Studies",
        "summary": "Passwords, privacy, screen-time, and the school's acceptable-use policy.",
        "file": "notes/js-comp-safety.pdf",
        "new": False,
    },
    # --- Pre-technical cross-cut ---
    {
        "id": "js-pretetch-agri",
        "title": "Pre-technical Studies: Agriculture & Nutrition",
        "category": "Junior Secondary (Gr 7-9)",
        "subject": "Pre-technical Studies",
        "summary": "School garden plan, soil health, and basic nutrition tied to the CBC pre-technical strand.",
        "file": "notes/js-pretetch-agri.pdf",
        "new": False,
    },
    {
        "id": "js-pretetch-entrepreneurship",
        "title": "Pre-technical Studies: Entrepreneurship Project",
        "category": "Junior Secondary (Gr 7-9)",
        "subject": "Pre-technical Studies",
        "summary": "Term-long project: pick a product, plan, cost, sell. Reflect on what worked.",
        "file": "notes/js-pretetch-entr.pdf",
        "new": True,
    },
]


def _group(notes):
    """Group notes by category, preserving the order they were listed."""
    seen = []
    groups = []
    for n in notes:
        if n["category"] not in seen:
            seen.append(n["category"])
            groups.append({"name": n["category"], "notes": []})
        groups[seen.index(n["category"])]["notes"].append(n)
    return groups


@resources_bp.route("/")
def index():
    groups = _group(NOTES)
    # Highlight the Junior Secondary Computer Studies row for the menu
    js_comp_count = sum(
        1 for n in NOTES
        if n["category"].startswith("Junior Secondary")
        and n["subject"].startswith("Computer Studies")
    )
    return render_template(
        "resources/index.html",
        page_title="Learning Resources",
        groups=groups,
        js_comp_count=js_comp_count,
    )
