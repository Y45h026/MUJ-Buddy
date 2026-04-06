import csv
from app import app
from models import db, Professor

CSV_PATH = "data/professors_real.csv"

def import_professors():
    with app.app_context():
        print("Clearing existing professor data...")
        Professor.query.delete()
        db.session.commit()

        print("Importing professors from CSV...")

        with open(CSV_PATH, newline="", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)

            for row in reader:
                prof = Professor(
                    name=row["name"].strip(),
                    department=row["department"].strip(),
                    email=row["email"].strip(),
                    phone=row["phone"].strip(),
                    block=row["block"].strip(),
                    cabin=row["cabin"].strip(),
                    notes=None  # handled safely
                )
                db.session.add(prof)

        db.session.commit()
        print("✅ Professors imported successfully!")

if __name__ == "__main__":
    import_professors()
