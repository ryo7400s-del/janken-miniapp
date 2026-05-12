"use client";
import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useWriteContract, useReadContract } from "wagmi";
import { coinbaseWallet } from "wagmi/connectors";
import { parseEther } from "viem";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

const ABI = [
  {
    name: "play",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "playerMove", type: "uint8" }],
    outputs: [],
  },
  {
    name: "continuePlaying",
    type: "function",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
  {
    name: "reset",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "getPlayer",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "addr", type: "address" }],
    outputs: [
      { name: "score", type: "uint256" },
      { name: "highScore", type: "uint256" },
      { name: "isAlive", type: "bool" },
      { name: "hasContinued", type: "bool" },
      { name: "continuePending", type: "bool" },
    ],
  },
] as const;

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

function shortAddr(addr: string) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContract } = useWriteContract();

  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [playerMove, setPlayerMove] = useState<number | null>(null);
  const [houseMove, setHouseMove] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [phase, setPhase] = useState("idle");
  const [hasContinued, setHasContinued] = useState(false);
  const [blink, setBlink] = useState(true);

  const { data: playerData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "getPlayer",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  useEffect(() => {
    if (playerData) {
      const [s, h, , cont, pending] = playerData;
      setScore(Number(s));
      setBest(Number(h));
      setHasContinued(cont);
      if (pending) setPhase("lost");
    }
  }, [playerData]);

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

    if (isConnected) {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "play",
        args: [move],
      });
    }

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
    if (isConnected) {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "continuePlaying",
        value: parseEther("0.000002"),
      });
    }
    setHasContinued(true);
    setPhase("idle");
  }

  function handleReset() {
    if (isConnected) {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "reset",
      });
    }
    setScore(0);
    setPhase("idle");
  }

  const moveObj = (id: number) => MOVES.find((m) => m.id === id);

  const resultColor =
    result === "win" ? "#00ff41" :
    result === "draw" ? "#ffe600" :
    result === "lose" ? "#ff003c" : "#00eaff";

  return (
    <main style={{
      minHeight: "100vh",
      width: "100vw",
      background: "#0a0a0a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Press Start 2P', monospace",
      backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.03) 2px, rgba(0,255,65,0.03) 4px)",
      boxSizing: "border-box",
    }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
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
          50% { text-shadow: 0 0 20px #00ff41, 0 0 50px #00ff41, 0 0 100px #00ff41; }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        @keyframes pop {
          0% { transform: scale(0.5); opacity:0; }
          70% { transform: scale(1.2); }
          100% { transform: scale(1); opacity:1; }
        }
        .arcade-btn:hover { background: #1a1a1a !important; transform: translateY(-3px); }
        .arcade-btn:active { transform: translateY(2px); }
      `}</style>

      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "80px",
        background: "linear-gradient(transparent, rgba(0,255,65,0.06), transparent)",
        animation: "scanline 3s linear infinite",
        pointerEvents: "none", zIndex: 10,
      }} />

      <div style={{
        width: "100%",
        maxWidth: "480px",
        border: "3px solid #00ff41",
        boxShadow: "0 0 30px #00ff41, inset 0 0 30px rgba(0,255,65,0.05)",
        borderRadius: "4px",
        padding: "20px 16px",
        animation: "flicker 8s infinite",
      }}>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <div style={{ fontSize: "11px", color: "#ff00ff", textShadow: "0 0 10px #ff00ff", letterSpacing: "3px", marginBottom: "6px" }}>
            * INSERT COIN *
          </div>
          <div style={{ fontSize: "18px", color: "#00ff41", animation: "glow-green 2s ease-in-out infinite", letterSpacing: "2px", lineHeight: 1.4 }}>
            ROCK SCIS<br />PAPER
          </div>
          <div style={{ fontSize: "9px", color: "#00eaff", marginTop: "6px", textShadow: "0 0 8px #00eaff" }}>
            ONCHAIN EDITION
          </div>
        </div>

        {/* Wallet */}
        <div style={{ textAlign: "center", marginBottom: "14px" }}>
          {isConnected && address ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "8px", color: "#00ff41", textShadow: "0 0 6px #00ff41" }}>
                {shortAddr(address)}
              </span>
              <button onClick={() => disconnect()} className="arcade-btn" style={{
                background: "#0a0a0a", border: "1px solid #444",
                color: "#666", fontFamily: "'Press Start 2P', monospace",
                fontSize: "7px", padding: "4px 8px", cursor: "pointer",
              }}>
                EXIT
              </button>
            </div>
          ) : (
            <button
              onClick={() => connect({ connector: coinbaseWallet({ appName: "Rock Scissors Paper" }) })}
              className="arcade-btn"
              style={{
                background: "#0a0f0a", border: "2px solid #00ff41",
                boxShadow: "0 0 12px #00ff41",
                color: "#00ff41", fontFamily: "'Press Start 2P', monospace",
                fontSize: "9px", padding: "10px 20px", cursor: "pointer",
                transition: "all 0.1s",
              }}
            >
              CONNECT WALLET
            </button>
          )}
        </div>

        {/* Score board */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          background: "#000", border: "2px solid #333",
          padding: "10px 16px", marginBottom: "16px",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "8px", color: "#888", marginBottom: "6px" }}>1UP</div>
            <div style={{ fontSize: "20px", color: "#00ff41", textShadow: "0 0 8px #00ff41" }}>
              {String(score).padStart(6, "0")}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "8px", color: "#888", marginBottom: "6px" }}>HI-SCORE</div>
            <div style={{ fontSize: "20px", color: "#ff003c", textShadow: "0 0 8px #ff003c" }}>
              {String(best).padStart(6, "0")}
            </div>
          </div>
        </div>

        {/* Battle area */}
        <div style={{
          background: "#000", border: "2px solid #333",
          padding: "20px 16px", marginBottom: "16px",
          textAlign: "center", minHeight: "130px",
          display: "flex", alignItems: "center", justifyContent: "space-around",
        }}>
          <div>
            <div style={{ fontSize: "9px", color: "#00eaff", marginBottom: "8px" }}>P1</div>
            <div style={{ fontSize: "56px", animation: playerMove ? "pop 0.3s ease-out" : "none" }}>
              {playerMove ? moveObj(playerMove)?.emoji : "❓"}
            </div>
          </div>
          <div style={{ fontSize: "13px", color: resultColor, textShadow: `0 0 14px ${resultColor}`, lineHeight: 1.6 }}>
            {result === "win" ? "WIN!" : result === "draw" ? "DRAW" : result === "lose" ? "LOSE" : "VS"}
          </div>
          <div>
            <div style={{ fontSize: "9px", color: "#ff6600", marginBottom: "8px" }}>CPU</div>
            <div style={{ fontSize: "56px", animation: houseMove ? "pop 0.3s ease-out" : "none" }}>
              {houseMove ? moveObj(houseMove)?.emoji : "❓"}
            </div>
          </div>
        </div>

        {/* Continue screen */}
        {phase === "lost" && (
          <div style={{
            background: "#000", border: "3px solid #ff003c",
            boxShadow: "0 0 24px #ff003c", padding: "20px 16px",
            textAlign: "center", marginBottom: "16px",
            animation: "shake 0.4s ease-in-out",
          }}>
            <div style={{ fontSize: "14px", color: "#ff003c", textShadow: "0 0 10px #ff003c", marginBottom: "10px" }}>
              GAME OVER
            </div>
            <div style={{ fontSize: "9px", color: "#888", marginBottom: "6px" }}>CONTINUE?</div>
            <div style={{ fontSize: "11px", color: "#ffe600", marginBottom: "10px", textShadow: "0 0 10px #ffe600", minHeight: "20px" }}>
              {blink ? ">>> INSERT COIN <<<" : ""}
            </div>
            <div style={{ fontSize: "8px", color: "#666", marginBottom: "16px" }}>
              0.000002 ETH • 1 CREDIT ONLY
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button onClick={handleContinue} className="arcade-btn" style={{
                background: "#1a0000", border: "2px solid #ff003c",
                color: "#ff003c", fontFamily: "'Press Start 2P', monospace",
                fontSize: "9px", padding: "12px 16px", cursor: "pointer",
                boxShadow: "0 0 10px #ff003c", transition: "all 0.1s",
              }}>
                CONTINUE
              </button>
              <button onClick={handleReset} className="arcade-btn" style={{
                background: "#0a0a0a", border: "2px solid #444",
                color: "#666", fontFamily: "'Press Start 2P', monospace",
                fontSize: "9px", padding: "12px 16px", cursor: "pointer",
                transition: "all 0.1s",
              }}>
                RESET
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {(phase === "idle" || phase === "reveal") && (
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "16px" }}>
            {MOVES.map((m) => (
              <button key={m.id} onClick={() => play(m.id)} className="arcade-btn"
                disabled={phase === "reveal"}
                style={{
                  flex: 1, background: "#0a0a0a",
                  border: "2px solid #00ff41",
                  boxShadow: "0 0 10px #00ff4144, 0 5px 0 #006600",
                  borderRadius: "2px", padding: "14px 4px", cursor: phase === "idle" ? "pointer" : "default",
                  opacity: phase === "reveal" ? 0.5 : 1,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
                  transition: "all 0.1s",
                }}>
                <span style={{ fontSize: "36px" }}>{m.emoji}</span>
                <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "8px", color: "#00ff41", textShadow: "0 0 6px #00ff41" }}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Bottom bar */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          fontSize: "8px", color: "#444",
          borderTop: "1px solid #222", paddingTop: "10px",
        }}>
          <span>CREDITS: 1</span>
          {hasContinued && <span style={{ color: "#ffe600" }}>CONTINUED</span>}
          <span>BASE</span>
        </div>

      </div>

      <div style={{ marginTop: "14px", fontSize: "7px", color: "#222", textAlign: "center", fontFamily: "'Press Start 2P', monospace" }}>
        (C) 2025 ONCHAIN ARCADE
      </div>

    </main>
  );
}
