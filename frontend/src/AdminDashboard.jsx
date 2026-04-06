import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0d0d0f; color: #e8e4dc; font-family: 'DM Sans', sans-serif; min-height: 100vh; }

  .admin-root { min-height: 100vh; background: #0d0d0f; padding-bottom: 5rem; }

  .admin-topbar {
    padding: 1.5rem 2.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    display: flex; align-items: center; justify-content: space-between;
    max-width: 1100px; margin: 0 auto;
  }

  .admin-logo {
    font-family: 'Syne', sans-serif; font-size: 0.78rem; font-weight: 600;
    letter-spacing: 0.18em; text-transform: uppercase; color: #4ecba0;
  }

  .logout-btn {
    background: none;
    border: 1px solid rgba(226,75,74,0.25);
    border-radius: 8px;
    padding: 0.4rem 0.9rem;
    font-size: 0.78rem;
    font-family: 'DM Sans', sans-serif;
    color: rgba(226,75,74,0.6);
    cursor: pointer;
    letter-spacing: 0.05em;
    transition: all 0.15s;
  }
  .logout-btn:hover { border-color: rgba(226,75,74,0.5); color: #e24b4a; }

  .admin-content {
    max-width: 1100px; margin: 0 auto;
    padding: 3rem 2.5rem 0;
    animation: fadeIn 0.3s ease both;
  }

  .admin-header-tag {
    font-size: 0.72rem; font-weight: 600; letter-spacing: 0.16em;
    text-transform: uppercase; color: #4ecba0; margin-bottom: 0.4rem;
  }
  .admin-title {
    font-family: 'Syne', sans-serif; font-size: clamp(1.6rem, 3vw, 2.4rem);
    font-weight: 700; color: #f0ebe0; line-height: 1.15; margin-bottom: 0.35rem;
  }
  .admin-subtitle { font-size: 0.9rem; color: rgba(232,228,220,0.4); font-weight: 300; margin-bottom: 3rem; }

  .upload-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2.5rem;
  }

  .upload-card {
    background: #16161a;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    padding: 1.75rem;
    transition: border-color 0.2s;
  }
  .upload-card:hover { border-color: rgba(255,255,255,0.12); }

  .upload-card-icon {
    width: 40px; height: 40px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem; margin-bottom: 1.1rem;
  }
  .icon-prof { background: rgba(78,203,160,0.1); }
  .icon-tt   { background: rgba(55,138,221,0.1); }

  .upload-card-title {
    font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 600;
    color: #f0ebe0; margin-bottom: 0.3rem;
  }
  .upload-card-desc {
    font-size: 0.82rem; color: rgba(232,228,220,0.38); margin-bottom: 1.25rem; line-height: 1.5;
  }

  .file-drop {
    border: 1.5px dashed rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 1.25rem;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    margin-bottom: 1rem;
    position: relative;
  }
  .file-drop:hover, .file-drop.dragover {
    border-color: rgba(78,203,160,0.35);
    background: rgba(78,203,160,0.04);
  }
  .file-drop input[type="file"] {
    position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%;
  }
  .file-drop-label {
    font-size: 0.82rem; color: rgba(232,228,220,0.35); pointer-events: none;
  }
  .file-drop-name {
    font-size: 0.85rem; color: #4ecba0; margin-top: 0.3rem; font-weight: 500;
  }

  .upload-btn {
    width: 100%; padding: 0.65rem;
    border: none; border-radius: 8px;
    font-family: 'Syne', sans-serif; font-size: 0.82rem; font-weight: 700;
    cursor: pointer; letter-spacing: 0.06em;
    transition: opacity 0.15s, transform 0.1s;
  }
  .upload-btn:active { transform: scale(0.98); }
  .upload-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-teal  { background: #4ecba0; color: #0d0d0f; }
  .btn-blue  { background: #378add; color: #fff; }
  .btn-teal:hover:not(:disabled) { opacity: 0.85; }
  .btn-blue:hover:not(:disabled) { opacity: 0.85; }

  /* Feedback messages */
  .feedback {
    border-radius: 10px; padding: 0.85rem 1rem;
    font-size: 0.83rem; line-height: 1.5; margin-top: 1rem;
  }
  .feedback.success {
    background: rgba(78,203,160,0.08);
    border: 1px solid rgba(78,203,160,0.2);
    color: #4ecba0;
  }
  .feedback.error {
    background: rgba(226,75,74,0.08);
    border: 1px solid rgba(226,75,74,0.2);
    color: #e24b4a;
  }
  .feedback ul { margin: 0.4rem 0 0 1rem; }
  .feedback li { margin-bottom: 0.2rem; }

  /* CSV format hints */
  .hint-section { margin-top: 3rem; }
  .section-heading {
    font-family: 'Syne', sans-serif; font-size: 0.72rem; font-weight: 600;
    letter-spacing: 0.18em; text-transform: uppercase; color: rgba(232,228,220,0.3);
    margin-bottom: 1rem; padding-bottom: 0.6rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .hint-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
  .hint-card {
    background: #16161a; border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px; padding: 1.1rem 1.25rem;
  }
  .hint-title { font-size: 0.78rem; font-weight: 600; color: rgba(232,228,220,0.5); margin-bottom: 0.6rem; }
  .hint-cols { display: flex; flex-wrap: wrap; gap: 0.35rem; }
  .hint-col {
    background: rgba(255,255,255,0.05); border-radius: 5px;
    padding: 0.2rem 0.5rem; font-size: 0.75rem;
    color: rgba(232,228,220,0.55); font-family: monospace;
  }

  .loading-state {
    display: flex; align-items: center; justify-content: center; height: 60vh;
    font-family: 'Syne', sans-serif; font-size: 0.85rem; letter-spacing: 0.15em;
    text-transform: uppercase; color: rgba(232,228,220,0.2);
  }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
`;

function UploadCard({ title, desc, iconBg, iconChar, btnClass, btnLabel, endpoint, onResult }) {
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [drag, setDrag]       = useState(false);
  const inputRef              = useRef();

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await api.post(endpoint, form, { headers: { "Content-Type": "multipart/form-data" } });
      onResult({ type: "success", message: res.data.message, errors: null });
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      const data = err.response?.data;
      onResult({ type: "error", message: data?.message || "Upload failed", errors: data?.errors || null });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-card">
      <div className={`upload-card-icon ${iconBg}`}>{iconChar}</div>
      <div className="upload-card-title">{title}</div>
      <div className="upload-card-desc">{desc}</div>

      <div
        className={`file-drop ${drag ? "dragover" : ""}`}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); setFile(e.dataTransfer.files[0]); }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={e => setFile(e.target.files[0])}
        />
        <div className="file-drop-label">
          {file ? "" : "Click or drag a CSV file here"}
        </div>
        {file && <div className="file-drop-name">📄 {file.name}</div>}
      </div>

      <button
        className={`upload-btn ${btnClass}`}
        onClick={handleUpload}
        disabled={!file || loading}
      >
        {loading ? "Uploading…" : btnLabel}
      </button>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [feedback, setFeedback]       = useState(null); // { type, message, errors }

  // Guard: redirect to home if not logged in
  useEffect(() => {
    api.get("/admin/me")
      .then(() => setAuthChecked(true))
      .catch(() => navigate("/", { replace: true }));
  }, [navigate]);

  const handleLogout = async () => {
    await api.post("/admin/logout").catch(() => {});
    navigate("/", { replace: true });
  };

  if (!authChecked) {
    return (
      <>
        <style>{styles}</style>
        <div className="loading-state">Verifying access…</div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="admin-root">

        <div className="admin-topbar">
          <div className="admin-logo">MUJ Buddy — Admin</div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>

        <div className="admin-content">
          <div className="admin-header-tag">Admin Panel</div>
          <div className="admin-title">Upload Panel</div>
          <div className="admin-subtitle">Upload CSV files to update the professor database and timetable</div>

          {feedback && (
            <div className={`feedback ${feedback.type}`}>
              {feedback.message}
              {feedback.errors && feedback.errors.length > 0 && (
                <ul>
                  {feedback.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          )}

          <div className="upload-grid" style={{ marginTop: feedback ? "1.5rem" : "0" }}>
            <UploadCard
              title="Professors CSV"
              desc="Upload a CSV with professor details. This will replace all existing professor records."
              iconBg="icon-prof"
              iconChar="👤"
              btnClass="btn-teal"
              btnLabel="Upload Professors →"
              endpoint="/admin/upload/professors"
              onResult={setFeedback}
            />
            <UploadCard
              title="Timetable CSV"
              desc="Upload a CSV with class schedules. This will replace all existing timetable records."
              iconBg="icon-tt"
              iconChar="📅"
              btnClass="btn-blue"
              btnLabel="Upload Timetable →"
              endpoint="/admin/upload/timetable"
              onResult={setFeedback}
            />
          </div>

          {/* CSV format hints */}
          <div className="hint-section">
            <div className="section-heading">Required CSV Columns</div>
            <div className="hint-grid">
              <div className="hint-card">
                <div className="hint-title">professors.csv</div>
                <div className="hint-cols">
                  {["name","department","email","phone","block","cabin"].map(c => (
                    <span key={c} className="hint-col">{c}</span>
                  ))}
                </div>
              </div>
              <div className="hint-card">
                <div className="hint-title">timetable.csv</div>
                <div className="hint-cols">
                  {["prof_email","day","course","start_time","end_time","location"].map(c => (
                    <span key={c} className="hint-col">{c}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
