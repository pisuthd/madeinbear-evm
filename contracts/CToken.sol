// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import { IERC20 } from "@openzeppelin/contracts/interfaces/IERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/interfaces/IERC20Metadata.sol";
import { FHERC20 } from "fhenix-confidential-contracts/contracts/FHERC20/FHERC20.sol";
import { FHERC20ERC20Wrapper } from "fhenix-confidential-contracts/contracts/FHERC20/extensions/FHERC20ERC20Wrapper.sol";

/**
 * @title CToken - Confidential Token Wrapper
 * @dev This contract wraps an existing ERC20 token into a confidential (FHE) token.
 */
contract CToken is FHERC20ERC20Wrapper {
    /**
     * @dev Creates a new confidential token wrapper for an existing ERC20 token
     * @param underlyingToken The ERC20 token to wrap (e.g., USDC, WBTC)
     */
    constructor(
        IERC20 underlyingToken,
        string memory name_,
        string memory symbol_,
        string memory contractURI_
    )
        FHERC20(
            name_,
            symbol_,
            _cappedDecimals(underlyingToken),
            contractURI_
        )
        FHERC20ERC20Wrapper(underlyingToken)
    {}

    /**
     * @dev Caps decimals to a maximum of 6 to maintain confidential precision
     */
    function _cappedDecimals(IERC20 token) private view returns (uint8) {
        (bool ok, bytes memory data) = address(token).staticcall(
            abi.encodeCall(IERC20Metadata.decimals, ())
        );
        uint8 d = (ok && data.length == 32) ? abi.decode(data, (uint8)) : 18;
        uint8 max = _maxDecimals();
        return d > max ? max : d;
    }
}
