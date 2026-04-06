import csv
import os
from app import app
from models import db, Professor

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CSV_PATH = os.path.join(BASE_DIR, "data", "professors_real.csv")

def seed_professors():
    with app.app_context():
        print("Clearing existing professor data...")
        Professor.query.delete()
        db.session.commit()

        print("Reading CSV from:", CSV_PATH)

        with open(CSV_PATH, newline="", encoding="utf-8-sig") as csvfile:
            reader = csv.DictReader(csvfile)
            rows = list(reader)

            print(f"Rows found in CSV: {len(rows)}")

            if len(rows) == 0:
                print("❌ No data found in CSV.")
                return

            for row in rows:
                print("Inserting:", row["name"])

                prof = Professor(
                    name=row["name"].strip(),
                    department=row["department"].strip(),
                    email=row["email"].strip(),
                    phone=row["phone"].strip(),
                    block=row["block"].strip(),
                    cabin=row["cabin"].strip(),
                    notes=None
                )
                db.session.add(prof)

        db.session.commit()
        print("✅ Real professor data seeded successfully!")

if __name__ == "__main__":
    seed_professors()
