from flask import Flask, render_template, request, jsonify
from models import db, Professor, Timetable
from datetime import datetime
import os
import csv
from werkzeug.utils import secure_filename
from functools import wraps
from flask import session, redirect, url_for
import re
from flask import abort
from flask_cors import CORS

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

app = Flask(__name__, template_folder="../templates", static_folder="../static")
CORS(app)
app.secret_key = "muj-buddy-secret-key"  # change in production

# Absolute DB path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
db_path = os.path.join(BASE_DIR, 'muj_buddy.db')

app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

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

if __name__ == "__main__":
    with app.app_context():
        from models import Timetable
        data = Timetable.query.all()
        print(f"Timetable entries found: {len(data)}")

    app.run(debug=True)
