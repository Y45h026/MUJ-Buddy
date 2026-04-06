import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import api from "./api";
import ProfessorDetail from "./ProfessorDetail";
import AdminDashboard from "./AdminDashboard";
import AskBar from "./AskBar";

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0d0d0f; color: #e8e4dc; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
`;

const modalStyles = `
  .modal-backdrop {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000;
    animation: backdropIn 0.2s ease;
  }
  @keyframes backdropIn { from { opacity: 0; } to { opacity: 1; } }
  .modal-box {
    background: #111114;
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 16px;
    padding: 2.25rem;
    width: 100%; max-width: 380px;
    animation: modalIn 0.22s ease;
  }
  @keyframes modalIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  .modal-title { font-family: 'Syne', sans-serif; font-size: 1.25rem; font-weight: 700; color: #f0ebe0; margin-bottom: 0.3rem; }
  .modal-sub { font-size: 0.82rem; color: rgba(232,228,220,0.35); margin-bottom: 1.75rem; }
  .modal-label { font-size: 0.72rem; font-weight: 600; letter-spacing: 0.13em; text-transform: uppercase; color: rgba(232,228,220,0.35); margin-bottom: 0.4rem; display: block; }
  .modal-input {
    width: 100%; background: #1a1a20; border: 1px solid rgba(255,255,255,0.09);
    border-radius: 8px; padding: 0.65rem 0.9rem; font-size: 0.92rem; color: #e8e4dc;
    font-family: 'DM Sans', sans-serif; margin-bottom: 1rem; outline: none; transition: border-color 0.15s;
  }
  .modal-input:focus { border-color: rgba(78,203,160,0.4); }
  .modal-input::placeholder { color: rgba(232,228,220,0.2); }
  .modal-btn {
    width: 100%; padding: 0.7rem; background: #4ecba0; border: none; border-radius: 8px;
    font-family: 'Syne', sans-serif; font-size: 0.88rem; font-weight: 700; color: #0d0d0f;
    cursor: pointer; letter-spacing: 0.06em; transition: opacity 0.15s, transform 0.1s; margin-top: 0.25rem;
  }
  .modal-btn:hover { opacity: 0.88; }
  .modal-btn:active { transform: scale(0.98); }
  .modal-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .modal-error {
    background: rgba(226,75,74,0.1); border: 1px solid rgba(226,75,74,0.2);
    border-radius: 8px; padding: 0.6rem 0.9rem; font-size: 0.82rem; color: #e24b4a; margin-bottom: 1rem;
  }
  .modal-close { position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: rgba(232,228,220,0.3); font-size: 1.2rem; cursor: pointer; transition: color 0.15s; }
  .modal-close:hover { color: rgba(232,228,220,0.7); }
`;

const homeStyles = `
  .home-root { min-height: 100vh; background: #0d0d0f; padding: 0 0 5rem; }
  .home-header {
    padding: 3rem 2.5rem 2rem;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    display: flex; align-items: flex-end; justify-content: space-between;
    flex-wrap: wrap; gap: 1rem; max-width: 1300px; margin: 0 auto;
  }
  .home-logo { font-family: 'Syne', sans-serif; font-size: 0.78rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #4ecba0; margin-bottom: 0.5rem; }
  .home-title { font-family: 'Syne', sans-serif; font-size: clamp(2rem, 4vw, 3.2rem); font-weight: 700; color: #f0ebe0; line-height: 1.1; }
  .home-subtitle { font-size: 0.95rem; color: rgba(232,228,220,0.45); margin-top: 0.5rem; font-weight: 300; }
  .home-count { font-family: 'Syne', sans-serif; font-size: 0.8rem; color: rgba(232,228,220,0.35); letter-spacing: 0.1em; text-transform: uppercase; }
  .grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: 1.25rem; padding: 2.5rem 2.5rem 0; max-width: 1300px; margin: 0 auto;
  }
  .prof-card {
    background: #16161a; border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px; padding: 1.5rem;
    text-decoration: none; color: inherit; display: block;
    transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
    position: relative; overflow: hidden;
    animation: fadeInUp 0.35s ease both;
  }
  .prof-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, #4ecba0, transparent);
    opacity: 0; transition: opacity 0.25s ease;
  }
  .prof-card:hover { transform: translateY(-4px); border-color: rgba(78,203,160,0.25); background: #1a1a20; }
  .prof-card:hover::before { opacity: 1; }
  .prof-avatar { width: 44px; height: 44px; border-radius: 50%; background: rgba(78,203,160,0.12); border: 1px solid rgba(78,203,160,0.2); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 0.85rem; font-weight: 700; color: #4ecba0; margin-bottom: 1rem; letter-spacing: 0.05em; }
  .prof-name { font-family: 'Syne', sans-serif; font-size: 1.05rem; font-weight: 600; color: #f0ebe0; margin-bottom: 0.3rem; }
  .prof-dept { font-size: 0.85rem; color: rgba(232,228,220,0.55); margin-bottom: 0.75rem; }
  .prof-meta { display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; color: rgba(232,228,220,0.35); }
  .prof-meta-dot { width: 3px; height: 3px; background: rgba(232,228,220,0.2); border-radius: 50%; }
  .home-footer { max-width: 1300px; margin: 4rem auto 0; padding: 0 2.5rem; display: flex; justify-content: flex-end; }
  .admin-trigger { font-size: 0.72rem; color: rgba(232,228,220,0.15); background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; letter-spacing: 0.08em; transition: color 0.2s; padding: 0.5rem 0; }
  .admin-trigger:hover { color: rgba(232,228,220,0.45); }
  .loading-state { display: flex; align-items: center; justify-content: center; height: 50vh; font-family: 'Syne', sans-serif; font-size: 0.85rem; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(232,228,220,0.25); }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
`;

function getInitials(name) {
  if (!name) return "??";
  return name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join("");
}

function AdminLoginModal({ onClose, onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await api.post("/admin/login", { username, password });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">Admin Access</div>
        <div className="modal-sub">Restricted to authorized personnel</div>
        {error && <div className="modal-error">{error}</div>}
        <label className="modal-label">Username</label>
        <input className="modal-input" type="text" placeholder="admin" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} autoFocus />
        <label className="modal-label">Password</label>
        <input className="modal-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
        <button className="modal-btn" onClick={handleLogin} disabled={loading}>
          {loading ? "Verifying…" : "Login →"}
        </button>
      </div>
    </div>
  );
}

function Home() {
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/professors")
      .then(res => setProfessors(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleAdminSuccess = useCallback(() => {
    setShowModal(false);
    navigate("/admin");
  }, [navigate]);

  return (
    <>
      <style>{globalStyles + homeStyles + modalStyles}</style>

      {showModal && (
        <AdminLoginModal onClose={() => setShowModal(false)} onSuccess={handleAdminSuccess} />
      )}

      <div className="home-root">
        <header className="home-header">
          <div>
            <div className="home-logo">MUJ Buddy</div>
            <h1 className="home-title">Faculty Directory</h1>
            <p className="home-subtitle">Find professors, free slots & cabin locations</p>
          </div>
          {!loading && <div className="home-count">{professors.length} professors</div>}
        </header>

        {/* ── AI Ask Bar ── */}
        <AskBar />

        {loading ? (
          <div className="loading-state">Loading faculty…</div>
        ) : (
          <div className="grid">
            {professors.map((p, i) => (
              <Link
                key={p.id}
                to={`/professor/${p.id}`}
                className="prof-card"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="prof-avatar">{getInitials(p.name)}</div>
                <div className="prof-name">{p.name}</div>
                <div className="prof-dept">{p.department}</div>
                <div className="prof-meta">
                  <span>{p.block}</span>
                  <span className="prof-meta-dot" />
                  <span>Cabin {p.cabin}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="home-footer">
          <button className="admin-trigger" onClick={() => setShowModal(true)}>admin access</button>
        </div>
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"              element={<Home />} />
        <Route path="/professor/:id" element={<ProfessorDetail />} />
        <Route path="/admin"         element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
