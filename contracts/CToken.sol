// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { FHERC20WrappedERC20 } from "fhenix-confidential-contracts/contracts/FHERC20WrappedERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title CToken - Confidential Token Wrapper
 * @dev This contract wraps an existing ERC20 token into a confidential (FHE) token.
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
