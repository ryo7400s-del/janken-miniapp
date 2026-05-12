"use client";
import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { parseEther, encodeFunctionData } from "viem";
import { WalletConnect } from "./components/WalletConnect";

const FEE_RECIPIENT = "0x83c4586C744832e4C66F3B58E773687fA8E64a09" as `0x${string}`;
const CONTINUE_FEE = parseEther("0.000002");
const BUILDER_CODE = "bc_upyavpsc";

function encodeBuilderSuffix(): string {
  return Buffer.from(BUILDER_CODE, "utf8").toString("hex");
}

const MOVES = [
  { id: 1, label: "ROCK", emoji: "✊" },
  { id: 2, label: "SCIS", emoji: "✌️" },
  { id: 3, label: "PAPER", emoji: "🖐️" },
];

function judge(p: number, h: number): "win" | "draw" | "lose" {
  if (p === h) return "draw";
  if ((p === 1 && h === 2) || (p === 2 && h === 3) || (p === 3 && h === 1)) return "win";
  return "lose";
}

function random(score: number): number {
  return (Math.floor(Math.random() * 1000) + score) % 3 + 1;
}

type LeaderboardEntry = { address: string; score: number };

export default function Home() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [playerMove, setPlayerMove] = useState<number | null>(null);
  const [houseMove, setHouseMove] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [phase, setPhase] = useState("idle");
  const [hasContinued, setHasContinued] = useState(false);
  const [blink, setBlink] = useState(true);
  const [tab, setTab] = useState<"game" | "board">("game");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [flash, setFlash] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [pendingHighScore, setPendingHighScore] = useState<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => setBlink((b) => !b), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (phase !== "gameover") return;
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          setFlash(true);
          setTimeout(() => {
            setFlash(false);
            setScore(0);
            setPlayerMove(null);
            setHouseMove(null);
            setResult(null);
            setPhase("idle");
          }, 600);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  async function fetchLeaderboard() {
    setLoadingBoard(true);
    const res = await fetch("/api/leaderboard");
    const data = await res.json();
    setLeaderboard(data);
    setLoadingBoard(false);
  }

  async function submitScore(newBest: number) {
    if (!address) return;
    await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, score: newBest }),
    });
  }

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
      if (ns > best) {
        setBest(ns);
        setPendingHighScore(ns);
        if (isConnected) submitScore(ns);
      }
      setTimeout(() => setPhase("idle"), 1500);
    } else if (res === "draw") {
      setTimeout(() => setPhase("idle"), 1500);
    } else {
      if (!hasContinued) {
        setTimeout(() => setPhase("lost"), 800);
      } else {
        setTimeout(() => {
          if (pendingHighScore !== null) {
            setPhase("recordscore");
          } else {
            setPhase("gameover");
          }
        }, 800);
      }
    }
  }

  async function handleContinue() {
    if (!isConnected || !walletClient) {
      alert("Please connect your wallet to continue!");
      return;
    }
    setIsPending(true);
    try {
      const suffix = encodeBuilderSuffix();
      await walletClient.sendTransaction({
        to: FEE_RECIPIENT,
        value: CONTINUE_FEE,
        data: `0x${suffix}` as `0x${string}`,
      });
      setHasContinued(true);
      setPhase("idle");
    } catch {
      alert("Transaction failed. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  function handleReset() {
    if (pendingHighScore !== null) {
      setPhase("recordscore");
    } else {
      setPhase("gameover");
    }
  }

  async function handleRecordScore() {
    if (!isConnected || !walletClient || pendingHighScore === null) {
      setPendingHighScore(null);
      setPhase("gameover");
      return;
    }
    setIsPending(true);
    try {
      const suffix = encodeBuilderSuffix();
      const data = encodeFunctionData({
        abi: [{ name: "recordHighScore", type: "function", stateMutability: "nonpayable", inputs: [{ name: "score", type: "uint256" }], outputs: [] }],
        functionName: "recordHighScore",
        args: [BigInt(pendingHighScore)],
      });
      const dataWithSuffix = `${data}${suffix}` as `0x${string}`;
      await walletClient.sendTransaction({
        to: process.env.NEXT_PUBLIC_LEADERBOARD_ADDRESS as `0x${string}`,
        data: dataWithSuffix,
      });
      setPendingHighScore(null);
      setPhase("gameover");
    } catch {
      setPendingHighScore(null);
      setPhase("gameover");
    } finally {
      setIsPending(false);
    }
  }

  const moveObj = (id: number) => MOVES.find((m) => m.id === id);
  const resultColor = result === "win" ? "#00ff41" : result === "draw" ? "#ffe600" : result === "lose" ? "#ff003c" : "#00eaff";

  return (
    <main style={{
      minHeight: "100vh", width: "100vw",
      background: flash ? "#ff003c" : "#0a0a0a",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "Press Start 2P, monospace",
      backgroundImage: flash ? "none" : "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.03) 2px, rgba(0,255,65,0.03) 4px)",
      boxSizing: "border-box", padding: "16px", transition: "background 0.1s",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
        @keyframes flicker { 0%,100% { opacity:1; } 92% { opacity:1; } 93% { opacity:0.4; } 94% { opacity:1; } 96% { opacity:0.6; } 97% { opacity:1; } }
        @keyframes glow-green { 0%,100% { text-shadow: 0 0 8px #00ff41, 0 0 20px #00ff41; } 50% { text-shadow: 0 0 20px #00ff41, 0 0 50px #00ff41, 0 0 100px #00ff41; } }
        @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-12px); } 75% { transform: translateX(12px); } }
        @keyframes pop { 0% { transform: scale(0.5); opacity:0; } 70% { transform: scale(1.2); } 100% { transform: scale(1); opacity:1; } }
        @keyframes big-shake { 0%,100% { transform: translate(0,0) rotate(0deg); } 20% { transform: translate(-10px,5px) rotate(-3deg); } 40% { transform: translate(10px,-5px) rotate(3deg); } 60% { transform: translate(-8px,3px) rotate(-2deg); } 80% { transform: translate(8px,-3px) rotate(2deg); } }
        @keyframes countdown-pop { 0% { transform: scale(2); opacity:0; } 50% { transform: scale(1.2); opacity:1; } 100% { transform: scale(1); opacity:1; } }
        .arcade-btn:hover { background: #1a1a1a !important; transform: translateY(-3px); }
        .arcade-btn:active { transform: translateY(2px); }
      `}</style>

      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "80px", background: "linear-gradient(transparent, rgba(0,255,65,0.06), transparent)", animation: "scanline 3s linear infinite", pointerEvents: "none", zIndex: 10 }} />

      {phase === "gameover" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.92)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: "28px", color: "#ff003c", textShadow: "0 0 20px #ff003c, 0 0 60px #ff003c", marginBottom: "16px", animation: "big-shake 0.3s ease-in-out infinite" }}>GAME OVER</div>
          <div style={{ fontSize: "10px", color: "#666", marginBottom: "8px" }}>SCORE RESET</div>
          <div style={{ fontSize: "10px", color: "#888", marginBottom: "16px" }}>NEW GAME IN...</div>
          <div style={{ fontSize: "72px", color: "#ffe600", textShadow: "0 0 30px #ffe600, 0 0 80px #ffe600", animation: "countdown-pop 0.8s ease-out" }}>{countdown === 0 ? "GO!" : countdown}</div>
        </div>
      )}

      {phase === "recordscore" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ fontSize: "16px", color: "#ffe600", textShadow: "0 0 20px #ffe600", marginBottom: "12px" }}>NEW HIGH SCORE!</div>
          <div style={{ fontSize: "48px", color: "#00ff41", textShadow: "0 0 30px #00ff41", marginBottom: "8px" }}>{pendingHighScore}</div>
          <div style={{ fontSize: "8px", color: "#888", marginBottom: "24px", textAlign: "center", lineHeight: 2 }}>Record on Base blockchain?</div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={handleRecordScore} disabled={isPending} style={{ background: "#0a1a0a", border: "2px solid #00ff41", color: "#00ff41", fontFamily: "Press Start 2P, monospace", fontSize: "9px", padding: "14px 20px", cursor: "pointer", boxShadow: "0 0 16px #00ff41", opacity: isPending ? 0.5 : 1 }}>
              {isPending ? "RECORDING..." : "RECORD"}
            </button>
            <button onClick={() => { setPendingHighScore(null); setPhase("gameover"); }} style={{ background: "#0a0a0a", border: "2px solid #444", color: "#666", fontFamily: "Press Start 2P
cd ~/janken-miniapp
cat /dev/null > app/page.tsx
cat > app/page.tsx << 'PART1'
"use client";
import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { parseEther, encodeFunctionData } from "viem";
import { WalletConnect } from "./components/WalletConnect";

const FEE_RECIPIENT = "0x83c4586C744832e4C66F3B58E773687fA8E64a09" as `0x${string}`;
const CONTINUE_FEE = parseEther("0.000002");
const BUILDER_CODE = "bc_upyavpsc";

function encodeBuilderSuffix(): string {
  return Buffer.from(BUILDER_CODE, "utf8").toString("hex");
}

const MOVES = [
  { id: 1, label: "ROCK", emoji: "✊" },
  { id: 2, label: "SCIS", emoji: "✌️" },
  { id: 3, label: "PAPER", emoji: "🖐️" },
];

function judge(p: number, h: number): "win" | "draw" | "lose" {
  if (p === h) return "draw";
  if ((p === 1 && h === 2) || (p === 2 && h === 3) || (p === 3 && h === 1)) return "win";
  return "lose";
}

function random(score: number): number {
  return (Math.floor(Math.random() * 1000) + score) % 3 + 1;
}

type LeaderboardEntry = { address: string; score: number };

export default function Home() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [playerMove, setPlayerMove] = useState<number | null>(null);
  const [houseMove, setHouseMove] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [phase, setPhase] = useState("idle");
  const [hasContinued, setHasContinued] = useState(false);
  const [blink, setBlink] = useState(true);
  const [tab, setTab] = useState<"game" | "board">("game");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [flash, setFlash] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [pendingHighScore, setPendingHighScore] = useState<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => setBlink((b) => !b), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (phase !== "gameover") return;
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          setFlash(true);
          setTimeout(() => {
            setFlash(false);
            setScore(0);
            setPlayerMove(null);
            setHouseMove(null);
            setResult(null);
            setPhase("idle");
          }, 600);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  async function fetchLeaderboard() {
    setLoadingBoard(true);
    const res = await fetch("/api/leaderboard");
    const data = await res.json();
    setLeaderboard(data);
    setLoadingBoard(false);
  }

  async function submitScore(newBest: number) {
    if (!address) return;
    await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, score: newBest }),
    });
  }

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
      if (ns > best) {
        setBest(ns);
        setPendingHighScore(ns);
        if (isConnected) submitScore(ns);
      }
      setTimeout(() => setPhase("idle"), 1500);
    } else if (res === "draw") {
      setTimeout(() => setPhase("idle"), 1500);
    } else {
      if (!hasContinued) {
        setTimeout(() => setPhase("lost"), 800);
      } else {
        setTimeout(() => {
          if (pendingHighScore !== null) {
            setPhase("recordscore");
          } else {
            setPhase("gameover");
          }
        }, 800);
      }
    }
  }

  async function handleContinue() {
    if (!isConnected || !walletClient) {
      alert("Please connect your wallet to continue!");
      return;
    }
    setIsPending(true);
    try {
      const suffix = encodeBuilderSuffix();
      await walletClient.sendTransaction({
        to: FEE_RECIPIENT,
        value: CONTINUE_FEE,
        data: `0x${suffix}` as `0x${string}`,
      });
      setHasContinued(true);
      setPhase("idle");
    } catch {
      alert("Transaction failed. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  function handleReset() {
    if (pendingHighScore !== null) {
      setPhase("recordscore");
    } else {
      setPhase("gameover");
    }
  }

  async function handleRecordScore() {
    if (!isConnected || !walletClient || pendingHighScore === null) {
      setPendingHighScore(null);
      setPhase("gameover");
      return;
    }
    setIsPending(true);
    try {
      const suffix = encodeBuilderSuffix();
      const data = encodeFunctionData({
        abi: [{ name: "recordHighScore", type: "function", stateMutability: "nonpayable", inputs: [{ name: "score", type: "uint256" }], outputs: [] }],
        functionName: "recordHighScore",
        args: [BigInt(pendingHighScore)],
      });
      const dataWithSuffix = `${data}${suffix}` as `0x${string}`;
      await walletClient.sendTransaction({
        to: process.env.NEXT_PUBLIC_LEADERBOARD_ADDRESS as `0x${string}`,
        data: dataWithSuffix,
      });
      setPendingHighScore(null);
      setPhase("gameover");
    } catch {
      setPendingHighScore(null);
      setPhase("gameover");
    } finally {
      setIsPending(false);
    }
  }

  const moveObj = (id: number) => MOVES.find((m) => m.id === id);
  const resultColor = result === "win" ? "#00ff41" : result === "draw" ? "#ffe600" : result === "lose" ? "#ff003c" : "#00eaff";
PART1
cat >> app/page.tsx << 'PART2'

  return (
    <main style={{
      minHeight: "100vh", width: "100vw",
      background: flash ? "#ff003c" : "#0a0a0a",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "Press Start 2P, monospace",
      backgroundImage: flash ? "none" : "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.03) 2px, rgba(0,255,65,0.03) 4px)",
      boxSizing: "border-box", padding: "16px", transition: "background 0.1s",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
        @keyframes flicker { 0%,100% { opacity:1; } 92% { opacity:1; } 93% { opacity:0.4; } 94% { opacity:1; } 96% { opacity:0.6; } 97% { opacity:1; } }
        @keyframes glow-green { 0%,100% { text-shadow: 0 0 8px #00ff41, 0 0 20px #00ff41; } 50% { text-shadow: 0 0 20px #00ff41, 0 0 50px #00ff41, 0 0 100px #00ff41; } }
        @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-12px); } 75% { transform: translateX(12px); } }
        @keyframes pop { 0% { transform: scale(0.5); opacity:0; } 70% { transform: scale(1.2); } 100% { transform: scale(1); opacity:1; } }
        @keyframes big-shake { 0%,100% { transform: translate(0,0) rotate(0deg); } 20% { transform: translate(-10px,5px) rotate(-3deg); } 40% { transform: translate(10px,-5px) rotate(3deg); } 60% { transform: translate(-8px,3px) rotate(-2deg); } 80% { transform: translate(8px,-3px) rotate(2deg); } }
        @keyframes countdown-pop { 0% { transform: scale(2); opacity:0; } 50% { transform: scale(1.2); opacity:1; } 100% { transform: scale(1); opacity:1; } }
        .arcade-btn:hover { background: #1a1a1a !important; transform: translateY(-3px); }
        .arcade-btn:active { transform: translateY(2px); }
      `}</style>

      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "80px", background: "linear-gradient(transparent, rgba(0,255,65,0.06), transparent)", animation: "scanline 3s linear infinite", pointerEvents: "none", zIndex: 10 }} />

      {phase === "gameover" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.92)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: "28px", color: "#ff003c", textShadow: "0 0 20px #ff003c, 0 0 60px #ff003c", marginBottom: "16px", animation: "big-shake 0.3s ease-in-out infinite" }}>GAME OVER</div>
          <div style={{ fontSize: "10px", color: "#666", marginBottom: "8px" }}>SCORE RESET</div>
          <div style={{ fontSize: "10px", color: "#888", marginBottom: "16px" }}>NEW GAME IN...</div>
          <div style={{ fontSize: "72px", color: "#ffe600", textShadow: "0 0 30px #ffe600, 0 0 80px #ffe600", animation: "countdown-pop 0.8s ease-out" }}>{countdown === 0 ? "GO!" : countdown}</div>
        </div>
      )}

      {phase === "recordscore" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ fontSize: "16px", color: "#ffe600", textShadow: "0 0 20px #ffe600", marginBottom: "12px" }}>NEW HIGH SCORE!</div>
          <div style={{ fontSize: "48px", color: "#00ff41", textShadow: "0 0 30px #00ff41", marginBottom: "8px" }}>{pendingHighScore}</div>
          <div style={{ fontSize: "8px", color: "#888", marginBottom: "24px", textAlign: "center", lineHeight: 2 }}>Record on Base blockchain?</div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={handleRecordScore} disabled={isPending} style={{ background: "#0a1a0a", border: "2px solid #00ff41", color: "#00ff41", fontFamily: "Press Start 2P, monospace", fontSize: "9px", padding: "14px 20px", cursor: "pointer", boxShadow: "0 0 16px #00ff41", opacity: isPending ? 0.5 : 1 }}>
              {isPending ? "RECORDING..." : "RECORD"}
            </button>
            <button onClick={() => { setPendingHighScore(null); setPhase("gameover"); }} style={{ background: "#0a0a0a", border: "2px solid #444", color: "#666", fontFamily: "Press Start 2P, monospace", fontSize: "9px", padding: "14px 20px", cursor: "pointer" }}>
              SKIP
            </button>
          </div>
          {!isConnected && (
            <div style={{ marginTop: "16px", fontSize: "7px", color: "#ff003c" }}>Connect wallet to record!</div>
          )}
        </div>
      )}

      <div style={{ width: "100%", maxWidth: "480px", border: `3px solid ${phase === "gameover" ? "#ff003c" : "#00ff41"}`, boxShadow: phase === "gameover" ? "0 0 40px #ff003c" : "0 0 30px #00ff41, inset 0 0 30px rgba(0,255,65,0.05)", borderRadius: "4px", padding: "20px 16px", animation: phase === "gameover" ? "big-shake 0.4s ease-in-out" : "flicker 8s infinite" }}>

        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <div style={{ fontSize: "11px", color: "#ff00ff", textShadow: "0 0 10px #ff00ff", letterSpacing: "3px", marginBottom: "6px" }}>* INSERT COIN *</div>
          <div style={{ fontSize: "18px", color: "#00ff41", animation: "glow-green 2s ease-in-out infinite", letterSpacing: "2px" }}>ROCK SCIS PAPER</div>
          <div style={{ fontSize: "9px", color: "#00eaff", marginTop: "6px", textShadow: "0 0 8px #00eaff" }}>ONCHAIN EDITION</div>
        </div>

        <div style={{ marginBottom: "12px" }}><WalletConnect /></div>

        {isPending && <div style={{ textAlign: "center", fontSize: "8px", color: "#ffe600", textShadow: "0 0 8px #ffe600", marginBottom: "8px" }}>TX PENDING...</div>}

        <div style={{ display: "flex", marginBottom: "12px", border: "2px solid #333" }}>
          {(["game", "board"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); if (t === "board") fetchLeaderboard(); }} className="arcade-btn" style={{ flex: 1, padding: "8px 4px", background: tab === t ? "#0a1a0a" : "#0a0a0a", border: "none", borderBottom: tab === t ? "2px solid #00ff41" : "2px solid transparent", color: tab === t ? "#00ff41" : "#444", fontFamily: "Press Start 2P, monospace", fontSize: "8px", cursor: "pointer", textShadow: tab === t ? "0 0 6px #00ff41" : "none" }}>
              {t === "game" ? "GAME" : "RANKING"}
            </button>
          ))}
        </div>

        {tab === "game" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", background: "#000", border: "2px solid #333", padding: "10px 16px", marginBottom: "12px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "8px", color: "#888", marginBottom: "6px" }}>1UP</div>
                <div style={{ fontSize: "20px", color: "#00ff41", textShadow: "0 0 8px #00ff41" }}>{String(score).padStart(6, "0")}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "8px", color: "#888", marginBottom: "6px" }}>HI-SCORE</div>
                <div style={{ fontSize: "20px", color: "#ff003c", textShadow: "0 0 8px #ff003c" }}>{String(best).padStart(6, "0")}</div>
              </div>
            </div>

            <div style={{ background: "#000", border: "2px solid #333", padding: "20px 16px", marginBottom: "12px", textAlign: "center", minHeight: "130px", display: "flex", alignItems: "center", justifyContent: "space-around" }}>
              <div>
                <div style={{ fontSize: "9px", color: "#00eaff", marginBottom: "8px" }}>P1</div>
                <div style={{ fontSize: "56px", animation: playerMove ? "pop 0.3s ease-out" : "none" }}>{playerMove ? moveObj(playerMove)?.emoji : "❓"}</div>
              </div>
              <div style={{ fontSize: "13px", color: resultColor, textShadow: `0 0 14px ${resultColor}` }}>
                {result === "win" ? "WIN!" : result === "draw" ? "DRAW" : result === "lose" ? "LOSE" : "VS"}
              </div>
              <div>
                <div style={{ fontSize: "9px", color: "#ff6600", marginBottom: "8px" }}>CPU</div>
                <div style={{ fontSize: "56px", animation: houseMove ? "pop 0.3s ease-out" : "none" }}>{houseMove ? moveObj(houseMove)?.emoji : "❓"}</div>
              </div>
            </div>

            {phase === "lost" && (
              <div style={{ background: "#000", border: "3px solid #ff003c", boxShadow: "0 0 24px #ff003c", padding: "20px 16px", textAlign: "center", marginBottom: "12px", animation: "shake 0.4s ease-in-out" }}>
                <div style={{ fontSize: "14px", color: "#ff003c", textShadow: "0 0 10px #ff003c", marginBottom: "10px" }}>GAME OVER</div>
                <div style={{ fontSize: "9px", color: "#888", marginBottom: "6px" }}>CONTINUE?</div>
                <div style={{ fontSize: "11px", color: "#ffe600", marginBottom: "10px", textShadow: "0 0 10px #ffe600", minHeight: "20px" }}>{blink ? ">>> INSERT COIN <<<" : ""}</div>
                <div style={{ fontSize: "8px", color: "#666", marginBottom: "4px" }}>0.000002 ETH • 1 CREDIT ONLY</div>
                <div style={{ fontSize: "7px", color: "#444", marginBottom: "16px" }}>Wallet connection required</div>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                  <button onClick={handleContinue} className="arcade-btn" style={{ background: "#1a0000", border: "2px solid #ff003c", color: "#ff003c", fontFamily: "Press Start 2P, monospace", fontSize: "9px", padding: "12px 16px", cursor: "pointer", boxShadow: "0 0 10px #ff003c", opacity: isPending ? 0.5 : 1 }}>
                    {isPending ? "PENDING..." : "CONTINUE"}
                  </button>
                  <button onClick={handleReset} className="arcade-btn" style={{ background: "#0a0a0a", border: "2px solid #444", color: "#666", fontFamily: "Press Start 2P, monospace", fontSize: "9px", padding: "12px 16px", cursor: "pointer" }}>RESET</button>
                </div>
              </div>
            )}

            {(phase === "idle" || phase === "reveal") && (
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "12px" }}>
                {MOVES.map((m) => (
                  <button key={m.id} onClick={() => play(m.id)} className="arcade-btn" disabled={phase === "reveal"} style={{ flex: 1, background: "#0a0a0a", border: "2px solid #00ff41", boxShadow: "0 0 10px #00ff4144, 0 5px 0 #006600", borderRadius: "2px", padding: "14px 4px", cursor: phase === "idle" ? "pointer" : "default", opacity: phase === "reveal" ? 0.5 : 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "36px" }}>{m.emoji}</span>
                    <span style={{ fontFamily: "Press Start 2P, monospace", fontSize: "8px", color: "#00ff41", textShadow: "0 0 6px #00ff41" }}>{m.label}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "board" && (
          <div style={{ background: "#000", border: "2px solid #333", padding: "12px" }}>
            <div style={{ fontSize: "10px", color: "#ffe600", textShadow: "0 0 8px #ffe600", textAlign: "center", marginBottom: "12px" }}>TOP PLAYERS</div>
            {loadingBoard ? (
              <div style={{ textAlign: "center", fontSize: "8px", color: "#444", padding: "20px" }}>LOADING...</div>
            ) : leaderboard.length === 0 ? (
              <div style={{ textAlign: "center", fontSize: "8px", color: "#444", padding: "20px" }}>NO RECORDS YET</div>
            ) : (
              leaderboard.map((entry, i) => (
                <div key={entry.address} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 4px", borderBottom: "1px solid #1a1a1a" }}>
                  <span style={{ fontSize: "9px", color: i === 0 ? "#ffe600" : i === 1 ? "#aaaaaa" : i === 2 ? "#ff6600" : "#444", textShadow: i === 0 ? "0 0 8px #ffe600" : "none", minWidth: "24px" }}>{i === 0 ? "👑" : `#${i + 1}`}</span>
                  <span style={{ fontSize: "8px", color: "#00eaff", flex: 1, marginLeft: "8px" }}>{entry.address.slice(0, 6)}...{entry.address.slice(-4)}</span>
                  <span style={{ fontSize: "10px", color: "#00ff41", textShadow: "0 0 6px #00ff41" }}>{String(entry.score).padStart(4, "0")}</span>
                </div>
              ))
            )}
            <button onClick={fetchLeaderboard} className="arcade-btn" style={{ width: "100%", marginTop: "12px", background: "#0a0a0a", border: "1px solid #333", color: "#444", fontFamily: "Press Start 2P, monospace", fontSize: "7px", padding: "8px", cursor: "pointer" }}>REFRESH</button>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "7px", color: "#333", borderTop: "1px solid #222", paddingTop: "10px", marginTop: "12px" }}>
          <span>CREDITS: 1</span>
          {hasContinued && <span style={{ color: "#ffe600" }}>CONTINUED</span>}
          <span>BASE</span>
        </div>

      </div>
      <div style={{ marginTop: "14px", fontSize: "7px", color: "#1a1a1a", textAlign: "center", fontFamily: "Press Start 2P, monospace" }}>(C) 2025 ONCHAIN ARCADE</div>
    </main>
  );
}
