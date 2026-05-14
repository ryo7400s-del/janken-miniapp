"use client";
import { useAccount, useDisconnect } from "wagmi";
import { useWeb3Modal } from "@web3modal/wagmi/react";

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useWeb3Modal();

  if (isConnected && address) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "8px", color: "#00ff41", textShadow: "0 0 6px #00ff41", fontFamily: "Press Start 2P, monospace" }}>
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button onClick={() => disconnect()} style={{ background: "#0a0a0a", border: "1px solid #444", color: "#666", fontFamily: "Press Start 2P, monospace", fontSize: "7px", padding: "4px 8px", cursor: "pointer" }}>
          EXIT
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center" }}>
      <button
        onClick={() => open()}
        style={{
          background: "#0a0f0a", border: "2px solid #00ff41",
          boxShadow: "0 0 12px #00ff41",
          color: "#00ff41", fontFamily: "Press Start 2P, monospace",
          fontSize: "9px", padding: "10px 20px", cursor: "pointer",
        }}
      >
        CONNECT WALLET
      </button>
    </div>
  );
}
