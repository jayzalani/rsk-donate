export const DONATION_VAULT_FACTORY_ABI = [
    {
      "inputs": [],
      "name": "EmptyMilestones",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ZeroAddress",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "vault",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "ngo",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "verifier",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "targetAmount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "deployer",
          "type": "address"
        }
      ],
      "name": "VaultDeployed",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_ngo",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_verifier",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "_description",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_targetAmount",
          "type": "uint256"
        },
        {
          "internalType": "uint256[]",
          "name": "_milestoneAmounts",
          "type": "uint256[]"
        },
        {
          "internalType": "string[]",
          "name": "_milestoneDescriptions",
          "type": "string[]"
        }
      ],
      "name": "deployVault",
      "outputs": [
        {
          "internalType": "address",
          "name": "vault",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "offset",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "limit",
          "type": "uint256"
        }
      ],
      "name": "getVaults",
      "outputs": [
        {
          "internalType": "address[]",
          "name": "page",
          "type": "address[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "vaultCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "vaultNgo",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "vaults",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ] as const;