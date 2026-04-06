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

  .back-arrow {
    font-size: 1rem;
    line-height: 1;
  }

  .detail-content {
    max-width: 1000px;
    margin: 0 auto;
    padding: 3rem 2.5rem 0;
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

  .prof-header-info {}

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

  .timetable-section {
    margin-bottom: 2.5rem;
  }

  .day-block {
    margin-bottom: 1rem;
  }

  .day-label {
    font-size: 0.78rem;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(232,228,220,0.35);
    margin-bottom: 0.5rem;
  }

  .slots-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .slot-chip {
    background: #1e1e24;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 6px;
    padding: 0.35rem 0.75rem;
    font-size: 0.82rem;
    color: rgba(232,228,220,0.7);
    font-family: 'DM Sans', monospace;
  }

  .slot-chip.free {
    background: rgba(78,203,160,0.08);
    border-color: rgba(78,203,160,0.2);
    color: #4ecba0;
  }

  .slot-chip.busy {
    background: rgba(216,90,48,0.06);
    border-color: rgba(216,90,48,0.15);
    color: rgba(232,180,160,0.7);
  }

  .empty-timetable {
    font-size: 0.85rem;
    color: rgba(232,228,220,0.2);
    padding: 1.5rem 0;
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

  .detail-content { animation: fadeIn 0.3s ease both; }
`;

function getInitials(name) {
  if (!name) return "??";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join("");
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ProfessorDetail() {
  const { id } = useParams();
  const [professor, setProfessor] = useState(null);
  const [timetable, setTimetable] = useState(null);

  useEffect(() => {
    api.get(`/professors/${id}`)
      .then(res => setProfessor(res.data))
      .catch(err => console.error(err));

    // Fetch timetable if your API supports it
    api.get(`/professors/${id}/timetable`)
      .then(res => setTimetable(res.data))
      .catch(() => setTimetable({})); // silently fail if endpoint not ready
  }, [id]);

  if (!professor) {
    return (
      <>
        <style>{styles}</style>
        <div className="loading-state">Loading…</div>
      </>
    );
  }

  const hasTimetable = timetable && Object.keys(timetable).length > 0;

  return (
    <>
      <style>{styles}</style>
      <div className="detail-root">
        <div className="detail-topbar">
          <Link to="/" className="back-link">
            <span className="back-arrow">←</span>
            Back to Faculty
          </Link>
        </div>

        <div className="detail-content">
          {/* Professor Header */}
          <div className="prof-header">
            <div className="prof-avatar-lg">{getInitials(professor.name)}</div>
            <div className="prof-header-info">
              <div className="prof-header-tag">Faculty</div>
              <div className="prof-header-name">{professor.name}</div>
              <div className="prof-header-dept">{professor.department}</div>
            </div>
          </div>

          {/* Info Cards */}
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

          {/* Timetable Section */}
          <div className="timetable-section">
            <div className="section-heading">Weekly Timetable</div>
            {!timetable ? (
              <div className="empty-timetable">Loading timetable…</div>
            ) : !hasTimetable ? (
              <div className="empty-timetable">No timetable data available.</div>
            ) : (
              DAYS.map(day => {
                const slots = timetable[day];
                if (!slots || slots.length === 0) return null;
                return (
                  <div className="day-block" key={day}>
                    <div className="day-label">{day}</div>
                    <div className="slots-row">
                      {slots.map((slot, i) => (
                        <div
                          key={i}
                          className={`slot-chip ${slot.free ? "free" : "busy"}`}
                        >
                          {slot.time || slot.label || slot}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
