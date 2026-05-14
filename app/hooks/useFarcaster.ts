"use client";
import { useEffect, useState } from "react";

export function useFarcaster() {
  const [isReady, setIsReady] = useState(false);
  const [context, setContext] = useState<any>(null);
  const [ethProvider, setEthProvider] = useState<any>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    async function init() {
      // 3秒でタイムアウト
      timer = setTimeout(() => {
        setIsReady(true);
      }, 3000);

      try {
        const { sdk } = await import("@farcaster/miniapp-sdk");
        const ctx = await sdk.context;
        setContext(ctx);
        setEthProvider(sdk.wallet.ethProvider);
        await sdk.actions.ready();
      } catch {
        // Farcaster以外の環境では無視
      } finally {
        clearTimeout(timer);
        setIsReady(true);
      }
    }
    init();

    return () => clearTimeout(timer);
  }, []);

  return { isReady, context, ethProvider };
}
