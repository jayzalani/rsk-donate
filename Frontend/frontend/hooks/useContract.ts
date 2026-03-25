"use client";

import { useEffect, useState, useCallback } from "react";
import { createPublicClient, createWalletClient, custom, http, parseEther, formatEther } from "viem";
import { DONATION_VAULT_ABI } from "../constant/abi";
import { CONTRACT_ADDRESS, RSK_TESTNET } from "@/lib/contract";
import { CampaignData, Milestone } from "@/lib/type";
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}
export function useContract() {
  const [account, setAccount] = useState<string | null>(null);
  const [campaignData, setCampaignData] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [txPending, setTxPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

 const publicClient = createPublicClient({
  chain: RSK_TESTNET,
  transport: http("https://public-node.testnet.rsk.co", {
    timeout: 30_000,
    retryCount: 3,
    retryDelay: 1000,
  }),
});

  const getWalletClient = () => {
    if (typeof window === "undefined" || !window.ethereum) return null;
    return createWalletClient({
      chain: RSK_TESTNET,
      transport: custom(window.ethereum),
    });
  };

  const fetchCampaignData = useCallback(async (connectedAccount?: string) => {
    try {
      setLoading(true);
      setError(null);

      const [description, targetAmount, totalRaised, ngo, verifier, lastUpdateTimestamp] =
        await Promise.all([
          publicClient.readContract({ address: CONTRACT_ADDRESS, abi: DONATION_VAULT_ABI, functionName: "description" }),
          publicClient.readContract({ address: CONTRACT_ADDRESS, abi: DONATION_VAULT_ABI, functionName: "targetAmount" }),
          publicClient.readContract({ address: CONTRACT_ADDRESS, abi: DONATION_VAULT_ABI, functionName: "totalRaised" }),
          publicClient.readContract({ address: CONTRACT_ADDRESS, abi: DONATION_VAULT_ABI, functionName: "ngo" }),
          publicClient.readContract({ address: CONTRACT_ADDRESS, abi: DONATION_VAULT_ABI, functionName: "verifier" }),
          publicClient.readContract({ address: CONTRACT_ADDRESS, abi: DONATION_VAULT_ABI, functionName: "lastUpdateTimestamp" }),
        ]);

      // Fetch milestones - try indices 0-9
      const milestones: Milestone[] = [];
      for (let i = 0; i < 10; i++) {
        try {
          const m = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: DONATION_VAULT_ABI,
            functionName: "milestones",
            args: [BigInt(i)],
          });
          milestones.push({ amount: m[0], released: m[1], description: m[2] });
        } catch {
          break;
        }
      }

      let myContribution = BigInt(0);
      const addr = connectedAccount || account;
      if (addr) {
        myContribution = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: DONATION_VAULT_ABI,
          functionName: "contributions",
          args: [addr as `0x${string}`],
        });
      }

      setCampaignData({
        description: description as string,
        targetAmount: targetAmount as bigint,
        totalRaised: totalRaised as bigint,
        ngo: ngo as string,
        verifier: verifier as string,
        lastUpdateTimestamp: lastUpdateTimestamp as bigint,
        milestones,
        myContribution,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load campaign data");
    } finally {
      setLoading(false);
    }
  }, [account]);

const connectWallet = async () => {
  try {
    if (typeof window === "undefined") return;
    
    const eth = (window as Window & { ethereum?: { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
    
    if (!eth) {
      setError("MetaMask not found. Please install it from metamask.io");
      return;
    }

    const accounts = await eth.request({ method: "eth_requestAccounts" }) as string[];
    const addr = accounts[0];
    setAccount(addr);

    // Switch to RSK Testnet
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x1f" }],
      });
    } catch (switchError: unknown) {
      const err = switchError as { code?: number };
      if (err?.code === 4902) {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: "0x1f",
            chainName: "Rootstock Testnet",
            nativeCurrency: { name: "tRBTC", symbol: "tRBTC", decimals: 18 },
            rpcUrls: ["https://public-node.testnet.rsk.co"],
            blockExplorerUrls: ["https://explorer.testnet.rsk.co"],
          }],
        });
      }
    }

    await fetchCampaignData(addr);
  } catch (e: unknown) {
    setError(e instanceof Error ? e.message : "Failed to connect wallet");
    console.error("Wallet connect error:", e);
  }
};

  const donate = async (amountEth: string) => {
    if (!account) return;
    const walletClient = getWalletClient();
    if (!walletClient) return;
    try {
      setTxPending(true);
      setError(null);
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: DONATION_VAULT_ABI,
        functionName: "donate",
        account: account as `0x${string}`,
        value: parseEther(amountEth),
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await fetchCampaignData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Donation failed");
    } finally {
      setTxPending(false);
    }
  };

  const releaseMilestone = async (index: number) => {
    if (!account) return;
    const walletClient = getWalletClient();
    if (!walletClient) return;
    try {
      setTxPending(true);
      setError(null);
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: DONATION_VAULT_ABI,
        functionName: "releaseMilestone",
        account: account as `0x${string}`,
        args: [BigInt(index)],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await fetchCampaignData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Release failed");
    } finally {
      setTxPending(false);
    }
  };

  const claimRefund = async () => {
    if (!account) return;
    const walletClient = getWalletClient();
    if (!walletClient) return;
    try {
      setTxPending(true);
      setError(null);
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: DONATION_VAULT_ABI,
        functionName: "claimRefund",
        account: account as `0x${string}`,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await fetchCampaignData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Refund claim failed");
    } finally {
      setTxPending(false);
    }
  };

  useEffect(() => {
    fetchCampaignData();
  }, []);

  const isVerifier = account?.toLowerCase() === campaignData?.verifier?.toLowerCase();
  const isExpired = campaignData
    ? Date.now() / 1000 > Number(campaignData.lastUpdateTimestamp) + 90 * 24 * 60 * 60
    : false;

  return {
    account,
    campaignData,
    loading,
    txPending,
    error,
    isVerifier,
    isExpired,
    connectWallet,
    donate,
    releaseMilestone,
    claimRefund,
    refresh: fetchCampaignData,
    formatEther,
  };
}