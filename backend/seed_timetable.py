import csv
import os
from app import app
from models import db, Professor, Timetable

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CSV_PATH = os.path.join(BASE_DIR, "data", "timetable_real.csv")

DAY_MAP = {
    "Monday": 0,
    "Tuesday": 1,
    "Wednesday": 2,
    "Thursday": 3,
    "Friday": 4,
    "Saturday": 5,
    "Sunday": 6,
}

def seed_timetable():
    with app.app_context():
        print("Clearing existing timetable data...")
        Timetable.query.delete()
        db.session.commit()

        print("Reading timetable CSV from:", CSV_PATH)

        with open(CSV_PATH, newline="", encoding="utf-8-sig") as csvfile:
            reader = csv.DictReader(csvfile)
            rows = list(reader)

            print(f"Rows found in CSV: {len(rows)}")

            for row in rows:
                email = row["prof_email"].strip().lower()
                professor = Professor.query.filter_by(email=email).first()

                if not professor:
                    print(f"❌ Professor not found for email: {email}")
                    continue

                entry = Timetable(
                    prof_id=professor.id,
                    day_of_week=DAY_MAP[row["day"]],
                    course_name=row["course"].strip(),
                    start_time=row["start_time"].strip(),
                    end_time=row["end_time"].strip(),
                    location=row["location"].strip()
                )

                db.session.add(entry)
                print(f"Added timetable for {professor.name} on {row['day']}")

        db.session.commit()
        print("✅ Timetable data seeded successfully!")

if __name__ == "__main__":
    seed_timetable()
