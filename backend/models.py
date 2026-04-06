from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Professor(db.Model):
    __tablename__ = 'professors'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    department = db.Column(db.String(100))
    email = db.Column(db.String(120))
    phone = db.Column(db.String(20))
    cabin = db.Column(db.String(50))
    block = db.Column(db.String(50))
    notes = db.Column(db.String(200))

class Timetable(db.Model):
    __tablename__ = 'timetable'
    id = db.Column(db.Integer, primary_key=True)
    prof_id = db.Column(db.Integer, db.ForeignKey('professors.id'))
    day_of_week = db.Column(db.String(20))
    start_time = db.Column(db.String(10))
    end_time = db.Column(db.String(10))
    course_name = db.Column(db.String(100))
    location = db.Column(db.String(100))
