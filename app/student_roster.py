"""Dorice Smart Academy — student roster.

Extracted from the school's official fees list (word doc). Each entry
has an admission number (DSA-prefix), student name, and grade level.
This module is the single source of truth for new student records.

When the ICT admin uploads the Excel file, the records are cross-
checked against this list. Students NOT in the roster are flagged for
manual review before their account goes live.
"""
from collections import OrderedDict


# Admission-number pattern: DSA<3 digits>, with optional ".YYYY" year suffix.
# Example: DSA348 or DSA352.2024 (admitted in 2024).


STUDENT_ROSTER = OrderedDict([
    # ─── PLAYGROUP ───
    ("DSA348", ("BRILLIANT FAVOUR",      "Playgroup")),
    ("DSA349", ("LIAN JACE EWAGATA",     "Playgroup")),
    ("DSA350", ("TRISTAN FRANCIS",       "Playgroup")),
    ("DSA351", ("REIGNEL WEMA ASEKA",    "Playgroup")),
    ("DSA352", ("PRECIOUS ZAINABU",      "Playgroup")),
    ("DSA353", ("MARLYN JOY AKODOI",     "Playgroup")),
    ("DSA354", ("KRYSTAL GETRINNA",      "Playgroup")),
    ("DSA355", ("MIRIAN OYIKO",          "Playgroup")),
    ("DSA356", ("CARLTON WALELA",        "Playgroup")),
    ("DSA357", ("BAYLYNN CHEROP",        "Playgroup")),
    ("DSA358", ("JOHN MCDONALD",         "Playgroup")),
    ("DSA340", ("CARINA AGNES",          "Playgroup")),
    ("DSA359", ("JAYDEN ASAMBA",         "Playgroup")),
    ("DSA360", ("BRUCE KIGEN",           "Playgroup")),
    ("DSA361", ("FELICIA OYOTI",         "Playgroup")),
    ("DSA362", ("LAWEENS MUSIMBI",       "Playgroup")),
    ("DSA363", ("BILQIS MMBALITSI",      "Playgroup")),
    ("DSA364", ("KEZIAH KABEYEKA",       "Playgroup")),
    ("DSA365", ("ETHAN INGAITSA",        "Playgroup")),
    ("DSA366", ("IDD AMANI",             "Playgroup")),
    ("DSA367", ("JONNIAL NARRY LIVAHA",  "Playgroup")),
    ("DSA368", ("PRINCE CHANZU",         "Playgroup")),
    ("DSA374", ("PRINCE ASIGE",          "Playgroup")),
    ("DSA375", ("AMANDA WAMALWA",        "Playgroup")),
    ("DSA376", ("AIDEN JABALI",          "Playgroup")),

    # ─── PP1 ───
    ("DSA273", ("JAYDEN MUHANJI",        "PP1")),
    ("DSA268", ("GYWIN AMBANI",          "PP1")),
    ("DSA272", ("HARVEY KAIDE",          "PP1")),
    ("DSA275", ("DAWN ADEGO",            "PP1")),
    ("DSA266", ("ADAM SUDELS",           "PP1")),
    ("DSA267", ("FAITH MWENDE",          "PP1")),
    ("DSA265", ("PATIENCE LINYULU",      "PP1")),
    ("DSA271", ("JIBRAN LISECHE",        "PP1")),
    ("DSA276", ("CLERK MONTANA",         "PP1")),
    ("DSA284", ("ALYCIDE VIREN",         "PP1")),
    ("DSA287", ("ROWENNA MAJANI",        "PP1")),
    ("DSA285", ("NEO KAIROS",            "PP1")),
    ("DSA269", ("ALYSSA ERABA",          "PP1")),
    ("DSA270", ("ABRAHAM OCHIENG",       "PP1")),
    ("DSA274", ("GABRIELLA AMANDA",      "PP1")),
    ("DSA279", ("AMELIA NANGAI",         "PP1")),
    ("DSA280", ("HASTEN KIERAN",         "PP1")),
    ("DSA281", ("TAINA ALIVITSA",        "PP1")),
    ("DSA282", ("CORRALES ISTAYANA",     "PP1")),
    ("DSA286", ("ILHAN TASHA AMATTA",    "PP1")),
    ("DSA341", ("JOLEN JOSLINE",         "PP1")),
    ("DSA342", ("ELLEN MINAYO",          "PP1")),
    ("DSA343", ("GIANNA BETTY",          "PP1")),
    ("DSA344", ("SHANTEL WAWILE",        "PP1")),
    ("DSA345", ("MAYAN INYERERE",        "PP1")),
    ("DSA346", ("JAYDEN BARAKA",         "PP1")),
    ("DSA347", ("TRESHA LEXY",           "PP1")),
    ("DSA277", ("IVAN WACHIRA",          "PP1")),
    ("DSA369", ("KELLY MUNENE",          "PP1")),

    # ─── PP2 ───
    ("DSA232", ("ISRAEL MMASI",          "PP2")),
    ("DSA221", ("CALVIN NASIOMBE",       "PP2")),
    ("DSA248", ("KEN PAULWANASWA",       "PP2")),
    ("DSA228", ("KAYLIN ZAWADI",         "PP2")),
    ("DSA249", ("KEISEY MOKEIRA",        "PP2")),
    ("DSA223", ("MAYAN MALOBA",          "PP2")),
    ("DSA220", ("BLESSING SALOME",       "PP2")),
    ("DSA224", ("PATIENCE JOSINA",       "PP2")),
    ("DSA239", ("PRINCESS PENDO",        "PP2")),
    ("DSA256", ("BLESSING MMBONE",       "PP2")),
    ("DSA252", ("HARRIS AYOTI",          "PP2")),
    ("DSA250", ("KELSEA MADSIZA",        "PP2")),
    ("DSA262", ("ESTHER AYUMA",          "PP2")),
    ("DSA229", ("MARTHA ANDESO",         "PP2")),
    ("DSA233", ("NATASHA KHAKASA",       "PP2")),
    ("DSA241", ("DELIA NGESA",           "PP2")),
    ("DSA244", ("ALICIA MACHERA",        "PP2")),
    ("DSA238", ("BLESSING MWANIGA",      "PP2")),
    ("DSA258", ("RAYLAN KIGANDA",        "PP2")),
    ("DSA230", ("RYAN SHALO",            "PP2")),
    ("DSA237", ("CARLISLE MAINA",        "PP2")),
    ("DSA236", ("ELIEZER GARRIL",        "PP2")),
    ("DSA247", ("JOHN MUHAVI",           "PP2")),
    ("DSA261", ("GEORGE ODHIAMBO",       "PP2")),
    ("DSA234", ("WATSON ADAJI",          "PP2")),
    ("DSA242", ("ADRIAN WANYONYI",       "PP2")),
    ("DSA260", ("CALMAX OJANGO",         "PP2")),
    ("DSA339", ("ASAPH BEZALEL",         "PP2")),
    ("DSA243", ("PRETTY KAGEHA",         "PP2")),
    ("DSA254", ("LARRY ODHIAMBO",        "PP2")),
    ("DSA240", ("CHERYBRIEL LODITE",     "PP2")),
    ("DSA338", ("JOHN MUHANDO",          "PP2")),
    ("DSA255", ("NOLAN HLESTER SIKINYI", "PP2")),
    ("DSA264", ("SHANYPRITTY ANYONA",    "PP2")),
    ("DSA217", ("RACKEL KAZIRA",         "PP2")),
    ("DSA219", ("DELANIE SANTOZ",        "PP2")),
    ("DSA225", ("DALIA ATEMO",           "PP2")),
    ("DSA226", ("JANNEL HAWI",           "PP2")),
    ("DSA227", ("DELLAN MAJANI",         "PP2")),
    ("DSA231", ("BELVIS CHETAMBE",       "PP2")),
    ("DSA235", ("BARON WERE",            "PP2")),
    ("DSA246", ("BREVIAN CHELAGAT",      "PP2")),
    ("DSA251", ("BREENA ZAWADI",         "PP2")),
    ("DSA253", ("SHERLEEN WANGARI",      "PP2")),
    ("DSA257", ("ENRIQUE JESSE",         "PP2")),
    ("DSA259", ("DONNEL KANDA",          "PP2")),
    ("DSA263", ("JYLIAN JADE",           "PP2")),
    ("DSA329", ("LEONARD PAUL",          "PP2")),
    ("DSA330", ("BRAYDEN KIVULI",        "PP2")),
    ("DSA331", ("TRESHA LEXY",           "PP2")),
    ("DSA332", ("SAMANTA AJANDO",        "PP2")),
    ("DSA333", ("MIREYA CHEPCHUMBA",     "PP2")),
    ("DSA336", ("WISDOM OLUOCH",         "PP2")),
    ("DSA337", ("MELANY WASIKE",         "PP2")),
    ("DSA370", ("BRIGHTON MUZEMBI",      "PP2")),
    ("DSA321", ("SHERYL NEEMA",          "PP2")),

    # ─── GRADE 1 ───
    ("DSA193", ("KING NATHANIEL",        "Grade 1")),
    ("DSA199", ("AMELIA GAVRILA",        "Grade 1")),
    ("DSA210", ("GRITEL KEMUNTO",        "Grade 1")),
    ("DSA201", ("PRINCE NILLAN",         "Grade 1")),
    ("DSA192", ("CLOWIE AREYO",          "Grade 1")),
    ("DSA205", ("PRAISE WEMA",           "Grade 1")),
    ("DSA198", ("REHEMA NEKESA",         "Grade 1")),
    ("DSA200", ("VIVIAN NALIAKA OKAYA",  "Grade 1")),
    ("DSA206", ("MELINDA AHONO",         "Grade 1")),
    ("DSA319", ("HOPELYNE ZAWADI",       "Grade 1")),
    ("DSA194", ("SHANTEL NYABOKE",       "Grade 1")),
    ("DSA215", ("ANN WANJIRU",           "Grade 1")),
    ("DSA208", ("PRECIOUS WANJIRU",      "Grade 1")),
    ("DSA196", ("RYAN OMARI",            "Grade 1")),
    ("DSA191", ("BRIAN WAMBUNGO",        "Grade 1")),
    ("DSA202", ("ZYTON ATIEMA",          "Grade 1")),
    ("DSA195", ("WESLEY WAFULA",         "Grade 1")),
    ("DSA203", ("ARMSTRONG AGALA",       "Grade 1")),
    ("DSA214", ("WISDOM IKHAVI",         "Grade 1")),
    ("DSA212", ("BASIL KEYA",            "Grade 1")),
    ("DSA197", ("WAYNE OPICHA",          "Grade 1")),
    ("DSA209", ("EZRA OMBATI",           "Grade 1")),
    ("DSA207", ("INNOCENT WISE",         "Grade 1")),
    ("DSA216", ("OWEN ABISAI",           "Grade 1")),
    ("DSA213", ("YNNAH AMARA",           "Grade 1")),
    ("DSA317", ("JAYDEN WANYONYI",       "Grade 1")),
    ("DSA318", ("NICOLE ANDESO",         "Grade 1")),
    ("DSA320", ("JAYDEN MISAVO",         "Grade 1")),
    ("DSA322", ("DEBORAH ANDESO",        "Grade 1")),
    ("DSA323", ("ELSIE JAHENDA",         "Grade 1")),
    ("DSA324", ("BRAVIN JUMA",           "Grade 1")),
    ("DSA325", ("HELLEN ADISA",          "Grade 1")),
    ("DSA326", ("CLARENCE WANYAMA",      "Grade 1")),
    ("DSA327", ("ADRIAN LUSENO",         "Grade 1")),
    ("DSA328", ("SERAH BEULLAH",         "Grade 1")),

    # ─── GRADE 2 ───
    ("DSA166", ("CAYDEN EKASI EWAGATA",  "Grade 2")),
    ("DSA167", ("DAVID OMOLLO",          "Grade 2")),
    ("DSA177", ("MAXTON BUSOLO",         "Grade 2")),
    ("DSA174", ("WESLEY ONDEKO",         "Grade 2")),
    ("DSA169", ("ALPHA LUSENO",          "Grade 2")),
    ("DSA188", ("EMMANUEL DICKSON",      "Grade 2")),
    ("DSA186", ("DILAN IMBIRA",          "Grade 2")),
    ("DSA176", ("ALEEN NEEMA",           "Grade 2")),
    ("DSA168", ("SHAKINA JENDEKA",       "Grade 2")),
    ("DSA179", ("JERUSA IMANI",          "Grade 2")),
    ("DSA182", ("GOLDRING PENDO",        "Grade 2")),
    ("DSA164", ("BEAUTY KUYA",           "Grade 2")),
    ("DSA184", ("LAREEN AVIANA",         "Grade 2")),
    ("DSA172", ("ESTHER JEROTICH",       "Grade 2")),
    ("DSA187", ("AGNESS WAIRIMU",        "Grade 2")),
    ("DSA183", ("KHLOE VIHENDA",         "Grade 2")),
    ("DSA189", ("SHANICE MALWEYO",       "Grade 2")),
    ("DSA178", ("JULIET INGAITSA",       "Grade 2")),
    ("DSA175", ("NAIMA KADENYI",         "Grade 2")),
    ("DSA181", ("WESLEY OVAMBA",         "Grade 2")),
    ("DSA171", ("FELICITY CONFIDENCE",   "Grade 2")),
    ("DSA190", ("NICOLE INJETE",         "Grade 2")),
    ("DSA165", ("PARISA PHILIS",         "Grade 2")),
    ("DSA173", ("DEJ WAMBOI",            "Grade 2")),
    ("DSA180", ("TRESURE FAVOUR",        "Grade 2")),
    ("DSA310", ("JAYSON OPIYO",          "Grade 2")),
    ("DSA311", ("ALKAEL PENDO",          "Grade 2")),
    ("DSA312", ("NATALIA MMBONE",        "Grade 2")),
    ("DSA313", ("GRACIOUS MUHONJA",      "Grade 2")),
    ("DSA314", ("ESTHER KABEKA",         "Grade 2")),
    ("DSA315", ("HODAVIAH INGOSI",      "Grade 2")),
    ("DSA316", ("SARAH IMINZA",          "Grade 2")),

    # ─── GRADE 3 ───
    ("DSA159", ("IQBAL AMATA",           "Grade 3")),
    ("DSA148", ("BRAVIN VUSIA",          "Grade 3")),
    ("DSA138", ("WISDOM ENOCH",          "Grade 3")),
    ("DSA158", ("DICKENS OLOO",          "Grade 3")),
    ("DSA152", ("GRIVIX OLOO",           "Grade 3")),
    ("DSA137", ("DARRY BUSUTU",          "Grade 3")),
    ("DSA155", ("BYRON LUTHER",          "Grade 3")),
    ("DSA132", ("ARIEL OMBIMA",          "Grade 3")),
    ("DSA134", ("ANNEL MALOBA",          "Grade 3")),
    ("DSA136", ("JANET TALIA",           "Grade 3")),
    ("DSA140", ("SALHA SALIM",           "Grade 3")),
    ("DSA149", ("STACY CHEBET",          "Grade 3")),
    ("DSA142", ("ALICIA MIDECHA",        "Grade 3")),
    ("DSA150", ("SOPHY MIDEVA",          "Grade 3")),
    ("DSA156", ("ELICIE OMKLOT",         "Grade 3")),
    ("DSA106", ("FAVOUR BLESSING",       "Grade 3")),
    ("DSA139", ("TALIA WAIRIMU",         "Grade 3")),
    ("DSA160", ("CHRISTINER CLEVERLAND", "Grade 3")),
    ("DSA143", ("DELIN MACHOSO",         "Grade 3")),
    ("DSA290", ("WINNIE BURIANA",        "Grade 3")),
    ("DSA146", ("BIANCA TAMARA",         "Grade 3")),
    ("DSA153", ("BLESSING NANJALA",      "Grade 3")),
    ("DSA157", ("MODESTER KAGEHA",       "Grade 3")),
    ("DSA151", ("CHERYL MUHANDO",        "Grade 3")),
    ("DSA161", ("SHERLYN MWAITSI",       "Grade 3")),
    ("DSA133", ("FORTUNE MWANDISHI",     "Grade 3")),
    ("DSA135", ("PRUDENCE MIDEVA",       "Grade 3")),
    ("DSA144", ("REMY KYLE",             "Grade 3")),
    ("DSA145", ("VICTORIA MINAYO",       "Grade 3")),
    ("DSA147", ("ESTHER HADASA",         "Grade 3")),
    ("DSA154", ("LORAYNE CHLOE",         "Grade 3")),
    ("DSA162", ("DANIEL JUMA",           "Grade 3")),
    ("DSA163", ("ANNE ZAWADI",           "Grade 3")),
    ("DSA288", ("ATHALIA YEGO",          "Grade 3")),
    ("DSA302", ("WYNCY MICHAEL",         "Grade 3")),
    ("DSA303", ("FIDEL KAVEHAGI",        "Grade 3")),
    ("DSA304", ("SHERYL EDASA",          "Grade 3")),
    ("DSA306", ("PRINCE KIPTOO",         "Grade 3")),
    ("DSA307", ("EDDY ARUNGA",           "Grade 3")),
    ("DSA308", ("RICHARD MUSYOKI",       "Grade 3")),
    ("DSA309", ("CHARLES MULANDA",       "Grade 3")),
    ("DSA371", ("HYRITE NASALI",         "Grade 3")),

    # ─── GRADE 4 ───
    ("DSA119", ("DEBRA AHONO",           "Grade 4")),
    ("DSA112", ("ESTHER JAHENDA",        "Grade 4")),
    ("DSA122", ("LEAH BIRIANA",          "Grade 4")),
    ("DSA120", ("SHANTEL ROSE",          "Grade 4")),
    ("DSA121", ("TACY KHAMSA",           "Grade 4")),
    ("DSA116", ("SHERLYNE KENDI",        "Grade 4")),
    ("DSA125", ("BELINDA CHEPCHUMBA",    "Grade 4")),
    ("DSA129", ("JEDIDA BERACCA",        "Grade 4")),
    ("DSA110", ("GIFT AMUKHUMA",         "Grade 4")),
    ("DSA130", ("RYAN LUTENYI",          "Grade 4")),
    ("DSA123", ("CEDRIC GODIA",          "Grade 4")),
    ("DSA124", ("MATHEW KIPRUTO",        "Grade 4")),
    ("DSA117", ("CHRISTIAN AMUYUNZU",    "Grade 4")),
    ("DSA118", ("SUNDAY OKERE",          "Grade 4")),
    ("DSA107", ("FIDEL MABONGA",         "Grade 4")),
    ("DSA113", ("ELPHAS OLEMBO",         "Grade 4")),
    ("DSA131", ("LAMPAD AMBASA",         "Grade 4")),
    ("DSA109", ("LEON OSOTSI",           "Grade 4")),
    ("DSA128", ("TWAHIB KEYA",           "Grade 4")),
    ("DSA115", ("FRAIZER MUTONGA",       "Grade 4")),
    ("DSA108", ("MARY ATIENO",           "Grade 4")),
    ("DSA111", ("PRETTY AKENG'O",        "Grade 4")),
    ("DSA114", ("NATHAN EROBA",          "Grade 4")),
    ("DSA127", ("ISRAEL CHIGAI",         "Grade 4")),
    ("DSA301", ("LEON MUTANGE",          "Grade 4")),

    # ─── GRADE 5 ───
    ("DSA105", ("SAMANTHA CHEMTAI",      "Grade 5")),
    ("DSA091", ("MARTIN MARION",         "Grade 5")),
    ("DSA103", ("SULEIMAN ZAK ARIA",     "Grade 5")),
    ("DSA089", ("BRANDON FASU",          "Grade 5")),
    ("DSA092", ("KEVIN MWIKALI",         "Grade 5")),
    ("DSA086", ("JOSEPH NAFTALI",        "Grade 5")),
    ("DSA104", ("MONROE MOSES",          "Grade 5")),
    ("DSA102", ("JOY MUSEMBI",           "Grade 5")),
    ("DSA098", ("TAHILLA NJOKI",         "Grade 5")),
    ("DSA094", ("GLORYPATIENCE",         "Grade 5")),
    ("DSA095", ("AULYNE OKWISA",         "Grade 5")),
    ("DSA087", ("KENTICE MORAA",         "Grade 5")),
    ("DSA085", ("QUINTER NALIAKA",       "Grade 5")),
    ("DSA097", ("ANICIA ACHUNGO",        "Grade 5")),
    ("DSA093", ("PRINCESS ANN NAFULA",   "Grade 5")),
    ("DSA096", ("LAURA AMBIO",           "Grade 5")),
    ("DSA090", ("PRECIOUS MIDECHA",      "Grade 5")),
    ("DSA099", ("ADRIAN LAVATSA",        "Grade 5")),
    ("DSA100", ("ADAMS OLOO",            "Grade 5")),
    ("DSA289", ("GODFREY MESHACK",       "Grade 5")),
    ("DSA299", ("ZING ZANG LEE",         "Grade 5")),

    # ─── GRADE 6 ───
    ("DSA071", ("ROMEO ENOCH",           "Grade 6")),
    ("DSA070", ("KEITH VUTAGA",          "Grade 6")),
    ("DSA082", ("REUBEN INGADWA",        "Grade 6")),
    ("DSA069", ("PROMINENT USHINDI",     "Grade 6")),
    ("DSA080", ("EMMANUEL KIMUTAI",      "Grade 6")),
    ("DSA074", ("NANCY GRACIOUS",        "Grade 6")),
    ("DSA067", ("ANGELA AFANDI",         "Grade 6")),
    ("DSA084", ("JOAN MMBONE",           "Grade 6")),
    ("DSA079", ("BLESSING GIFT",         "Grade 6")),
    ("DSA081", ("ANGEL WANGESHI",        "Grade 6")),
    ("DSA078", ("HUMPREY LUVAI",         "Grade 6")),
    ("DSA077", ("PETER ARUNGA",          "Grade 6")),
    ("DSA068", ("FAVOURITE NANDASABA",   "Grade 6")),
    ("DSA072", ("JANET SHYMA",           "Grade 6")),
    ("DSA073", ("AMANDA NICOLE",         "Grade 6")),
    ("DSA075", ("BRAVIN MUDEMBE",        "Grade 6")),
    ("DSA076", ("HALLMARY SUMBA",        "Grade 6")),
    ("DSA083", ("INNOCENT OMUSALE",      "Grade 6")),
    ("DSA295", ("PHILEMON SAKWA",        "Grade 6")),
    ("DSA296", ("RYAN IMBUDI",           "Grade 6")),
    ("DSA297", ("SOLOMON MUTUKU",        "Grade 6")),
    ("DSA298", ("PETRICE ALEKWA",        "Grade 6")),

    # ─── GRADE 7 ───
    ("DSA053", ("CYRIL ASEMBO",          "Grade 7")),
    ("DSA064", ("FIDEL CASTROL",         "Grade 7")),
    ("DSA054", ("CALEB SHAMAH",          "Grade 7")),
    ("DSA051", ("DENZEL MULIEVI",        "Grade 7")),
    ("DSA062", ("WARREN RIO",            "Grade 7")),
    ("DSA060", ("SHANE MARITEY",         "Grade 7")),
    ("DSA050", ("DELIGHT BAHATI",        "Grade 7")),
    ("DSA057", ("JOSEPH AVOGA",          "Grade 7")),
    ("DSA056", ("DEL MUSALIA",           "Grade 7")),
    ("DSA048", ("GODWILL ONDEGO",        "Grade 7")),
    ("DSA055", ("JUNIOR WANASWA",        "Grade 7")),
    ("DSA065", ("MITCHEL MBAI",          "Grade 7")),
    ("DSA061", ("ZILPHA ANJELA",         "Grade 7")),
    ("DSA052", ("SALMA SALIM",           "Grade 7")),
    ("DSA063", ("RAHMA INYANGANO",       "Grade 7")),
    ("DSA059", ("MAGDALINE LINYARI",     "Grade 7")),
    ("DSA058", ("BERRYL SHALOM",         "Grade 7")),
    ("DSA049", ("RAVIN OKALO",           "Grade 7")),
    ("DSA066", ("PETER SAKWA",           "Grade 7")),
    ("DSA293", ("TREVOR SHALIMBA AURA",  "Grade 7")),
    ("DSA294", ("CHURCHIL IMANI",        "Grade 7")),

    # ─── GRADE 8 ───
    ("DSA034", ("CAROL BUYANZI",         "Grade 8")),
    ("DSA043", ("BLESSING KUYA",         "Grade 8")),
    ("DSA038", ("SHALINE MUHADIA",       "Grade 8")),
    ("DSA037", ("FAVOR KIMULI",          "Grade 8")),
    ("DSA025", ("KAGAI MARAISHA",        "Grade 8")),
    ("DSA047", ("MONAR MUKASIA",         "Grade 8")),
    ("DSA027", ("FAVOR NAOMI",           "Grade 8")),
    ("DSA033", ("SHANICE IRUSA",         "Grade 8")),
    ("DSA046", ("EZRA TIEMA",            "Grade 8")),
    ("DSA031", ("AMMI PRAISE WESA",      "Grade 8")),
    ("DSA040", ("FANUEL NYAKUNDI",       "Grade 8")),
    ("DSA028", ("DARIUS BUSUTU",         "Grade 8")),
    ("DSA029", ("OZIL WANAKACHA",        "Grade 8")),
    ("DSA044", ("PETER ARUNGA",          "Grade 8")),
    ("DSA045", ("FAITH KAKAI",           "Grade 8")),
    ("DSA041", ("LEWIS WEKESA",          "Grade 8")),
    ("DSA026", ("CANTWEL AFANDI",        "Grade 8")),
    ("DSA030", ("SAMANTHA KHASANDI",     "Grade 8")),
    ("DSA032", ("LUCKY KWAMBAE",         "Grade 8")),
    ("DSA035", ("JOHN PAUL NDUNG'U",     "Grade 8")),
    ("DSA036", ("ANGEL BARAKA",          "Grade 8")),
    ("DSA039", ("LUCKY OMINDE",          "Grade 8")),
    ("DSA042", ("HYALINE NOVEL INZERA",  "Grade 8")),
    ("DSA291", ("MELVIN AVEDI",          "Grade 8")),
    ("DSA292", ("BLESSING ANYONA",       "Grade 8")),

    # ─── GRADE 9 ───
    ("DSA023", ("LARRY IMBAYA",          "Grade 9")),
    ("DSA017", ("SASHA NAKHUMICHA",      "Grade 9")),
    ("DSA015", ("BLESSING TALI",         "Grade 9")),
    ("DSA016", ("JOYCE OKAYA",           "Grade 9")),
    ("DSA013", ("SAWIYA LUKWAGO",        "Grade 9")),
    ("DSA019", ("ADRINE KIMBERLY",       "Grade 9")),
    ("DSA020", ("ELISHA OKERE",          "Grade 9")),
    ("DSA021", ("EXCEVIOUR KIKUYU",      "Grade 9")),
    ("DSA014", ("IAN AKALA",             "Grade 9")),
    ("DSA018", ("GREGORY ADEYA",         "Grade 9")),
    ("DSA010", ("CHRISTABEL AKENGO",     "Grade 9")),
    ("DSA011", ("BARRACK MUNIKA",        "Grade 9")),
    ("DSA012", ("SECURE CALVIN",         "Grade 9")),
    ("DSA022", ("ANGEL MMBONE",          "Grade 9")),
    ("DSA024", ("JACOB ALOO",            "Grade 9")),
])


