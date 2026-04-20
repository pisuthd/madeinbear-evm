# MadeInBear — A Privacy Neobank for Ethereum using Fhenix FHE

MadeInBear is a privacy-first neobank for Ethereum powered by Fhenix Fully Homomorphic Encryption (FHE). It brings full banking functionality on-chain, enabling users to supply, borrow, and manage capital across multiple financial products while keeping balances and positions confidential by default.

Users can deposit assets into structured markets to earn yield from on-chain lending, credit demand, and other capital strategies. Over time, MadeInBear expands into a broader set of markets, including structured products such as RWA-backed yield strategies and institution-grade capital pools.

Each market operates with configurable access and compliance layers, enabling use cases that require KYC credentials, permissioned participation, or regulatory alignment — all enforced on-chain through selective disclosure.

### Key Value Propositions

- **Confidential by Default**: All balances, positions, and financial activity are encrypted using Fhenix FHE
- **ERC-7984 Confidential Tokens**: Standard assets are wrapped into confidential tokens for private on-chain usage
- **Multi-Market Architecture**: Support for multiple financial products, from lending markets to RWA-backed strategies
- **Composable Compliance**: Markets can enforce KYC, access control, and regulatory requirements at the protocol level
- **On-Chain Verifiability**: Protocol logic remains transparent while sensitive user data stays encrypted

## The Problem

Current DeFi protocols expose all user positions publicly:

1. **Institutional Barriers**: Banks, funds, and regulated entities cannot participate due to lack of privacy
2. **Front-Running Risk**: Public positions are vulnerable to MEV and adversarial strategies
3. **Strategic Exposure**: Portfolio allocations and position sizes are visible to competitors
4. **Regulatory Misalignment**: KYC, AML, and compliance requirements conflict with transparent ledgers
5. **Limited Product Scope**: Most DeFi protocols focus on isolated primitives instead of full financial systems

---

## Our Solution

MadeInBear introduces a new model for on-chain finance by combining confidential computing with a market-based banking architecture:

- **Confidential Financial Positions**  
  All balances, deposits, loans, and collateral are stored and processed as encrypted values using Fhenix FHE, ensuring user financial data remains private by default

- **ERC-7984 Confidential Tokens**  
  Standard ERC20 assets are wrapped into confidential tokens, enabling private transfers, deposits, and interactions across all markets

- **Market-Based Product Design**  
  Financial products such as savings, credit, and structured yield are implemented as distinct markets, each with its own risk model, parameters, and capital flows

- **Composable Financial Products**  
  Markets can support a wide range of strategies, from on-chain lending to real-world asset (RWA) yield, enabling flexible capital allocation across different risk and return profiles

- **Permissioned and Open Access**  
  Markets can be fully permissionless or gated with requirements such as KYC credentials, allowing both retail and institutional participation within the same system

- **Morpho-Based Lending Engine**: Built on a fork of Morpho Blue, leveraging isolated markets and efficient capital matching while extending it with confidential balances and account abstraction

## Technical Architecture

### Core Contracts

#### CMorpho — Confidential Morpho Blue Lending

Built on Morpho Blue isolated market architecture, CMorpho is an FHE-encrypted lending market where all user positions are encrypted on-chain using Fhenix FHE.

**Architecture:**
```
┌─────────────────────────────────────────────────────┐
│                     CMorpho                         │
│                                                     │
│  Market (Id → MarketParams)                         │
│  ├── loanToken: CToken (FHERC20)                  │
│  ├── collateralToken: CToken (FHERC20)             │
│  ├── oracle: IOracle                                │
│  ├── irm: IIrm (Interest Rate Model)                │
│  └── lltv: uint256 (Max LTV)                       │
│                                                     │
│  Position (encrypted per user per market)           │
│  ├── supplyShares: euint128                         │
│  ├── borrowShares: euint64                          │
│  └── collateral: euint64                            │
└─────────────────────────────────────────────────────┘
```

