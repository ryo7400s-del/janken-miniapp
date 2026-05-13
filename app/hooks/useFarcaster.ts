"use client";
import { useEffect, useState } from "react";

export function useFarcaster() {
  const [isReady, setIsReady] = useState(false);
  const [context, setContext] = useState<any>(null);
  const [sdk, setSdk] = useState<any>(null);

  useEffect(() => {
    async function init() {
      try {
        const { sdk: miniSdk } = await import("@farcaster/miniapp-sdk");
        setSdk(miniSdk);
        const ctx = await miniSdk.context;
        setContext(ctx);
        await miniSdk.actions.ready();
        setIsReady(true);
      } catch {
        setIsReady(true);
      }
    }
    init();
  }, []);

  return { isReady, context, sdk };
}
