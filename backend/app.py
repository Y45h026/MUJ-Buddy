from flask import Flask, render_template, request, jsonify
from models import db, Professor, Timetable
from datetime import datetime
import os
from dotenv import load_dotenv
from groq import Groq
import csv
from werkzeug.utils import secure_filename
from functools import wraps
from flask import session, redirect, url_for
import re
from flask import abort
from flask_cors import CORS

load_dotenv()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

app = Flask(__name__, template_folder="../templates", static_folder="../static")
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])
app.secret_key = "muj-buddy-secret-key"  # change in production

# Absolute DB path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
db_path = os.path.join(BASE_DIR, 'muj_buddy.db')

app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
print("Loaded API Key:", GEMINI_API_KEY)  # remove later

db.init_app(app)

# Create tables
with app.app_context():
    db.create_all()

EMAIL_REGEX = re.compile(r"[^@]+@[^@]+\.[^@]+")

VALID_DAYS = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"}

def validate_time(t):
    return bool(re.match(r"^\d{2}:\d{2}$", t))


def admin_login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not session.get("admin_logged_in"):
            return redirect(url_for("admin_login"))
        return f(*args, **kwargs)
    return wrapper

@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    error = None
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session["admin_logged_in"] = True
            return redirect(url_for("admin_panel"))
        else:
            error = "Invalid credentials"

    return render_template("admin_login.html", error=error)

@app.route("/", methods=["GET"])
def index():
    q = request.args.get("q", "")
    results = []
    if q:
        results = Professor.query.filter(Professor.name.ilike(f"%{q}%")).limit(20).all()
    return render_template("index.html", query=q, results=results)

@app.route("/prof/<int:prof_id>")
def prof_detail(prof_id):
    prof = Professor.query.get_or_404(prof_id)

    # Selected day (0 = Monday)
    day_param = request.args.get("day")
    if day_param is not None and day_param.isdigit():
        selected_day_index = int(day_param)
    else:
        selected_day_index = datetime.now().weekday()

    classes = (
        Timetable.query
        .filter_by(prof_id=prof_id, day_of_week=selected_day_index)
        .order_by(Timetable.start_time)
        .all()
    )

    free_slots = compute_free_slots(classes, "08:00", "18:00")

    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    return render_template(
        "prof.html",
        prof=prof,
        classes=classes,
        free_slots=free_slots,
        day_names=day_names,
        selected_day_index=selected_day_index
    )

@app.route("/admin")
@admin_login_required
def admin_panel():
    return render_template("admin_upload.html")

@app.route("/admin/upload/professors", methods=["POST"])
@admin_login_required
def admin_upload_professors():
    file = request.files.get("file")
    if not file:
        return render_template("admin_upload.html", message="No file selected")

    content = file.stream.read().decode("utf-8-sig").splitlines()
    reader = csv.DictReader(content)

    required_fields = {"name", "department", "email", "phone", "block", "cabin"}
    errors = []
    rows = list(reader)

    if not rows:
        return render_template("admin_upload.html", message="CSV is empty")

    if not required_fields.issubset(reader.fieldnames):
        return render_template(
            "admin_upload.html",
            errors=[f"Missing required columns: {required_fields - set(reader.fieldnames)}"]
        )

    seen_emails = set()

    for idx, row in enumerate(rows, start=2):
        email = row["email"].strip().lower()

        if not EMAIL_REGEX.match(email):
            errors.append(f"Row {idx}: Invalid email format")

        if email in seen_emails:
            errors.append(f"Row {idx}: Duplicate email in CSV")

        seen_emails.add(email)

        for field in required_fields:
            if not row[field].strip():
                errors.append(f"Row {idx}: '{field}' cannot be empty")

    if errors:
        return render_template("admin_upload.html", errors=errors)

    Professor.query.delete()
    db.session.commit()

    for row in rows:
        prof = Professor(
            name=row["name"].strip(),
            department=row["department"].strip(),
            email=row["email"].strip().lower(),
            phone=row["phone"].strip(),
            block=row["block"].strip(),
            cabin=row["cabin"].strip(),
            notes=None
        )
        db.session.add(prof)

    db.session.commit()
    return render_template("admin_upload.html", message="✅ Professors uploaded successfully!")

