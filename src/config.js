export const SITE_CONFIG = {
  contractAddress: "0x45d6e251b4A0076b04182B71805972B45BE0f128",
  walletConnectProjectId: "4f71172824a0ea69b0270161482356fe",

  chainId: 4663,
  chainIdHex: "0x1237",
  caipNetworkId: "eip155:4663",
  chainName: "Robinhood Chain",
  rpcUrl: "https://rpc.mainnet.chain.robinhood.com/",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  },

  explorerBaseUrl: "https://robinhoodchain.blockscout.com",
  explorerUrl: "https://robinhoodchain.blockscout.com/address/0x45d6e251b4A0076b04182B71805972B45BE0f128",

  // Replace these two URLs once the official collection/social pages are ready.
  openSeaUrl: "https://opensea.io/collection/saudimigo",
  twitterUrl: "https://x.com/TheDELnaka",

  siteUrl: typeof window !== "undefined" ? window.location.origin : "https://saudimigo.vercel.app",
  supply: 5000,
  mintPrice: "0.00005",
  walletLimit: 100
};
