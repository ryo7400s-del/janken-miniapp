"use client";
import { useEffect, useRef, useState } from "react";

export function useBGM() {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<OscillatorNode[]>([]);
  const [playing, setPlaying] = useState(false);

  const notes = [
    261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25
  ];

  const melody = [
    4, 4, 5, 4, 6, 5, 4, 2,
    0, 0, 2, 4, 2, 1, 0, 0,
    4, 4, 5, 4, 7, 6, 4, 4,
    5, 4, 6, 5, 4, 2, 0, 0,
  ];

  function stop() {
    nodesRef.current.forEach(n => { try { n.stop(); } catch {} });
    nodesRef.current = [];
    if (ctxRef.current) {
      ctxRef.current.close();
      ctxRef.current = null;
    }
    setPlaying(false);
  }

  function play() {
    stop();
    const ctx = new AudioContext();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0.08;
    master.connect(ctx.destination);

    const bpm = 120;
    const step = 60 / bpm / 2;

    melody.forEach((noteIdx, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "square";
      osc.frequency.value = notes[noteIdx];

      const start = ctx.currentTime + i * step;
      const end = start + step * 0.8;

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(1, start + 0.01);
      gain.gain.linearRampToValueAtTime(0, end);

      osc.connect(gain);
      gain.connect(master);

      osc.start(start);
      osc.stop(end);
      nodesRef.current.push(osc);
    });

    // ループ
    const loopDuration = melody.length * step * 1000;
    const loopInterval = setInterval(() => {
      if (!ctxRef.current) { clearInterval(loopInterval); return; }
      const newCtx = ctxRef.current;
      melody.forEach((noteIdx, i) => {
        const osc = newCtx.createOscillator();
        const gain = newCtx.createGain();
        osc.type = "square";
        osc.frequency.value = notes[noteIdx];
        const start = newCtx.currentTime + i * step;
        const end = start + step * 0.8;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(1, start + 0.01);
        gain.gain.linearRampToValueAtTime(0, end);
        osc.connect(gain);
        gain.connect(master);
        osc.start(start);
        osc.stop(end);
        nodesRef.current.push(osc);
      });
    }, loopDuration);

    setPlaying(true);

    return () => clearInterval(loopInterval);
  }

  useEffect(() => {
    return () => stop();
  }, []);

  return { play, stop, playing };
}