@app.route("/admin/upload/timetable", methods=["POST"])
@admin_login_required
def admin_upload_timetable():
    file = request.files.get("file")
    if not file:
        return render_template("admin_upload.html", message="No file selected")

    content = file.stream.read().decode("utf-8-sig").splitlines()
    reader = csv.DictReader(content)
    rows = list(reader)
    errors = []

    required_fields = {"prof_email", "day", "course", "start_time", "end_time", "location"}

    if not rows:
        return render_template("admin_upload.html", message="CSV is empty")

    if not required_fields.issubset(reader.fieldnames):
        return render_template(
            "admin_upload.html",
            errors=[f"Missing required columns: {required_fields - set(reader.fieldnames)}"]
        )

    DAY_MAP = {
        "Monday": 0,
        "Tuesday": 1,
        "Wednesday": 2,
        "Thursday": 3,
        "Friday": 4,
        "Saturday": 5,
        "Sunday": 6
    }

    for idx, row in enumerate(rows, start=2):
        email = row["prof_email"].strip().lower()

        if not EMAIL_REGEX.match(email):
            errors.append(f"Row {idx}: Invalid professor email")

        if row["day"] not in VALID_DAYS:
            errors.append(f"Row {idx}: Invalid day '{row['day']}'")

        if not validate_time(row["start_time"]) or not validate_time(row["end_time"]):
            errors.append(f"Row {idx}: Invalid time format (HH:MM)")

        if row["start_time"] >= row["end_time"]:
            errors.append(f"Row {idx}: Start time must be before end time")

        if not Professor.query.filter_by(email=email).first():
            errors.append(f"Row {idx}: Professor email not found in database")

    if errors:
        return render_template("admin_upload.html", errors=errors)

    Timetable.query.delete()
    db.session.commit()

    for row in rows:
        professor = Professor.query.filter_by(
            email=row["prof_email"].strip().lower()
        ).first()

        entry = Timetable(
            prof_id=professor.id,
            day_of_week=DAY_MAP[row["day"]],
            course_name=row["course"].strip(),
            start_time=row["start_time"].strip(),
            end_time=row["end_time"].strip(),
            location=row["location"].strip()
        )
        db.session.add(entry)

    db.session.commit()
    return render_template("admin_upload.html", message="✅ Timetable uploaded successfully!")

@app.route("/admin/logout")
def admin_logout():
    session.clear()
    return redirect(url_for("admin_login"))

@app.route("/api/search")
def api_search():
    q = request.args.get("q", "")
    if not q:
        return jsonify([])
    results = Professor.query.filter(Professor.name.ilike(f"%{q}%")).limit(20).all()
    if not results:
        return jsonify({"message": "No professors found."}), 404
    out = [{
        "id": p.id,
        "name": p.name,
        "department": p.department,
        "email": p.email,
        "phone": p.phone,
        "cabin": p.cabin,
        "block": p.block
    } for p in results]
    return jsonify(out)

def compute_free_slots(classes, start="08:00", end="18:00"):
    slots = []
    current = start
    for c in classes:
        if c.start_time > current:
            slots.append((current, c.start_time))
        current = max(current, c.end_time)
    if current < end:
        slots.append((current, end))
    return slots

@app.route("/api/professors")
def api_get_professors():
    q = request.args.get("q", "").strip()

    query = Professor.query
    if q:
        query = query.filter(Professor.name.ilike(f"%{q}%"))

    professors = query.limit(50).all()

    return jsonify([
        {
            "id": p.id,
            "name": p.name,
            "department": p.department,
            "email": p.email,
            "phone": p.phone,
            "block": p.block,
            "cabin": p.cabin
        }
        for p in professors
    ])