**Token Flow:**
```
ERC20 ──[wrap]──► CToken (FHERC20) ──[supply]──► CMorpho Market
CToken (FHERC20) ◄──[withdraw/borrow]── CMorpho Market
CToken (FHERC20) ──[unwrap]──► ERC20
```

#### CToken — ERC-7984 Confidential Token

CToken wraps standard ERC20 tokens into confidential format using FHERC20:

- **Shield**: Convert ERC20 → Confidential Token
- **Unshield**: Initiate decryption claim to receive ERC20
- **Confidential Transfers**: Transfer encrypted values on-chain

```solidity
// Wrap USDT to cUSDT
CToken(0x...).wrap(erc20Amount);

// Grant CMorpho as operator
CToken(0x...).setOperator(cmorphoAddress, expirationTimestamp);

// Supply to CMorpho
CMorpho.supply(marketParams, assets, 0, userAddress, "");
```

### FHE Permission Model

After every position update, permissions are granted to:

| Entity | Access Level |
|--------|-------------|
| **Contract** (`allowThis`) | Needed for internal FHE operations |
| **Position owner** (`allow(user)`) | User can decrypt their own position |
| **Caller** (`allowSender`) | Transaction caller can read result |
| **Liquidator** (`allow(liquidator)`) | Optional: designated liquidator can read all positions |

### Smart Contract Addresses (Sepolia)

| Contract | Address |
|----------|---------|
| cMorpho | `0x86A4AC7ab176EDC7b99ba0506ca2Aa63A4F576eB` |
| Oracle | `0x3201f68B1e49a4172C643dA716ced6E78F8E9672` |
| IRM | `0xCeA7AaD606823924B5fA26b5B8dB493Fd7c7f0b9` |
| cUSDT | `0x1B86F12280F4241312DE4bd80cE2e8A5B5D06A9F` |
| cETH | `0xFFff2977Fa735b530989f1fa761E6d3fe14d352B` |

## Key Features

### Complete Privacy

- All supply, borrow, and collateral positions encrypted
- Transaction amounts hidden from public view
- No information leakage to observers

### Verifiable Operations

- On-chain proofs for all operations
- Protocol state remains auditable
- Market-level data (TVL, utilization) visible

### Isolated Markets

- Risk-isolated design (Morpho Blue)
- No contagion between markets
- Deeper liquidity per market

### ERC-7984 Confidential Tokens

- Wrap ERC20 → Confidential Token
- Transfer encrypted values
- Unwrap anytime

## How It Works

### For Lenders (Supply)

1. Wrap USDT → cUSDT at Portfolio
2. Grant CMorpho as operator on cUSDT
3. Supply cUSDT to earn yield
4. Your balance stays private with FHE
5. Unwrap anytime to withdraw

### For Borrowers

1. Wrap ETH → cETH at Portfolio
2. Grant CMorpho as operator on cETH
3. Use cETH as collateral (75% LTV)
4. Borrow USDT against your position
5. Repay to unlock collateral

## Next Wave

- Health check enforcement via liquidation
- Flash loans for efficient capital utilization
- RWA-backed yield markets

## Technology Stack

### Blockchain
- **Network**: Ethereum Sepolia
- **Encryption Layer**: Fhenix FHE for confidential computation

### Smart Contracts
- **Language**: Solidity ^0.8.25
- **FHE Library**: @fhenixprotocol/cofhe-contracts
- **Core Architecture**: Morpho Blue isolated market rewritten with FHE

### Frontend
- **Framework**: React 18 + TypeScript
- **Web3 SDK**: Wagmi + Viem
- **FHE SDK**: @cofhe/sdk
- **Styling**: Tailwind CSS

## Getting Started

```bash
# Clone repository
git clone https://github.com/pisuthd/madeinbear-evm.git
cd madeinbear

# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm test

# Start frontend
cd client
npm install
npm run dev
```

## License

MIT License. See [LICENSE](LICENSE).