"use client";
import { useEffect, useState } from "react";
import sdk from "@farcaster/frame-sdk";

export function useFarcaster() {
  const [isReady, setIsReady] = useState(false);
  const [context, setContext] = useState<any>(null);

  useEffect(() => {
    async function init() {
      try {
        const ctx = await sdk.context;
        setContext(ctx);
        await sdk.actions.ready();
        setIsReady(true);
      } catch {
        setIsReady(true);
      }
    }
    init();
  }, []);

  return { isReady, context };
}