@app.route("/api/professors/<int:prof_id>")
def api_professor_detail(prof_id):
    p = Professor.query.get_or_404(prof_id)

    return jsonify({
        "id": p.id,
        "name": p.name,
        "department": p.department,
        "email": p.email,
        "phone": p.phone,
        "block": p.block,
        "cabin": p.cabin
    })

@app.route("/api/professors/<int:prof_id>/timetable")
def api_professor_timetable(prof_id):
    day_param = request.args.get("day")

    if day_param is None or not day_param.isdigit():
        abort(400, "Query param 'day' (0=Monday) is required")

    day_index = int(day_param)

    entries = (
        Timetable.query
        .filter_by(prof_id=prof_id, day_of_week=day_index)
        .order_by(Timetable.start_time)
        .all()
    )

    return jsonify([
        {
            "course": e.course_name,
            "start_time": e.start_time,
            "end_time": e.end_time,
            "location": e.location
        }
        for e in entries
    ])

@app.route("/api/professors/<int:prof_id>/availability")
def api_professor_availability(prof_id):
    day_param = request.args.get("day")

    if day_param is None or not day_param.isdigit():
        abort(400, "Query param 'day' (0=Monday) is required")

    day_index = int(day_param)

    classes = (
        Timetable.query
        .filter_by(prof_id=prof_id, day_of_week=day_index)
        .order_by(Timetable.start_time)
        .all()
    )

    free_slots = compute_free_slots(classes, "08:00", "18:00")

    return jsonify([
        {"from": s[0], "to": s[1]} for s in free_slots
    ])

@app.route("/api/professors/<int:prof_id>")
def get_professor(prof_id):
    prof = Professor.query.get_or_404(prof_id)
    return jsonify({
        "id": prof.id,
        "name": prof.name,
        "department": prof.department,
        "email": prof.email,
        "phone": prof.phone,
        "block": prof.block,
        "cabin": prof.cabin
    })

# 1. JSON login — called by React admin modal
@app.route("/api/admin/login", methods=["POST"])
def api_admin_login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    username = data.get("username", "")
    password = data.get("password", "")

    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        session["admin_logged_in"] = True
        return jsonify({"message": "Logged in successfully"})
    else:
        return jsonify({"error": "Invalid credentials"}), 401


# 2. JSON logout — called by React admin dashboard
@app.route("/api/admin/logout", methods=["POST"])
def api_admin_logout():
    session.clear()
    return jsonify({"message": "Logged out"})


# 3. Auth check — called by AdminDashboard on mount to guard the route
@app.route("/api/admin/me")
def api_admin_me():
    if session.get("admin_logged_in"):
        return jsonify({"admin": True})
    return jsonify({"error": "Unauthorized"}), 401


# 4. JSON professor upload — called by React upload card
@app.route("/api/admin/upload/professors", methods=["POST"])
def api_admin_upload_professors():
    if not session.get("admin_logged_in"):
        return jsonify({"error": "Unauthorized"}), 401

    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file provided"}), 400

    content = file.stream.read().decode("utf-8-sig").splitlines()
    reader = csv.DictReader(content)
    rows = list(reader)

    required_fields = {"name", "department", "email", "phone", "block", "cabin"}
    errors = []

    if not rows:
        return jsonify({"error": "CSV is empty"}), 400

    if not required_fields.issubset(set(reader.fieldnames or [])):
        missing = required_fields - set(reader.fieldnames or [])
        return jsonify({"error": f"Missing columns: {missing}"}), 400

    seen_emails = set()
    for idx, row in enumerate(rows, start=2):
        email = row["email"].strip().lower()
        if not EMAIL_REGEX.match(email):
            errors.append(f"Row {idx}: Invalid email format")
        if email in seen_emails:
            errors.append(f"Row {idx}: Duplicate email in CSV")
        seen_emails.add(email)
        for field in required_fields:
            if not row[field].strip():
                errors.append(f"Row {idx}: '{field}' cannot be empty")

    if errors:
        return jsonify({"message": "Validation failed", "errors": errors}), 422

    Professor.query.delete()
    db.session.commit()
    for row in rows:
        db.session.add(Professor(
            name=row["name"].strip(),
            department=row["department"].strip(),
            email=row["email"].strip().lower(),
            phone=row["phone"].strip(),
            block=row["block"].strip(),
            cabin=row["cabin"].strip(),
            notes=None
        ))
    db.session.commit()
    return jsonify({"message": f"✅ {len(rows)} professors uploaded successfully!"})


