"use client";

import { useState, useCallback, useMemo } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseEther,
} from "viem";
import { DONATION_VAULT_FACTORY_ABI } from "../constant/factoryAbi";
import { FACTORY_ADDRESS, RSK_TESTNET } from "@/lib/contract";

export interface VaultSummary {
  address: string;
  ngo: string;
}

export interface DeployVaultParams {
  ngo: string;
  verifier: string;
  description: string;
  targetEth: string;
  milestoneAmounts: string[];   // each in ETH string e.g. "0.005"
  milestoneDescriptions: string[];
}

export function useFactory(account: string | null) {
  const [vaults, setVaults]       = useState<VaultSummary[]>([]);
  const [loading, setLoading]     = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [lastDeployedVault, setLastDeployedVault] = useState<string | null>(null);

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: RSK_TESTNET,
        transport: http("https://public-node.testnet.rsk.co", {
          timeout: 30_000,
          retryCount: 3,
          retryDelay: 1000,
        }),
      }),
    []
  );

  const getWalletClient = () => {
    if (typeof window === "undefined" || !window.ethereum) return null;
    return createWalletClient({
      chain: RSK_TESTNET,
      transport: custom(window.ethereum),
    });
  };

  // ─── Fetch all vaults from factory ───────────────────────────────────────

  const fetchVaults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const count = await publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: DONATION_VAULT_FACTORY_ABI,
        functionName: "vaultCount",
      });

      const total = Number(count);
      if (total === 0) {
        setVaults([]);
        return;
      }

      // Fetch all vault addresses in one paginated call
      const addresses = await publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: DONATION_VAULT_FACTORY_ABI,
        functionName: "getVaults",
        args: [BigInt(0), BigInt(total)],
      });

      // Fetch the NGO address for each vault in parallel
      const summaries: VaultSummary[] = await Promise.all(
        (addresses as string[]).map(async (addr) => {
          const ngo = await publicClient.readContract({
            address: FACTORY_ADDRESS,
            abi: DONATION_VAULT_FACTORY_ABI,
            functionName: "vaultNgo",
            args: [addr as `0x${string}`],
          });
          return { address: addr, ngo: ngo as string };
        })
      );

      setVaults(summaries);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load vaults");
    } finally {
      setLoading(false);
    }
  }, [publicClient]);

  // ─── Deploy a new vault through the factory ───────────────────────────────

  const deployVault = useCallback(
    async (params: DeployVaultParams): Promise<string | null> => {
      if (!account) { setError("Connect wallet first"); return null; }
      const walletClient = getWalletClient();
      if (!walletClient) { setError("MetaMask not found"); return null; }

      try {
        setDeploying(true);
        setError(null);
        setLastDeployedVault(null);

        const milestoneAmountsWei = params.milestoneAmounts.map((a) =>
          parseEther(a)
        );
        const targetWei = parseEther(params.targetEth);

        const hash = await walletClient.writeContract({
          address: FACTORY_ADDRESS,
          abi: DONATION_VAULT_FACTORY_ABI,
          functionName: "deployVault",
          account: account as `0x${string}`,
          args: [
            params.ngo as `0x${string}`,
            params.verifier as `0x${string}`,
            params.description,
            targetWei,
            milestoneAmountsWei,
            params.milestoneDescriptions,
          ],
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        // Parse the VaultDeployed event to get the new vault address
        const iface = receipt.logs.find((log) =>
          log.address.toLowerCase() === FACTORY_ADDRESS.toLowerCase()
        );

        // The first topic[1] of VaultDeployed is the vault address (indexed)
        const vaultAddr = iface
          ? (`0x${iface.topics[1]?.slice(26)}` as string)
          : null;

        if (vaultAddr) {
          setLastDeployedVault(vaultAddr);
          await fetchVaults(); // refresh list
        }

        return vaultAddr;
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Deployment failed");
        return null;
      } finally {
        setDeploying(false);
      }
    },
    [account, publicClient, fetchVaults]
  );

  return {
    vaults,
    loading,
    deploying,
    error,
    lastDeployedVault,
    fetchVaults,
    deployVault,
  };
}