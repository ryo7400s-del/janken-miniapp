"use client";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { metaMask, injected } from "wagmi/connectors";
import { useEffect, useState } from "react";

function createWagmiConfig(ethProvider?: any) {
  const connectors = [injected(), metaMask()];
  return createConfig({
    chains: [base],
    connectors,
    transports: { [base.id]: http() },
  });
}

const queryClient = new QueryClient();
const defaultConfig = createWagmiConfig();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={defaultConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={base}
          config={{ appearance: { name: "Rock Scissors Paper" } }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
