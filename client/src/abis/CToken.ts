export const CTokenABI = [
  {
    inputs: [
      {
        internalType: "contract IERC20",
        name: "erc20_",
        type: "address"
      },
      {
        internalType: "string",
        name: "symbolOverride_",
        type: "string"
      }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [],
    name: "AmountTooSmallForConfidentialPrecision",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidRecipient",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address"
      }
    ],
    name: "FHERC20InvalidErc20",
    type: "error"
  },
  {
    inputs: [],
    name: "LengthMismatch",
    type: "error"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256"
      }
    ],
    name: "ShieldedERC20",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint64",
        name: "value",
        type: "uint64"
      }
    ],
    name: "UnshieldedERC20",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256"
      }
    ],
    name: "ClaimedUnshieldedERC20",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "symbol",
        type: "string"
      }
    ],
    name: "SymbolUpdated",
    type: "event"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256"
      }
    ],
    name: "shield",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address"
      },
      {
        internalType: "address",
        name: "to",
        type: "address"
      },
      {
        internalType: "uint64",
        name: "amount",
        type: "uint64"
      }
    ],
    name: "unshield",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "ctHash",
        type: "bytes32"
      },
      {
        internalType: "uint64",
        name: "decryptedAmount",
        type: "uint64"
      },
      {
        internalType: "bytes",
        name: "decryptionSignature",
        type: "bytes"
      }
    ],
    name: "claimUnshielded",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "bytes32[]",
        name: "ctHashes",
        type: "bytes32[]"
      },
      {
        internalType: "uint64[]",
        name: "decryptedAmounts",
        type: "uint64[]"
      },
      {
        internalType: "bytes[]",
        name: "decryptionSignatures",
        type: "bytes[]"
      }
    ],
    name: "claimUnshieldedBatch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address"
      }
    ],
    name: "getUserClaims",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "to",
            type: "address"
          },
          {
            internalType: "bytes32",
            name: "ctHash",
            type: "bytes32"
          },
          {
            internalType: "uint64",
            name: "requestedAmount",
            type: "uint64"
          },
          {
            internalType: "uint64",
            name: "decryptedAmount",
            type: "uint64"
          },
          {
            internalType: "bool",
            name: "claimed",
            type: "bool"
          }
        ],
        internalType: "struct FHERC20WrapperClaimHelper.Claim[]",
        name: "",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "ctHash",
        type: "bytes32"
      }
    ],
    name: "getClaim",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "to",
            type: "address"
          },
          {
            internalType: "bytes32",
            name: "ctHash",
            type: "bytes32"
          },
          {
            internalType: "uint64",
            name: "requestedAmount",
            type: "uint64"
          },
          {
            internalType: "uint64",
            name: "decryptedAmount",
            type: "uint64"
          },
          {
            internalType: "bool",
            name: "claimed",
            type: "bool"
          }
        ],
        internalType: "struct FHERC20WrapperClaimHelper.Claim",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "erc20",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "isFherc20",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address"
      }
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address"
      }
    ],
    name: "balanceOfIsIndicator",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "indicatorTick",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const;