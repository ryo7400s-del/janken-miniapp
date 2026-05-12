"use client";
import { useState, useEffect } from "react";

const MOVES = [
  { id: 1, label: "ROCK", emoji: "✊" },
  { id: 2, label: "SCIS", emoji: "✌️" },
  { id: 3, label: "PAPER", emoji: "🖐️" },
];

function judge(p: number, h: number): "win" | "draw" | "lose" {
  if (p === h) return "draw";
  if (
    (p === 1 && h === 2) ||
    (p === 2 && h === 3) ||
    (p === 3 && h === 1)
  ) return "win";
  return "lose";
}

function random(score: number): number {
  return (Math.floor(Math.random() * 1000) + score) % 3 + 1;
}

export default function Home() {
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [playerMove, setPlayerMove] = useState<number | null>(null);
  const [houseMove, setHouseMove] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [phase, setPhase] = useState("idle");
  const [hasContinued, setHasContinued] = useState(false);
  const [blink, setBlink] = useState(true);
  const [credits] = useState(1);

  useEffect(() => {
    const t = setInterval(() => setBlink((b) => !b), 500);
    return () => clearInterval(t);
  }, []);

  function play(move: number) {
    if (phase !== "idle") return;
    setPhase("reveal");
    setPlayerMove(move);
    const hm = random(score);
    setHouseMove(hm);
    const res = judge(move, hm);
    setResult(res);
    if (res === "win") {
      const ns = score + 1;
      setScore(ns);
      setBest((b) => Math.max(b, ns));
      setTimeout(() => setPhase("idle"), 1500);
    } else if (res === "draw") {
      setTimeout(() => setPhase("idle"), 1500);
    } else {
      if (!hasContinued) {
        setPhase("lost");
      } else {
        setScore(0);
        setTimeout(() => setPhase("idle"), 1500);
      }
    }
  }

  function handleContinue() {
    setHasContinued(true);
    setPhase("idle");
  }

  function handleReset() {
    setScore(0);
    setPhase("idle");
  }

  const move = (id: number) => MOVES.find((m) => m.id === id);

  const resultColor =
    result === "win" ? "#00ff41" :
    result === "draw" ? "#ffe600" :
    result === "lose" ? "#ff003c" : "#00eaff";

  return (
    <main style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Press Start 2P', monospace",
      padding: "16px",
      backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.03) 2px, rgba(0,255,65,0.03) 4px)",
    }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes flicker {
          0%,100% { opacity:1; }
          92% { opacity:1; }
          93% { opacity:0.4; }
          94% { opacity:1; }
          96% { opacity:0.6; }
          97% { opacity:1; }
        }
        @keyframes glow-green {
          0%,100% { text-shadow: 0 0 8px #00ff41, 0 0 20px #00ff41; }
          50% { text-shadow: 0 0 16px #00ff41, 0 0 40px #00ff41, 0 0 80px #00ff41; }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        @keyframes pop {
          0% { transform: scale(0.5); opacity:0; }
          70% { transform: scale(1.2); }
          100% { transform: scale(1); opacity:1; }
        }
        .arcade-btn:hover {
          background: #1a1a1a !important;
          transform: translateY(-2px);
        }
        .arcade-btn:active {
          transform: translateY(2px);
        }
      `}</style>

      {/* Scanline overlay */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "60px",
        background: "linear-gradient(transparent, rgba(0,255,65,0.06), transparent)",
        animation: "scanline 3s linear infinite",
        pointerEvents: "none", zIndex: 10,
      }} />

      {/* Cabinet top bar */}
      <div style={{
        width: "100%", maxWidth: "400px",
        border: "3px solid #00ff41",
        boxShadow: "0 0 20px #00ff41, inset 0 0 20px rgba(0,255,65,0.05)",
        borderRadius: "4px",
        padding: "16px",
        animation: "flicker 8s infinite",
      }}>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <div style={{
            fontSize: "10px", color: "#ff00ff",
            textShadow: "0 0 10px #ff00ff, 0 0 30px #ff00ff",
            letterSpacing: "2px", marginBottom: "4px",
          }}>
            * INSERT COIN *
          </div>
          <div style={{
            fontSize: "14px", color: "#00ff41",
            animation: "glow-green 2s ease-in-out infinite",
            letterSpacing: "1px",
          }}>
            ROCK SCIS PAPER
          </div>
          <div style={{ fontSize: "8px", color: "#00eaff", marginTop: "4px", textShadow: "0 0 8px #00eaff" }}>
            ONCHAIN EDITION
          </div>
        </div>

        {/* Score board */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          background: "#000", border: "2px solid #333",
          padding: "8px 12px", marginBottom: "12px",
          borderRadius: "2px",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "7px", color: "#888", marginBottom: "4px" }}>1UP</div>
            <div style={{ fontSize: "16px", color: "#00ff41", textShadow: "0 0 8px #00ff41" }}>
              {String(score).padStart(6, "0")}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "7px", color: "#888", marginBottom: "4px" }}>HI-SCORE</div>
            <div style={{ fontSize: "16px", color: "#ff003c", textShadow: "0 0 8px #ff003c" }}>
              {String(best).padStart(6, "0")}
            </div>
          </div>
        </div>

        {/* Battle area */}
        <div style={{
          background: "#000",
          border: "2px solid #333",
          borderRadius: "2px",
          padding: "16px",
          marginBottom: "12px",
          textAlign: "center",
          minHeight: "100px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
        }}>
          <div>
            <div style={{ fontSize: "7px", color: "#00eaff", marginBottom: "6px" }}>P1</div>
            <div style={{ fontSize: "40px", animation: playerMove ? "pop 0.3s ease-out" : "none" }}>
              {playerMove ? move(playerMove)?.emoji : "❓"}
            </div>
          </div>

          <div style={{
            fontSize: "10px",
            color: resultColor,
            textShadow: `0 0 10px ${resultColor}`,
            animation: result ? "glow-green 1s infinite" : "none",
          }}>
            {result === "win" ? "WIN!" :
             result === "draw" ? "DRAW" :
             result === "lose" ? "LOSE" : "VS"}
          </div>

          <div>
            <div style={{ fontSize: "7px", color: "#ff6600", marginBottom: "6px" }}>CPU</div>
            <div style={{ fontSize: "40px", animation: houseMove ? "pop 0.3s ease-out" : "none" }}>
              {houseMove ? move(houseMove)?.emoji : "❓"}
            </div>
          </div>
        </div>

        {/* Continue screen */}
        {phase === "lost" && (
          <div style={{
            background: "#000",
            border: "3px solid #ff003c",
            boxShadow: "0 0 20px #ff003c",
            borderRadius: "2px",
            padding: "16px",
            textAlign: "center",
            marginBottom: "12px",
            animation: "shake 0.4s ease-in-out",
          }}>
            <div style={{ fontSize: "12px", color: "#ff003c", textShadow: "0 0 10px #ff003c", marginBottom: "8px" }}>
              GAME OVER
            </div>
            <div style={{ fontSize: "7px", color: "#888", marginBottom: "4px" }}>
              CONTINUE?
            </div>
            <div style={{ fontSize: "20px", color: "#ffe600", marginBottom: "8px", textShadow: "0 0 10px #ffe600" }}>
              {blink ? ">>> INSERT COIN <<<" : "                   "}
            </div>
            <div style={{ fontSize: "7px", color: "#666", marginBottom: "12px" }}>
              0.000002 ETH • 1 CREDIT ONLY
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              <button onClick={handleContinue} className="arcade-btn" style={{
                background: "#1a0000",
                border: "2px solid #ff003c",
                color: "#ff003c",
                fontFamily: "'Press Start 2P', monospace",
                fontSize: "8px",
                padding: "8px 12px",
                cursor: "pointer",
                boxShadow: "0 0 10px #ff003c",
                transition: "all 0.1s",
              }}>
                CONTINUE
              </button>
              <button onClick={handleReset} className="arcade-btn" style={{
                background: "#0a0a0a",
                border: "2px solid #444",
                color: "#666",
                fontFamily: "'Press Start 2P', monospace",
                fontSize: "8px",
                padding: "8px 12px",
                cursor: "pointer",
                transition: "all 0.1s",
              }}>
                RESET
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {phase === "idle" && (
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "12px" }}>
            {MOVES.map((m) => (
              <button key={m.id} onClick={() => play(m.id)} className="arcade-btn" style={{
                flex: 1,
                background: "#0a0a0a",
                border: "2px solid #00ff41",
                boxShadow: "0 0 8px #00ff4144, 0 4px 0 #006600",
                borderRadius: "2px",
                padding: "10px 4px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.1s",
              }}>
                <span style={{ fontSize: "28px" }}>{m.emoji}</span>
                <span style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: "7px",
                  color: "#00ff41",
                  textShadow: "0 0 6px #00ff41",
                }}>{m.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Bottom bar */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          fontSize: "7px", color: "#444",
          borderTop: "1px solid #222",
          paddingTop: "8px",
        }}>
          <span>CREDITS: {credits}</span>
          {hasContinued && <span style={{ color: "#ffe600" }}>CONTINUED</span>}
          <span>BASE</span>
        </div>

      </div>

      <div style={{ marginTop: "12px", fontSize: "7px", color: "#222", textAlign: "center", fontFamily: "'Press Start 2P', monospace" }}>
        (C) 2025 ONCHAIN ARCADE
      </div>

    </main>
  );
}