# All grades in canonical order
ALL_GRADES = [
    "Playgroup", "PP1", "PP2",
    "Grade 1", "Grade 2", "Grade 3",
    "Grade 4", "Grade 5", "Grade 6",
    "Grade 7", "Grade 8", "Grade 9",
]


def get_grade_for(admission_no: str) -> str:
    """Return the grade for an admission number, or '' if unknown."""
    entry = STUDENT_ROSTER.get(admission_no.strip().upper())
    return entry[1] if entry else ""


def get_name_for(admission_no: str) -> str:
    """Return the official name on the roster for an admission number."""
    entry = STUDENT_ROSTER.get(admission_no.strip().upper())
    return entry[0] if entry else ""


def is_known_student(admission_no: str) -> bool:
    """True if the admission number is on the official roster."""
    return admission_no.strip().upper() in STUDENT_ROSTER


def students_in_grade(grade: str) -> list:
    """Return all [(adm_no, name), ...] in a given grade."""
    return [
        (adm, name) for adm, (name, g) in STUDENT_ROSTER.items()
        if g.lower() == grade.lower()
    ]


# ─── CBC CURRICULUM SUBJECTS PER PHASE ───
# These mirror the official Kenyan MoE summative assessment report
# forms (3 templates the school uses):
#   - Pre-Primary  (PP1, PP2)
#   - Lower Primary (Grade 1–3)
#   - Junior School (Grade 4–9)

