# MUJ Buddy

## 📌 Overview
MUJ Buddy is a full-stack web application designed to help students at Manipal University Jaipur easily access professor information, including cabin location, contact details, and availability. The platform centralizes academic data and provides a user-friendly interface for quick navigation and decision-making.

---

## 🚀 Features
- 🔍 Search and view professor details
- 📅 Day-wise timetable visualization
- ⏱️ Free slot identification
- 🧑‍💼 Admin panel for CSV data upload
- ✅ CSV validation to ensure data integrity
- 🔐 Admin authentication (session-based)
- ⚛️ React-based dynamic UI
- 🔗 REST API integration between frontend and backend

---

## 🛠️ Tech Stack

### Frontend
- React (Vite)
- Axios
- React Router

### Backend
- Python
- Flask
- SQLAlchemy (ORM)

### Database
- SQLite

### Other Tools
- Flask-CORS
- CSV (for bulk data upload)

---

## 🏗️ Architecture
The application follows a **client-server architecture**:
React Frontend
│
▼
Axios (API Requests)
│
▼
Flask Backend (REST APIs)
│
▼
SQLite Database

---

## 📂 Project Structure
MUJ_B/
├── backend/ # Flask backend
├── frontend/ # React frontend
├── data/ # CSV files
├── muj_buddy.db # Database
└── .venv/ # Virtual environment

---

## ⚙️ Setup Instructions

### 1. Backend Setup
```bash
cd MUJ_B
.\.venv\Scripts\Activate.ps1
py backend/app.py
```
Backend runs on:
http://127.0.0.1:5000/

### 1. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on:
http://localhost:5173

🔑 Admin Access

Admin panel:
http://127.0.0.1:5000/admin/login

Credentials:
Username: admin
Password: admin123

📌 Future Enhancements
🤖 RAG-based AI assistant for natural language queries
🔐 JWT-based authentication for APIs
📊 Advanced search and filtering
☁️ Cloud deployment

📖 Learning Outcomes
Full-stack development using React and Flask
REST API design and integration
Database modeling using ORM
Debugging real-world issues (e.g., CORS)
Building scalable and modular systems






