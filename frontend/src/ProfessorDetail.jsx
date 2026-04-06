import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "./api";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #0d0d0f;
    color: #e8e4dc;
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
  }

  .detail-root {
    min-height: 100vh;
    background: #0d0d0f;
    padding-bottom: 5rem;
  }

  .detail-topbar {
    padding: 1.5rem 2.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    max-width: 1000px;
    margin: 0 auto;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.82rem;
    color: rgba(232,228,220,0.4);
    text-decoration: none;
    font-family: 'DM Sans', sans-serif;
    letter-spacing: 0.04em;
    transition: color 0.18s;
  }

  .back-link:hover { color: #4ecba0; }

  .detail-content {
    max-width: 1000px;
    margin: 0 auto;
    padding: 3rem 2.5rem 0;
    animation: fadeIn 0.3s ease both;
  }

  .prof-header {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 3rem;
    flex-wrap: wrap;
  }

  .prof-avatar-lg {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: rgba(78,203,160,0.1);
    border: 1.5px solid rgba(78,203,160,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Syne', sans-serif;
    font-size: 1.4rem;
    font-weight: 700;
    color: #4ecba0;
    flex-shrink: 0;
    letter-spacing: 0.03em;
  }

  .prof-header-tag {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #4ecba0;
    margin-bottom: 0.35rem;
  }

  .prof-header-name {
    font-family: 'Syne', sans-serif;
    font-size: clamp(1.6rem, 3vw, 2.4rem);
    font-weight: 700;
    color: #f0ebe0;
    line-height: 1.15;
  }

  .prof-header-dept {
    font-size: 0.9rem;
    color: rgba(232,228,220,0.45);
    margin-top: 0.25rem;
    font-weight: 300;
  }

  .section-heading {
    font-family: 'Syne', sans-serif;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(232,228,220,0.3);
    margin-bottom: 1rem;
    padding-bottom: 0.6rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 3rem;
  }

  .info-card {
    background: #16161a;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    padding: 1.1rem 1.25rem;
    min-width: 0;
  }

  .info-label {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(232,228,220,0.28);
    margin-bottom: 0.4rem;
  }

  .info-value {
    font-size: 0.95rem;
    color: #e8e4dc;
    font-weight: 400;
    word-break: break-all;
    overflow-wrap: break-word;
    overflow: hidden;
  }

  .info-value a {
    color: #4ecba0;
    text-decoration: none;
    word-break: break-all;
  }

  .info-value a:hover { text-decoration: underline; }

  .day-tabs {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
  }

  .day-tab {
    padding: 0.4rem 0.9rem;
    border-radius: 8px;
    font-size: 0.8rem;
    font-family: 'DM Sans', sans-serif;
    font-weight: 500;
    border: 1px solid rgba(255,255,255,0.08);
    background: #16161a;
    color: rgba(232,228,220,0.45);
    cursor: pointer;
    transition: all 0.15s ease;
    letter-spacing: 0.02em;
  }

  .day-tab:hover {
    border-color: rgba(78,203,160,0.2);
    color: rgba(232,228,220,0.75);
  }

  .day-tab.active {
    background: rgba(78,203,160,0.1);
    border-color: rgba(78,203,160,0.35);
    color: #4ecba0;
  }

  .timetable-section { margin-bottom: 2.5rem; }

  .tt-empty {
    font-size: 0.85rem;
    color: rgba(232,228,220,0.2);
    padding: 1.5rem 0;
  }

  .tt-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .tt-entry {
    background: #16161a;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    padding: 1rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 1.25rem;
    flex-wrap: wrap;
  }

  .tt-time {
    font-family: 'Syne', sans-serif;
    font-size: 0.82rem;
    font-weight: 600;
    color: #4ecba0;
    white-space: nowrap;
    min-width: 110px;
    letter-spacing: 0.04em;
  }

  .tt-course {
    font-size: 0.95rem;
    color: #e8e4dc;
    font-weight: 500;
    flex: 1;
  }

  .tt-location {
    font-size: 0.78rem;
    color: rgba(232,228,220,0.35);
    white-space: nowrap;
  }

  .free-section-label {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(78,203,160,0.5);
    margin-top: 1.25rem;
    margin-bottom: 0.5rem;
  }

  .free-slots-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .free-chip {
    background: rgba(78,203,160,0.08);
    border: 1px solid rgba(78,203,160,0.2);
    border-radius: 6px;
    padding: 0.3rem 0.75rem;
    font-size: 0.78rem;
    color: #4ecba0;
    letter-spacing: 0.03em;
  }

  .loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 60vh;
    font-family: 'Syne', sans-serif;
    font-size: 0.85rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(232,228,220,0.2);
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getInitials(name) {
  if (!name) return "??";
  return name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join("");
}

function computeFreeSlots(entries, start = "08:00", end = "18:00") {
  const free = [];
  let current = start;
  for (const e of entries) {
    if (e.start_time > current) free.push(`${current} – ${e.start_time}`);
    current = current > e.end_time ? current : e.end_time;
  }
  if (current < end) free.push(`${current} – ${end}`);
  return free;
}

export default function ProfessorDetail() {
  const { id } = useParams();
  const [professor, setProfessor] = useState(null);
  const [timetable, setTimetable] = useState({});   // { 0: [...], 1: [...], ... }
  const [ttLoading, setTtLoading] = useState(true);

  // Default selected day: today mapped to Mon–Sat (0–5), fallback to Monday
  const todayJs = new Date().getDay(); // 0=Sun,1=Mon,...,6=Sat
  const todayIndex = todayJs === 0 ? 0 : Math.min(todayJs - 1, 5);
  const [selectedDay, setSelectedDay] = useState(todayIndex);

  useEffect(() => {
    api.get(`/professors/${id}`)
      .then(res => setProfessor(res.data))
      .catch(err => console.error(err));
  }, [id]);

  // Fetch all 6 days in parallel using the correct ?day=N param
  useEffect(() => {
    setTtLoading(true);
    Promise.all(
      DAYS.map((_, dayIndex) =>
        api.get(`/professors/${id}/timetable?day=${dayIndex}`)
          .then(res => ({ dayIndex, entries: res.data }))
          .catch(() => ({ dayIndex, entries: [] }))
      )
    ).then(results => {
      const map = {};
      results.forEach(({ dayIndex, entries }) => { map[dayIndex] = entries; });
      setTimetable(map);
      setTtLoading(false);
    });
  }, [id]);

  if (!professor) {
    return (
      <>
        <style>{styles}</style>
        <div className="loading-state">Loading…</div>
      </>
    );
  }

  const dayEntries = timetable[selectedDay] || [];
  const freeSlots = computeFreeSlots(dayEntries);

  return (
    <>
      <style>{styles}</style>
      <div className="detail-root">

        <div className="detail-topbar">
          <Link to="/" className="back-link">
            ← Back to Faculty
          </Link>
        </div>

        <div className="detail-content">

          {/* Professor header */}
          <div className="prof-header">
            <div className="prof-avatar-lg">{getInitials(professor.name)}</div>
            <div>
              <div className="prof-header-tag">Faculty</div>
              <div className="prof-header-name">{professor.name}</div>
              <div className="prof-header-dept">{professor.department}</div>
            </div>
          </div>

          {/* Contact & Location */}
          <div className="section-heading">Contact & Location</div>
          <div className="info-grid">
            {professor.email && (
              <div className="info-card">
                <div className="info-label">Email</div>
                <div className="info-value">
                  <a href={`mailto:${professor.email}`}>{professor.email}</a>
                </div>
              </div>
            )}
            {professor.phone && (
              <div className="info-card">
                <div className="info-label">Phone</div>
                <div className="info-value">{professor.phone}</div>
              </div>
            )}
            {professor.block && (
              <div className="info-card">
                <div className="info-label">Block</div>
                <div className="info-value">{professor.block}</div>
              </div>
            )}
            {professor.cabin && (
              <div className="info-card">
                <div className="info-label">Cabin</div>
                <div className="info-value">{professor.cabin}</div>
              </div>
            )}
          </div>

          {/* Timetable */}
          <div className="timetable-section">
            <div className="section-heading">Weekly Timetable</div>

            <div className="day-tabs">
              {DAYS.map((day, i) => (
                <button
                  key={day}
                  className={`day-tab ${selectedDay === i ? "active" : ""}`}
                  onClick={() => setSelectedDay(i)}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>

            {ttLoading ? (
              <div className="tt-empty">Loading timetable…</div>
            ) : dayEntries.length === 0 ? (
              <div className="tt-empty">No classes scheduled on {DAYS[selectedDay]}.</div>
            ) : (
              <>
                <div className="tt-list">
                  {dayEntries.map((e, i) => (
                    <div className="tt-entry" key={i}>
                      <div className="tt-time">{e.start_time} – {e.end_time}</div>
                      <div className="tt-course">{e.course}</div>
                      <div className="tt-location">{e.location}</div>
                    </div>
                  ))}
                </div>

                {freeSlots.length > 0 && (
                  <>
                    <div className="free-section-label">Free slots</div>
                    <div className="free-slots-row">
                      {freeSlots.map((slot, i) => (
                        <div className="free-chip" key={i}>{slot}</div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
