# DonationVault — Transparent NGO Funding on RSK Testnet

> Milestone-based smart contract donations with on-chain accountability. Every release is verifiable. Every refund is automatic.

---

## Demo

<!-- Add your demo video below. Replace the placeholder with your actual video embed or link. -->

### Video Walkthrough

https://www.youtube.com/watch?v=YOUR_VIDEO_ID

<!-- 
  OPTIONS TO EMBED YOUR VIDEO:
  
  1. YouTube embed (paste into GitHub markdown):
     [![DonationVault Demo](https://img.youtube.com/vi/YOUR_VIDEO_ID/maxresdefault.jpg)](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)

  2. Loom:
     [![Watch the demo](https://cdn.loom.com/sessions/thumbnails/YOUR_LOOM_ID-with-play.gif)](https://www.loom.com/share/YOUR_LOOM_ID)

  3. Local video file (if repo hosts it):
     <video src="./demo.mp4" controls width="100%" />

  4. GitHub hosted MP4 (upload to releases and paste the raw link):
     https://github.com/YOUR_USERNAME/YOUR_REPO/releases/download/v1.0/demo.mp4
-->

---

## What Is This?

DonationVault is a Next.js frontend for a Solidity smart contract that lets donors send tRBTC to an NGO through a milestone-gated vault. A trusted verifier approves each milestone and releases funds incrementally. If the vault goes 90 days without activity, donors can claim full refunds.

**Core flow:**

1. Donors send tRBTC → funds are locked in the vault contract
2. Verifier reviews real-world progress → releases a milestone → funds go to NGO
3. If nothing happens for 90 days → any donor can claim their proportional refund

---

## Features

- Connect MetaMask and auto-switch to RSK Testnet
- View vault description, NGO address, verifier address
- Live funding progress bar (raised vs. target)
- Donate with quick-fill amount buttons
- Milestone list — verifier sees release buttons, donors see status
- Refund panel with live countdown to expiry
- Every submitted transaction links to RSK Testnet Explorer
- Wrong network detection with one-click switch
- Deploy new vaults directly from the browser (`/deploy` page)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Web3 | ethers.js v6 |
| Wallet | MetaMask |
| Network | RSK Testnet (Chain ID: 31) |
| Contract | Solidity ^0.8.20 |

---

## Project Structure

```
donation-vault/
├── app/
│   ├── globals.css          # Tailwind v4 @theme config + animations
│   ├── layout.tsx           # Root layout, WalletProvider
│   ├── page.tsx             # Main vault dashboard
│   └── deploy/
│       └── page.tsx         # Deploy a new vault from the browser
│
├── components/
│   ├── Header.tsx           # Sticky nav, wallet status
│   ├── StatsBar.tsx         # Progress bar, raised/target/contribution
│   ├── DonatePanel.tsx      # Donate form with quick-fill buttons
│   ├── RefundPanel.tsx      # Refund with live expiry countdown
│   ├── MilestoneList.tsx    # Milestone cards + verifier release
│   ├── NetworkBanner.tsx    # Wrong network warning + switch button
│   ├── TxLink.tsx           # Tx hash → RSK Explorer
│   └── Toast.tsx            # Success / error / info toasts
│
├── hooks/
│   ├── useWallet.tsx        # Wallet context: connect, chain, account
│   └── useVault.ts          # All contract reads + writes
│
└── lib/
    ├── contract.ts          # ABI + RSK Testnet chain config
    ├── wallet.ts            # connectWallet helper
    └── types.d.ts           # window.ethereum type declaration
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MetaMask browser extension
- tRBTC from the [RSK Testnet Faucet](https://faucet.rsk.co)

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/donation-vault.git
cd donation-vault
npm install
```

### 2. Deploy the contract

Either use the `/deploy` page in the app (easiest), or deploy manually with Hardhat/Remix and copy the contract address.

**Constructor parameters:**

| Parameter | Type | Description |
|---|---|---|
| `_ngo` | `address` | Wallet that receives released milestone funds |
| `_verifier` | `address` | Wallet authorized to release milestones |
| `_description` | `string` | Human-readable vault purpose |
| `_targetAmount` | `uint256` | Total funding goal in wei |
| `_milestoneAmounts` | `uint256[]` | Array of per-milestone release amounts in wei |
| `_milestoneDescriptions` | `string[]` | Array of milestone descriptions |

### 3. Set environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Smart Contract

### Key Functions

| Function | Who | Description |
|---|---|---|
| `donate()` | Anyone | Send tRBTC to the vault (payable) |
| `releaseMilestone(uint256 index)` | Verifier only | Release a milestone's funds to the NGO |
| `claimRefund()` | Donors | Claim refund after 90-day expiry window |

### Key State

| Variable | Description |
|---|---|
| `ngo` | Address receiving released funds |
| `verifier` | Address authorized to release milestones |
| `targetAmount` | Total fundraising goal |
| `totalRaised` | Current total donations |
| `lastUpdateTimestamp` | Timestamp of last donate or release (resets expiry) |
| `EXPIRY_WINDOW` | `90 days` — hardcoded constant |
| `contributions[address]` | Individual donor contributions |
| `milestones[]` | Array of `{ amount, released, description }` |

### Events

| Event | Emitted When |
|---|---|
| `Donated(donor, amount)` | A donation is made |
| `MilestoneReleased(index, amount)` | Verifier releases a milestone |
| `RefundClaimed(donor, amount)` | Donor claims a refund |

### Security Notes

- Only the `verifier` address can call `releaseMilestone`
- Refunds are only claimable after `lastUpdateTimestamp + 90 days`
- The vault blocks donations once `totalRaised >= targetAmount`
- Contributions mapping is zeroed before transfer (reentrancy-safe pattern)

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

---

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
```

---

## License

MIT