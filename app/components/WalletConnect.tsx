"use client";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useState, useEffect } from "react";
import { useFarcaster } from "../hooks/useFarcaster";

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { context, ethProvider } = useFarcaster();
  const [showMenu, setShowMenu] = useState(false);
  const [fcAddress, setFcAddress] = useState<string | null>(null);

  const isFarcaster = !!context?.user;

  useEffect(() => {
    if (isFarcaster && ethProvider) {
      ethProvider.request({ method: "eth_accounts" }).then((accounts: string[]) => {
        if (accounts.length > 0) setFcAddress(accounts[0]);
      }).catch(() => {});
    }
  }, [isFarcaster, ethProvider]);

  async function connectFarcaster() {
    if (!ethProvider) return;
    try {
      const accounts = await ethProvider.request({ method: "eth_requestAccounts" });
      if (accounts.length > 0) setFcAddress(accounts[0]);
    } catch (e) {
      console.error(e);
    }
  }

  const displayAddress = address || fcAddress;

  if (isConnected && displayAddress) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "8px", color: "#00ff41", textShadow: "0 0 6px #00ff41", fontFamily: "Press Start 2P, monospace" }}>
          {displayAddress.slice(0, 6)}...{displayAddress.slice(-4)}
        </span>
        <button onClick={() => disconnect()} style={{ background: "#0a0a0a", border: "1px solid #444", color: "#666", fontFamily: "Press Start 2P, monospace", fontSize: "7px", padding: "4px 8px", cursor: "pointer" }}>
          EXIT
        </button>
      </div>
    );
  }

  if (fcAddress) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "8px", color: "#00ff41", textShadow: "0 0 6px #00ff41", fontFamily: "Press Start 2P, monospace" }}>
          {fcAddress.slice(0, 6)}...{fcAddress.slice(-4)}
        </span>
      </div>
    );
  }

  if (isFarcaster) {
    return (
      <div style={{ textAlign: "center" }}>
        <button onClick={connectFarcaster} style={{ background: "#0a0f0a", border: "2px solid #00ff41", boxShadow: "0 0 12px #00ff41", color: "#00ff41", fontFamily: "Press Start 2P, monospace", fontSize: "9px", padding: "10px 20px", cursor: "pointer" }}>
          CONNECT WALLET
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center" }}>
      {!showMenu ? (
        <button onClick={() => setShowMenu(true)} style={{ background: "#0a0f0a", border: "2px solid #00ff41", boxShadow: "0 0 12px #00ff41", color: "#00ff41", fontFamily: "Press Start 2P, monospace", fontSize: "9px", padding: "10px 20px", cursor: "pointer" }}>
          CONNECT WALLET
        </button>
      ) : (
        <div style={{ background: "#0a0a0a", border: "2px solid #00ff41", boxShadow: "0 0 20px #00ff41", padding: "12px" }}>
          <div style={{ fontSize: "8px", color: "#00ff41", marginBottom: "10px", fontFamily: "Press Start 2P, monospace" }}>SELECT WALLET</div>
          {connectors.map((connector) => (
            <button key={connector.uid} onClick={() => { connect({ connector }); setShowMenu(false); }} style={{ display: "block", width: "100%", background: "#0a0a0a", border: "1px solid #333", color: "#aaa", fontFamily: "Press Start 2P, monospace", fontSize: "8px", padding: "10px", cursor: "pointer", marginBottom: "6px", textAlign: "left" }}>
              {connector.name}
            </button>
          ))}
          <button onClick={() => setShowMenu(false)} style={{ display: "block", width: "100%", background: "transparent", border: "none", color: "#444", fontFamily: "Press Start 2P, monospace", fontSize: "7px", padding: "6px", cursor: "pointer" }}>
            CANCEL
          </button>
        </div>
      )}
    </div>
  );
}