PRE_PRIMARY_SUBJECTS = [
    "Mathematics",
    "Language",
    "Environmental",
    "Psychomotor",
    "Kiswahili",
    "Kusoma",
    "Reading",
    "CRE",
]

LOWER_PRIMARY_SUBJECTS = [
    "English",
    "Kiswahili",
    "Mathematics",
    "Environmental",
    "Creative Arts & Sports",
    "Religious Education",
    "Reading",
    "Kusoma",
]

JUNIOR_SCHOOL_SUBJECTS = [
    "English",
    "Kiswahili",
    "Mathematics",
    "Integrated Science",
    "Pre-Technical Studies",
    "Social Studies",
    "Agric/Nutrition",
    "Creative Arts & Sports",
    "Religious Education",
]


def subjects_for_grade(grade: str) -> list:
    """Return the right list of subjects for a given grade."""
    if grade in ("Playgroup", "PP1", "PP2"):
        return PRE_PRIMARY_SUBJECTS
    if grade in ("Grade 1", "Grade 2", "Grade 3"):
        return LOWER_PRIMARY_SUBJECTS
    if grade.startswith("Grade"):
        return JUNIOR_SCHOOL_SUBJECTS
    return []


def phase_for_grade(grade: str) -> str:
    if grade in ("Playgroup", "PP1", "PP2"):
        return "Pre-Primary"
    if grade in ("Grade 1", "Grade 2", "Grade 3"):
        return "Lower Primary"
    if grade.startswith("Grade"):
        return "Junior School"
    return ""


# Performance-level rubric (4-point CBC scale)
PERFORMANCE_LEVELS = [
    (4, "Exceeding Expectation (EE)"),
    (3, "Meeting Expectation (ME)"),
    (2, "Approaching Expectation (AE)"),
    (1, "Below Expectation (BE)"),
]


# School's official information (from the photos)
SCHOOL_NAME    = "Dorice Smart Academy"
SCHOOL_ADDRESS = "P.O. Box 204, Kipkaren River"
SCHOOL_EMAIL   = "Doricesmartprimaryschool89@gmail.com"
SCHOOL_PHONE   = "0115 622615"
SCHOOL_LOCATION = "Lumakanda, Kakamega County"
SCHOOL_MOTTO   = "Safety First"


# Terms
TERMS = ["Term 1", "Term 2", "Term 3"]
