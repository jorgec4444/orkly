import { useState } from "react";

// const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const API_BASE = "http://127.0.0.1:8000";

function FeedbackModal({ onClose }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      await fetch(`${API_BASE}/feedback/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: text.trim() }),
      });
      setSent(true);
      setTimeout(onClose, 1500);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary to-accent" />
        <div className="p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Leave feedback</h2>
            <p className="text-sm text-gray-500 mt-0.5">What would you improve? What's missing?</p>
          </div>

          {sent ? (
            <p className="text-sm text-primary font-medium py-4 text-center">✓ Thanks for your feedback!</p>
          ) : (
            <>
              <textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write here…"
                rows={4}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!text.trim() || loading}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:opacity-90 disabled:opacity-40 transition"
                >
                  {loading ? "Sending…" : "Send"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Footer() {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <>
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left — brand */}
          <div className="flex items-center gap-2">
            <img src="/orkly_icon.svg" alt="Orkly" className="w-5 h-5" />
            <span className="text-sm text-gray-400">
              © {new Date().getFullYear()} Orkly · Jorge Vinagre
            </span>
          </div>

          {/* Right — links */}
          <div className="flex items-center gap-5 text-sm text-gray-400">
            <button
              onClick={() => setShowFeedback(true)}
              className="hover:text-primary transition-colors"
            >
              Send us your feedback
            </button>
            <a href="/terms" className="hover:text-primary transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a>
            <a
              href="mailto:jorgecdev444@gmail.com"
              className="hover:text-primary transition-colors"
            >
              Contact
            </a>
            <a
              href="https://x.com/jorgecdev444"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              𝕏
            </a>
          </div>
        </div>
      </footer>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </>
  );
}
