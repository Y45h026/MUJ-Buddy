import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "./api";
import ProfessorDetail from "./ProfessorDetail";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #0d0d0f;
    color: #e8e4dc;
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
  }

  .home-root {
    min-height: 100vh;
    background: #0d0d0f;
    padding: 0 0 4rem;
  }

  .home-header {
    padding: 3rem 2.5rem 2rem;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
    max-width: 1300px;
    margin: 0 auto;
  }

  .home-header-left {}

  .home-logo {
    font-family: 'Syne', sans-serif;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #4ecba0;
    margin-bottom: 0.5rem;
  }

  .home-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(2rem, 4vw, 3.2rem);
    font-weight: 700;
    color: #f0ebe0;
    line-height: 1.1;
  }

  .home-subtitle {
    font-size: 0.95rem;
    color: rgba(232,228,220,0.45);
    margin-top: 0.5rem;
    font-weight: 300;
  }

  .home-count {
    font-family: 'Syne', sans-serif;
    font-size: 0.8rem;
    color: rgba(232,228,220,0.35);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: 1.25rem;
    padding: 2.5rem 2.5rem 0;
    max-width: 1300px;
    margin: 0 auto;
  }

  .prof-card {
    background: #16161a;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    padding: 1.5rem;
    text-decoration: none;
    color: inherit;
    display: block;
    transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
    position: relative;
    overflow: hidden;
  }

  .prof-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, #4ecba0, transparent);
    opacity: 0;
    transition: opacity 0.25s ease;
  }

  .prof-card:hover {
    transform: translateY(-4px);
    border-color: rgba(78,203,160,0.25);
    background: #1a1a20;
  }

  .prof-card:hover::before {
    opacity: 1;
  }

  .prof-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(78,203,160,0.12);
    border: 1px solid rgba(78,203,160,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Syne', sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    color: #4ecba0;
    margin-bottom: 1rem;
    letter-spacing: 0.05em;
  }

  .prof-name {
    font-family: 'Syne', sans-serif;
    font-size: 1.05rem;
    font-weight: 600;
    color: #f0ebe0;
    margin-bottom: 0.3rem;
  }

  .prof-dept {
    font-size: 0.85rem;
    color: rgba(232,228,220,0.55);
    margin-bottom: 0.75rem;
  }

  .prof-meta {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.78rem;
    color: rgba(232,228,220,0.35);
    letter-spacing: 0.04em;
  }

  .prof-meta-dot {
    width: 3px; height: 3px;
    background: rgba(232,228,220,0.2);
    border-radius: 50%;
  }

  .loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 50vh;
    font-family: 'Syne', sans-serif;
    font-size: 0.85rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(232,228,220,0.25);
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .prof-card {
    animation: fadeInUp 0.35s ease both;
  }
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

function Home() {
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/professors")
      .then(res => setProfessors(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <style>{styles}</style>
      <div className="home-root">
        <header className="home-header">
          <div className="home-header-left">
            <div className="home-logo">MUJ Buddy</div>
            <h1 className="home-title">Faculty Directory</h1>
            <p className="home-subtitle">Find professors, free slots & cabin locations</p>
          </div>
          {!loading && (
            <div className="home-count">{professors.length} professors</div>
          )}
        </header>

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
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/professor/:id" element={<ProfessorDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
