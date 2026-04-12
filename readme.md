# DonationVault — Transparent NGO Funding on RSK Testnet

> Milestone-based smart contract donations with on-chain accountability. Every release is verifiable. Every refund is automatic.

---

## Demo

### Video Walkthrough

[Google Drive](https://drive.google.com/file/d/1PouaoXoKRqH1tytOpi58WKoWuUtvK3S2/view?usp=sharing)

---

## What Is This?

DonationVault is a Next.js 16 frontend for a Solidity smart contract that lets donors send tRBTC to an NGO through a milestone-gated vault. A trusted verifier approves each milestone and releases funds incrementally. If the vault goes 90 days without activity, donors can claim full refunds.

**Core flow:**

1. Donors send tRBTC → funds are locked in the vault contract
2. Verifier reviews real-world progress → releases a milestone → funds go to NGO
3. If nothing happens for 90 days → any donor can claim their proportional refund

---

## Features

- Connect MetaMask and auto-switch to RSK Testnet
- View vault description, NGO address, verifier address
- Live funding progress bar (raised vs. target)
- Donate with quick-fill amount buttons and full client-side validation
- Per-donor cap (10% of target) enforced both on-chain and surfaced in the UI
- Milestone list — verifier sees release buttons, donors see status
- Refund panel with live countdown to expiry
- Every submitted transaction links to RSK Testnet Explorer
- Deploy new vaults directly from the browser (`/deploy` page via factory)
- Browse all factory-deployed vaults at `/vaults`
- Two-step verifier handoff with a 2-day time-lock for security
- NGO emergency verifier override after vault expiry

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Custom CSS (globals.css) |
| Web3 | viem v2 |
| Wallet | MetaMask |
| Network | RSK Testnet (Chain ID: 31) |
| Contract | Solidity 0.8.25 (DonationVault) / 0.8.24 (DonationVaultFactory) |

---

## Project Structure

```
donation-vault/
├── SmartContract/
│   └── rootstock-hardhat-starterkit/
│       ├── contracts/
│       │   ├── DonationVault.sol         # Core escrow contract
│       │   └── DonationVaultFactory.sol  # Factory + on-chain registry
│       ├── deploy/
│       │   ├── deploy.ts                 # Deploy a single DonationVault
│       │   └── deployFactory.ts          # Deploy the factory
│       └── test/
│           └── RSKDonate.ts              # Full test suite (35+ cases)
│
└── Frontend/
    └── frontend/
        ├── app/
        │   ├── globals.css               # CSS variables and component styles
        │   ├── layout.tsx                # Root layout and metadata
        │   ├── page.tsx                  # Main vault dashboard
        │   ├── deploy/
        │   │   └── page.tsx              # Deploy a new vault via factory
        │   └── vaults/
        │       └── page.tsx              # Browse all factory-deployed vaults
        │
        ├── components/
        │   ├── Header.tsx                # Sticky nav, wallet status, network links
        │   ├── StatsBar.tsx              # Progress bar, raised/target stats
        │   ├── MilestoneTracker.tsx      # Milestone list + verifier release buttons
        │   └── DonateModal.tsx           # Donation modal with validation and presets
        │
        ├── hooks/
        │   ├── useContract.ts            # All vault reads/writes, wallet connection
        │   └── useFactory.ts             # Factory reads/writes, vault registry
        │
        ├── constant/
        │   ├── abi.ts                    # DonationVault ABI
        │   └── factoryAbi.ts             # DonationVaultFactory ABI
        │
        └── lib/
            ├── contract.ts               # Addresses, RSK chain config
            └── type.ts                   # Shared TypeScript types
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MetaMask browser extension
- tRBTC from the [RSK Testnet Faucet](https://faucet.rsk.co)

### 1. Clone and install dependencies

```bash
git clone https://github.com/YOUR_USERNAME/donation-vault.git

# Install smart contract dependencies
cd SmartContract/rootstock-hardhat-starterkit
npm install

# Install frontend dependencies
cd ../../Frontend/frontend
npm install
```

### 2. Configure the smart contract environment

```bash
cd SmartContract/rootstock-hardhat-starterkit
cp .env.example .env
```

Edit `.env` and fill in:

```env
RSK_TESTNET_RPC_URL=https://public-node.testnet.rsk.co
WALLET_PRIVATE_KEY=your_deployer_private_key_here
```

> **Warning:** Never commit your real private key. The `.env` file is git-ignored.

### 3. Deploy the contracts

**Option A — Deploy the factory first (recommended)**

```bash
npx hardhat deploy --tags DonationVaultFactory --network rskTestnet
```

Then use the `/deploy` page in the frontend to create individual vaults through the factory.

**Option B — Deploy a single vault directly**

```bash
npx hardhat deploy --tags DonationVault --network rskTestnet
```

Copy the deployed address printed to the console.

### 4. Configure the frontend environment

```bash
cd Frontend/frontend
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Address of the deployed DonationVault (required for the main dashboard)
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedVaultAddress

# Address of the deployed DonationVaultFactory (required for /deploy and /vaults)
NEXT_PUBLIC_FACTORY_ADDRESS=0xYourDeployedFactoryAddress

# Optional: Rootstock paid RPC API key
NEXT_PUBLIC_RSK_API_KEY=your_rsk_api_key_here
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Run the smart contract test suite

```bash
cd SmartContract/rootstock-hardhat-starterkit
npx hardhat test
```

---

## Smart Contract

### Key Functions

| Function | Who | Description |
|---|---|---|
| `donate()` | Anyone | Send tRBTC to the vault (payable). Zero-value calls revert. Excess over target is auto-refunded. Per-donor cap enforced. |
| `releaseMilestone(uint256 index)` | Verifier only | Release a milestone's funds to the NGO |
| `claimRefund()` | Donors | Claim refund after 90-day expiry window |
| `requestVerifierHandoff(address)` | Verifier | Step 1 of rotation — starts the 2-day clock |
| `acceptVerifierHandoff()` | Pending verifier | Step 2 — accepts role after delay elapses |
| `emergencyReplaceVerifier(address)` | NGO only | Forcibly replace verifier after vault has expired |

### Key State

| Variable | Description |
|---|---|
| `ngo` | Address receiving released funds |
| `verifier` | Address authorized to release milestones |
| `pendingVerifier` | Proposed successor verifier (zero if none pending) |
| `targetAmount` | Total fundraising goal |
| `totalRaised` | Current total accepted donations |
| `maxContributionPerDonor` | Per-address cap (10% of targetAmount) |
| `lastUpdateTimestamp` | Timestamp of last donate or release (resets expiry) |
| `EXPIRY_WINDOW` | `90 days` — hardcoded constant |
| `HANDOFF_DELAY` | `2 days` — minimum wait before handoff acceptance |
| `contributions[address]` | Individual donor accepted contributions |
| `milestones[]` | Array of `{ amount, released, description }` |

### Events

| Event | Emitted When |
|---|---|
| `Donated(donor, amount)` | A donation is accepted |
| `MilestoneReleased(index, amount)` | Verifier releases a milestone |
| `RefundClaimed(donor, amount)` | Donor claims a refund |
| `VerifierUpdated(oldVerifier, newVerifier)` | Verifier role changes |
| `VerifierHandoffRequested(currentVerifier, proposed, unlockAt)` | Handoff requested |

### Security Notes

- Only the `verifier` address can call `releaseMilestone`
- Verifier rotation uses a two-step, 2-day time-locked handoff
- NGO can emergency-replace a lost verifier, but only after the 90-day expiry
- Refunds are only claimable after `lastUpdateTimestamp + 90 days`
- Donations exceeding the target are automatically refunded to the sender
- A single donor cannot contribute more than 10% of the target
- Milestone amounts must sum exactly to `targetAmount` at deploy time
- `contributions` mapping is zeroed before transfer in `claimRefund` (reentrancy-safe)

---

## RSK Testnet

| Property | Value |
|---|---|
| Chain ID | 31 (`0x1f`) |
| RPC URL | `https://public-node.testnet.rsk.co` |
| Explorer | [explorer.testnet.rsk.co](https://explorer.testnet.rsk.co) |
| Faucet | [faucet.rsk.co](https://faucet.rsk.co) |
| Currency | tRBTC |

MetaMask will be prompted to add this network automatically on first connect.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Yes | Deployed `DonationVault` contract address |
| `NEXT_PUBLIC_FACTORY_ADDRESS` | Yes | Deployed `DonationVaultFactory` address |
| `NEXT_PUBLIC_RSK_API_KEY` | Optional | Rootstock RPC API key for paid endpoint |

---

## Scripts

```bash
# Frontend
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint

# Smart Contract
npx hardhat test                    # Run full test suite
npx hardhat coverage                # Generate coverage report
npx hardhat deploy --network rskTestnet  # Deploy all contracts
```

---

## License

MIT