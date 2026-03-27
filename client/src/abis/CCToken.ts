export const CCTokenABI = [
  {
    inputs: [
      {
        internalType: "contract IERC20",
        name: "_underlying",
        type: "address"
      },
      {
        internalType: "contract IComptroller",
        name: "_comptroller",
        type: "address"
      },
      {
        internalType: "contract IPriceOracle",
        name: "_oracle",
        type: "address"
      }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [],
    name: "BORROW_RATE_VALUE",
    outputs: [
      {
        internalType: "uint64",
        name: "",
        type: "uint64"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "COLLATERAL_FACTOR_VALUE",
    outputs: [
      {
        internalType: "uint64",
        name: "",
        type: "uint64"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "SUPPLY_RATE_VALUE",
    outputs: [
      {
        internalType: "uint64",
        name: "",
        type: "uint64"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "ctHash",
            type: "uint256"
          },
          {
            internalType: "uint8",
            name: "securityZone",
            type: "uint8"
          },
          {
            internalType: "uint8",
            name: "utype",
            type: "uint8"
          },
          {
            internalType: "bytes",
            name: "signature",
            type: "bytes"
          }
        ],
        internalType: "struct InEuint64",
        name: "cTokenAmount",
        type: "tuple"
      }
    ],
    name: "borrow",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "comptroller",
    outputs: [
      {
        internalType: "contract IComptroller",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getBorrowed",
    outputs: [
      {
        internalType: "euint64",
        name: "",
        type: "bytes32"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getCCTokenBalance",
    outputs: [
      {
        internalType: "euint64",
        name: "",
        type: "bytes32"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getSupplied",
    outputs: [
      {
        internalType: "euint64",
        name: "",
        type: "bytes32"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "oracle",
    outputs: [
      {
        internalType: "contract IPriceOracle",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "ctHash",
            type: "uint256"
          },
          {
            internalType: "uint8",
            name: "securityZone",
            type: "uint8"
          },
          {
            internalType: "uint8",
            name: "utype",
            type: "uint8"
          },
          {
            internalType: "bytes",
            name: "signature",
            type: "bytes"
          }
        ],
        internalType: "struct InEuint64",
        name: "cTokenAmount",
        type: "tuple"
      }
    ],
    name: "repay",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "ctHash",
            type: "uint256"
          },
          {
            internalType: "uint8",
            name: "securityZone",
            type: "uint8"
          },
          {
            internalType: "uint8",
            name: "utype",
            type: "uint8"
          },
          {
            internalType: "bytes",
            name: "signature",
            type: "bytes"
          }
        ],
        internalType: "struct InEuint64",
        name: "cTokenAmount",
        type: "tuple"
      }
    ],
    name: "supply",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "totalBorrows",
    outputs: [
      {
        internalType: "euint64",
        name: "",
        type: "bytes32"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalSupplied",
    outputs: [
      {
        internalType: "euint64",
        name: "",
        type: "bytes32"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "underlying",
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
    inputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "ctHash",
            type: "uint256"
          },
          {
            internalType: "uint8",
            name: "securityZone",
            type: "uint8"
          },
          {
            internalType: "uint8",
            name: "utype",
            type: "uint8"
          },
          {
            internalType: "bytes",
            name: "signature",
            type: "bytes"
          }
        ],
        internalType: "struct InEuint64",
        name: "ccTokenAmount",
        type: "tuple"
      }
    ],
    name: "withdraw",
    outputs: [
      {
        internalType: "euint64",
        name: "",
        type: "bytes32"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;