# 5. JSON timetable upload — called by React upload card
@app.route("/api/admin/upload/timetable", methods=["POST"])
def api_admin_upload_timetable():
    if not session.get("admin_logged_in"):
        return jsonify({"error": "Unauthorized"}), 401

    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file provided"}), 400

    content = file.stream.read().decode("utf-8-sig").splitlines()
    reader = csv.DictReader(content)
    rows = list(reader)

    required_fields = {"prof_email", "day", "course", "start_time", "end_time", "location"}
    errors = []

    DAY_MAP = {"Monday": 0, "Tuesday": 1, "Wednesday": 2,
               "Thursday": 3, "Friday": 4, "Saturday": 5, "Sunday": 6}

    if not rows:
        return jsonify({"error": "CSV is empty"}), 400

    if not required_fields.issubset(set(reader.fieldnames or [])):
        missing = required_fields - set(reader.fieldnames or [])
        return jsonify({"error": f"Missing columns: {missing}"}), 400

    for idx, row in enumerate(rows, start=2):
        email = row["prof_email"].strip().lower()
        if not EMAIL_REGEX.match(email):
            errors.append(f"Row {idx}: Invalid professor email")
        if row["day"] not in VALID_DAYS:
            errors.append(f"Row {idx}: Invalid day '{row['day']}'")
        if not validate_time(row["start_time"]) or not validate_time(row["end_time"]):
            errors.append(f"Row {idx}: Invalid time format (HH:MM required)")
        if row["start_time"] >= row["end_time"]:
            errors.append(f"Row {idx}: Start time must be before end time")
        if not Professor.query.filter_by(email=email).first():
            errors.append(f"Row {idx}: Professor email not found in database")

    if errors:
        return jsonify({"message": "Validation failed", "errors": errors}), 422

    Timetable.query.delete()
    db.session.commit()
    for row in rows:
        prof = Professor.query.filter_by(email=row["prof_email"].strip().lower()).first()
        db.session.add(Timetable(
            prof_id=prof.id,
            day_of_week=DAY_MAP[row["day"]],
            course_name=row["course"].strip(),
            start_time=row["start_time"].strip(),
            end_time=row["end_time"].strip(),
            location=row["location"].strip()
        ))
    db.session.commit()
    return jsonify({"message": f"✅ {len(rows)} timetable entries uploaded successfully!"})

# ─────────────────────────────────────────────────────────────────
# ADD THIS TO YOUR backend/app.py
#
# 1. Add these imports at the top of app.py:
#
#    from dotenv import load_dotenv
#    import google.generativeai as genai
#
# 2. After your existing imports, add:
#
#    load_dotenv()
#    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
#
# 3. Paste the route below before `if __name__ == "__main__":`
# ─────────────────────────────────────────────────────────────────

