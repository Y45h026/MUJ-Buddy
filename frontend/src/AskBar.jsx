import { useState, useRef, useEffect } from "react";
import api from "./api";

const styles = `
  .ask-section {
    max-width: 1300px;
    margin: 0 auto;
    padding: 2.5rem 2.5rem 0;
  }

  .ask-label {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #4ecba0;
    margin-bottom: 0.75rem;
  }

  .ask-bar {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .ask-input-wrap {
    flex: 1;
    position: relative;
  }

  .ask-input {
    width: 100%;
    background: #16161a;
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 12px;
    padding: 0.85rem 1.1rem;
    font-size: 0.95rem;
    color: #e8e4dc;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color 0.18s;
  }
  .ask-input:focus { border-color: rgba(78,203,160,0.4); }
  .ask-input::placeholder { color: rgba(232,228,220,0.22); }

  .ask-btn {
    padding: 0.85rem 1.5rem;
    background: #4ecba0;
    border: none;
    border-radius: 12px;
    font-family: 'Syne', sans-serif;
    font-size: 0.82rem;
    font-weight: 700;
    color: #0d0d0f;
    cursor: pointer;
    letter-spacing: 0.06em;
    white-space: nowrap;
    transition: opacity 0.15s, transform 0.1s;
    flex-shrink: 0;
  }
  .ask-btn:hover:not(:disabled) { opacity: 0.85; }
  .ask-btn:active { transform: scale(0.97); }
  .ask-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .ask-suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin-top: 0.75rem;
  }

  .ask-chip {
    background: #16161a;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 0.3rem 0.85rem;
    font-size: 0.76rem;
    color: rgba(232,228,220,0.4);
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: border-color 0.15s, color 0.15s;
    white-space: nowrap;
  }
  .ask-chip:hover {
    border-color: rgba(78,203,160,0.25);
    color: rgba(232,228,220,0.75);
  }

  .ask-answer-box {
    margin-top: 1.25rem;
    background: #16161a;
    border: 1px solid rgba(78,203,160,0.15);
    border-left: 3px solid #4ecba0;
    border-radius: 0 12px 12px 0;
    padding: 1.1rem 1.25rem;
    animation: fadeInUp 0.25s ease both;
  }

  .ask-answer-label {
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #4ecba0;
    margin-bottom: 0.5rem;
  }

  .ask-answer-text {
    font-size: 0.92rem;
    color: #e8e4dc;
    line-height: 1.65;
  }

  .ask-error {
    margin-top: 1rem;
    font-size: 0.82rem;
    color: rgba(226,75,74,0.7);
    padding: 0.75rem 1rem;
    background: rgba(226,75,74,0.06);
    border: 1px solid rgba(226,75,74,0.15);
    border-radius: 10px;
  }

  .ask-loading {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-top: 1.25rem;
    font-size: 0.82rem;
    color: rgba(232,228,220,0.35);
    font-family: 'DM Sans', sans-serif;
  }

  .ask-spinner {
    width: 14px; height: 14px;
    border: 1.5px solid rgba(78,203,160,0.2);
    border-top-color: #4ecba0;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

  .ask-divider {
    max-width: 1300px;
    margin: 2rem auto 0;
    padding: 0 2.5rem;
    border: none;
    border-top: 1px solid rgba(255,255,255,0.05);
  }
`;

const SUGGESTIONS = [
  "Who is free right now?",
  "When is Dr. Panwar free today?",
  "Which professors teach in LHC?",
  "Who teaches AI?",
  "Free CSE professors on Friday?",
];

export default function AskBar() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const inputRef = useRef();

  const ask = async (q) => {
    const query = (q || question).trim();
    if (!query) return;

    setLoading(true);
    setAnswer(null);
    setError(null);

    try {
      const res = await api.post("/ask", { question: query });
      setAnswer(res.data.answer);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") ask();
  };

  const handleChip = (s) => {
    setQuestion(s);
    ask(s);
    inputRef.current?.focus();
  };

  return (
    <>
      <style>{styles}</style>
      <div className="ask-section">
        <div className="ask-label">Ask anything</div>

        <div className="ask-bar">
          <div className="ask-input-wrap">
            <input
              ref={inputRef}
              className="ask-input"
              type="text"
              placeholder='e.g. "When is Mr. Harish Sharma free today?"'
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={handleKey}
            />
          </div>
          <button
            className="ask-btn"
            onClick={() => ask()}
            disabled={loading || !question.trim()}
          >
            Ask →
          </button>
        </div>

        <div className="ask-suggestions">
          {SUGGESTIONS.map(s => (
            <button key={s} className="ask-chip" onClick={() => handleChip(s)}>
              {s}
            </button>
          ))}
        </div>

        {loading && (
          <div className="ask-loading">
            <div className="ask-spinner" />
            Thinking…
          </div>
        )}

        {answer && !loading && (
          <div className="ask-answer-box">
            <div className="ask-answer-label">Answer</div>
            <div className="ask-answer-text">{answer}</div>
          </div>
        )}

        {error && !loading && (
          <div className="ask-error">{error}</div>
        )}
      </div>

      <hr className="ask-divider" />
    </>
  );
}
