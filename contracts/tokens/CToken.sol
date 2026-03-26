// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { FHERC20WrappedERC20 } from "fhenix-confidential-contracts/contracts/FHERC20WrappedERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title CToken - Confidential Token Wrapper
 * @dev This contract wraps an existing ERC20 token into a confidential (FHE) token.
 * 
 * Confidential tokens provide privacy by encrypting balances and transfer amounts.
 * Only the owner of the encrypted balance can decrypt and use it.
 * 
 * Features:
 * - Wraps any ERC20 token (e.g., USDC, WBTC) into a confidential version
 * - Shield: Convert plain ERC20 tokens to encrypted confidential tokens
 * - Unshield: Convert encrypted confidential tokens back to plain ERC20 tokens
 * - All balances and transfer amounts are encrypted using FHE (Fully Homomorphic Encryption)
 * 
 * Security:
 * - Inherits from FHERC20WrappedERC20 which includes operator permissions
 * - Allowances are replaced with operator permissions for confidentiality
 * - Decrypting balances requires signature verification from the FHE network
 * 
 * Note: This is a thin wrapper around FHERC20WrappedERC20 with no additional logic.
 * Use it directly or inherit from it to add custom functionality.
 */
contract CToken is FHERC20WrappedERC20 {
    /**
     * @dev Creates a new confidential token wrapper for an existing ERC20 token
     * @param underlyingToken The ERC20 token to wrap (e.g., USDC, WBTC)
     */
    constructor(IERC20 underlyingToken)
        FHERC20WrappedERC20(underlyingToken, "")
    {}
}