# The DB schema we give Gemini as context
DB_SCHEMA = """
You are a helpful assistant for MUJ Buddy, a university professor finder app.
You have access to a SQLite database with two tables:

TABLE: professors
  id          INTEGER  PRIMARY KEY
  name        TEXT     (e.g. "Dr. Deepak Panwar")
  department  TEXT     (e.g. "CSE", "ECE", "MBA")
  email       TEXT
  phone       TEXT
  block       TEXT     (e.g. "LHC", "A Block")
  cabin       TEXT     (e.g. "Cabin No-313")

TABLE: timetable
  id          INTEGER  PRIMARY KEY
  prof_id     INTEGER  FOREIGN KEY → professors.id
  day_of_week INTEGER  (0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday)
  start_time  TEXT     (format: "HH:MM", e.g. "09:00")
  end_time    TEXT     (format: "HH:MM", e.g. "10:00")
  course_name TEXT     (e.g. "Artificial Intelligence")
  location    TEXT     (e.g. "LHC Room 204")

RULES you must follow:
1. Always output a valid SQLite SELECT query — nothing else, no explanation, no markdown, no backticks.
2. Never use DROP, DELETE, INSERT, UPDATE, or any mutating statement.
3. For questions about "today", use day_of_week = {today_index}.
4. For questions about "now" or "currently free", use day_of_week = {today_index} and compare start_time / end_time against "{current_time}".
5. A professor is FREE at a given time if they have NO timetable entry that overlaps that time on that day.
6. To find free professors: SELECT professors not in (SELECT prof_id FROM timetable WHERE day_of_week=X AND start_time <= 'HH:MM' AND end_time > 'HH:MM').
7. Always JOIN professors and timetable when both tables are needed.
8. If the question cannot be answered from this schema, output exactly: CANNOT_ANSWER
"""

ANSWER_PROMPT = """
You are MUJ Buddy, a helpful assistant for students at Manipal University Jaipur.
Given a student's question and the raw database results, write a short, friendly, 
natural language answer. Be concise — 1 to 3 sentences max.
If results are empty, say the professor has no classes / is free all day as appropriate.
Do not mention SQL or databases.
"""

@app.route("/api/ask", methods=["POST"])
def api_ask():
    data = request.get_json()
    if not data or not data.get("question", "").strip():
        return jsonify({"error": "No question provided"}), 400

    question = data["question"].strip()

    # Current time context
    now = datetime.now()
    today_index = now.weekday()          # 0=Monday … 6=Sunday
    if today_index > 5:
        today_index = 0                  # treat Sunday as Monday for UI
    current_time = now.strftime("%H:%M")

    # ── Step 1: Ask Gemini to convert question → SQL ──
    try:

        schema_with_context = DB_SCHEMA.format(
            today_index=today_index,
            current_time=current_time
        )

        sql_prompt = f"{schema_with_context}\n\nStudent question: {question}\n\nSQL query:"
        sql_response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": sql_prompt}],
            temperature=0
        )
        sql_query = sql_response.choices[0].message.content.strip().strip("`").strip()

        # Strip any accidental markdown fences
        if sql_query.startswith("sql"):
            sql_query = sql_query[3:].strip()

    except Exception as e:
        return jsonify({"error": f"Failed to generate SQL: {str(e)}"}), 500

    # ── Handle unanswerable questions ──
    if sql_query == "CANNOT_ANSWER" or not sql_query.upper().startswith("SELECT"):
        return jsonify({
            "answer": "Sorry, I can only answer questions about professors, their schedules, and availability at MUJ.",
            "sql": None
        })

    # ── Step 2: Run the SQL safely on SQLite ──
    try:
        with db.engine.connect() as conn:
            result = conn.execute(db.text(sql_query))
            rows = [dict(row._mapping) for row in result]
    except Exception as e:
        return jsonify({
            "answer": "I understood your question but had trouble fetching the data. Try rephrasing it.",
            "sql": sql_query,
            "db_error": str(e)
        }), 200

    # ── Step 3: Ask Gemini to format the results into a natural answer ──
    try:
        format_prompt = (
            f"{ANSWER_PROMPT}\n\n"
            f"Student question: {question}\n\n"
            f"Database results: {rows}\n\n"
            f"Current time: {current_time}, Today: {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][today_index]}\n\n"
            f"Answer:"
        )
        answer_response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": format_prompt}]
        )
        answer = answer_response.choices[0].message.content.strip()

    except Exception as e:
        # Fallback: just return raw rows if formatting fails
        answer = f"Found {len(rows)} result(s): {rows}"

    return jsonify({
        "answer": answer,
        "results": rows,
        "sql": sql_query          # useful for debugging, remove in production
    })


if __name__ == "__main__":
    with app.app_context():
        from models import Timetable
        data = Timetable.query.all()
        print(f"Timetable entries found: {len(data)}")

    app.run(debug=True)
