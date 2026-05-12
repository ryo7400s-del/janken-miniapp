"use client";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useState } from "react";

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [showMenu, setShowMenu] = useState(false);

  if (isConnected && address) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "8px", color: "#00ff41", textShadow: "0 0 6px #00ff41", fontFamily: "'Press Start 2P', monospace" }}>
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          style={{
            background: "#0a0a0a", border: "1px solid #444",
            color: "#666", fontFamily: "'Press Start 2P', monospace",
            fontSize: "7px", padding: "4px 8px", cursor: "pointer",
          }}
        >
          EXIT
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center" }}>
      {!showMenu ? (
        <button
          onClick={() => setShowMenu(true)}
          style={{
            background: "#0a0f0a", border: "2px solid #00ff41",
            boxShadow: "0 0 12px #00ff41",
            color: "#00ff41", fontFamily: "'Press Start 2P', monospace",
            fontSize: "9px", padding: "10px 20px", cursor: "pointer",
          }}
        >
          CONNECT WALLET
        </button>
      ) : (
        <div style={{
          background: "#0a0a0a", border: "2px solid #00ff41",
          boxShadow: "0 0 20px #00ff41", padding: "12px",
        }}>
          <div style={{ fontSize: "8px", color: "#00ff41", marginBottom: "10px", fontFamily: "'Press Start 2P', monospace" }}>
            SELECT WALLET
          </div>
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => { connect({ connector }); setShowMenu(false); }}
              style={{
                display: "block", width: "100%",
                background: "#0a0a0a", border: "1px solid #333",
                color: "#aaa", fontFamily: "'Press Start 2P', monospace",
                fontSize: "8px", padding: "10px",
                cursor: "pointer", marginBottom: "6px", textAlign: "left",
              }}
            >
              {connector.name}
            </button>
          ))}
          <button
            onClick={() => setShowMenu(false)}
            style={{
              display: "block", width: "100%",
              background: "transparent", border: "none",
              color: "#444", fontFamily: "'Press Start 2P', monospace",
              fontSize: "7px", padding: "6px", cursor: "pointer",
            }}
          >
            CANCEL
          </button>
        </div>
      )}
    </div>
  );
}
