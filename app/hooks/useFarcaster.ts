"use client";
import { useEffect, useState } from "react";

export function useFarcaster() {
  const [isReady, setIsReady] = useState(false);
  const [context, setContext] = useState<any>(null);
  const [ethProvider, setEthProvider] = useState<any>(null);

  useEffect(() => {
    async function init() {
      try {
        const { sdk } = await import("@farcaster/miniapp-sdk");
        const ctx = await sdk.context;
        setContext(ctx);
        setEthProvider(sdk.wallet.ethProvider);
        await sdk.actions.ready();
        setIsReady(true);
      } catch {
        setIsReady(true);
      }
    }
    init();
  }, []);

  return { isReady, context, ethProvider };
}
