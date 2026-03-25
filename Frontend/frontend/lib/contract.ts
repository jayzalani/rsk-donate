export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

export const RSK_TESTNET = {
  id: 31,
  name: "Rootstock Testnet",
  nativeCurrency: { name: "tRBTC", symbol: "tRBTC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.rootstock.io/${process.env.NEXT_PUBLIC_RSK_API_KEY}"] },
    public: { http: ["https://public-node.testnet.rsk.co"] },
  },
  blockExplorers: {
    default: { name: "RSK Explorer", url: "https://explorer.testnet.rsk.co" },
  },
} as const;

export const RSK_MAINNET = {
  id: 30,
  name: "Rootstock",
  nativeCurrency: { name: "RBTC", symbol: "RBTC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://public-node.rsk.co"] },
    public: { http: ["https://public-node.rsk.co"] },
  },
  blockExplorers: {
    default: { name: "RSK Explorer", url: "https://explorer.rsk.co" },
  },
} as const;