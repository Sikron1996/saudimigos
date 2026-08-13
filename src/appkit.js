import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { SITE_CONFIG } from "./config";

export const robinhoodChain = {
  id: SITE_CONFIG.chainId,
  caipNetworkId: SITE_CONFIG.caipNetworkId,
  chainNamespace: "eip155",
  name: SITE_CONFIG.chainName,
  nativeCurrency: SITE_CONFIG.nativeCurrency,
  rpcUrls: {
    default: {
      http: [SITE_CONFIG.rpcUrl]
    }
  },
  blockExplorers: {
    default: {
      name: "Robinhood Chain Explorer",
      url: SITE_CONFIG.explorerBaseUrl
    }
  }
};

const metadata = {
  name: "Saudimigos",
  description: "5,000 pixel-art Saudimigos on Robinhood Chain",
  url: SITE_CONFIG.siteUrl,
  icons: [typeof window !== "undefined" ? `${window.location.origin}/favicon.png` : "/favicon.png"]
};

createAppKit({
  adapters: [new EthersAdapter()],
  networks: [robinhoodChain],
  defaultNetwork: robinhoodChain,
  projectId: SITE_CONFIG.walletConnectProjectId,
  metadata,
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "#111111",
    "--w3m-border-radius-master": "0px"
  },
  features: {
    analytics: true,
    email: false,
    socials: []
  }
});
