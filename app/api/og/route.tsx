import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width: "100%", height: "100%",
        background: "#0a0a0a",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: "monospace",
      }}>
        <div style={{ color: "#ff00ff", fontSize: 32, marginBottom: 16 }}>INSERT COIN</div>
        <div style={{ color: "#00ff41", fontSize: 72, fontWeight: "bold", marginBottom: 8 }}>ROCK SCIS PAPER</div>
        <div style={{ color: "#00eaff", fontSize: 28, marginBottom: 40 }}>ONCHAIN EDITION</div>
        <div style={{ display: "flex", gap: 60, fontSize: 90 }}>
          <span>✊</span>
          <span>✌️</span>
          <span>🖐️</span>
        </div>
        <div style={{ color: "#444", fontSize: 24, marginTop: 40 }}>Built on Base</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
