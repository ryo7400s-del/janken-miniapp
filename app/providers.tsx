"use client";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { defaultWagmiConfig } from "@web3modal/wagmi";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { injected } from "wagmi/connectors";

const projectId = "60ed604513c97a143e29ba2c149d396d";

const metadata = {
  name: "Rock Scissors Paper",
  description: "Onchain Rock Scissors Paper on Base",
  url: "https://janken-miniapp.vercel.app",
  icons: ["https://janken-miniapp.vercel.app/api/og"],
};

const wagmiConfig = defaultWagmiConfig({
  chains: [base],
  projectId,
  metadata,
  connectors: [
    farcasterMiniApp(),
    injected(),
  ],
});

createWeb3Modal({
  wagmiConfig,
  projectId,
  defaultChain: base,
  allowUnsupportedChain: false,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
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
