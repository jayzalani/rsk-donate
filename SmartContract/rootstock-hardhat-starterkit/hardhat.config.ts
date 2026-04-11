import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/types";
import "hardhat-deploy";
import "@nomiclabs/hardhat-solhint";
import "solidity-coverage";
import "dotenv/config";

// Importing custom tasks
import "./tasks/utils/accounts";
import "./tasks/utils/balance";
import "./tasks/utils/block-number";
import "./tasks/utils/send-eth";

import "./tasks/erc721/mint";
import "./tasks/erc721/base-uri";
import "./tasks/erc721/contract-uri";

import "./tasks/erc20/mint";

import "./tasks/erc1155/mint";
import "./tasks/erc1155/base-uri";
import "./tasks/erc1155/contract-uri";

const RSK_TESTNET_RPC_URL = process.env.RSK_TESTNET_RPC_URL;
const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;

if (!RSK_TESTNET_RPC_URL) {
    throw new Error("The RPC URL for the testnet is not configured.");
}

if (!WALLET_PRIVATE_KEY) {
    throw new Error("Private key is not configured.");
}

const config: HardhatUserConfig = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {},
        localhost: {
            url: "http://127.0.0.1:8545",
        },
        rskTestnet: {
            url: RSK_TESTNET_RPC_URL,
            chainId: 31,
            gasPrice: 60000000,
            accounts: [WALLET_PRIVATE_KEY]
        },
    },
    etherscan: {
        apiKey: {
            rsktestnet: 'your API key',
            rskmainnet: 'your API key'
        },
        customChains: [
            {
                network: "rsktestnet",
                chainId: 31,
                urls: {
                    apiURL: "https://rootstock-testnet.blockscout.com/api/",
                    browserURL: "https://rootstock-testnet.blockscout.com/",
                }
            },
            {
                network: "rskmainnet",
                chainId: 30,
                urls: {
                    apiURL: "https://rootstock.blockscout.com/api/",
                    browserURL: "https://rootstock.blockscout.com/",
                }
            },
        ]
    },
    namedAccounts: {
        deployer: {
            default: 0,
            mainnet: 0,
        },
        owner: {
            default: 0,
        },
    },
    solidity: {
        // Multiple compiler versions so each contract compiles with
        // exactly the version declared in its own pragma.
        // DonationVault.sol      → pragma solidity 0.8.25  → uses 0.8.25
        // DonationVaultFactory.sol → pragma solidity 0.8.24 → uses 0.8.24
        compilers: [
            {
                version: "0.8.25",  
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                    evmVersion: "paris",  // RSK does not support shanghai/cancun
                },
            },
            {
                version: "0.8.24",   // for DonationVaultFactory (deploy with this)
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                    evmVersion: "paris",
                },
            },
        ],
    },
};

export default config;