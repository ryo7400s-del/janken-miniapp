"use client";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { metaMask, injected } from "wagmi/connectors";
import sdk from "@farcaster/frame-sdk";

const farcasterConnector = () => ({
  id: "farcaster",
  name: "Farcaster",
  type: "farcaster" as const,
  async connect() {
    const accounts = await sdk.wallet.ethProvider.request({
      method: "eth_requestAccounts",
    }) as string[];
    return { accounts: accounts as [], chainId: base.id };
  },
  async disconnect() {},
  async getAccounts() {
    const accounts = await sdk.wallet.ethProvider.request({
      method: "eth_accounts",
    }) as string[];
    return accounts as [];
  },
  async getChainId() { return base.id; },
  async getProvider() { return sdk.wallet.ethProvider; },
  async isAuthorized() { return false; },
  onAccountsChanged() {},
  onChainChanged() {},
  onDisconnect() {},
});

const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected(),
    metaMask(),
    farcasterConnector() as any,
  ],
  transports: {
    [base.id]: http(),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={base}
          config={{
            appearance: { name: "Rock Scissors Paper" },
          }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
