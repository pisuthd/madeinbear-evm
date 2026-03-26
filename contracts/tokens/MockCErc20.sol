// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/**
 * @title MockCErc20
 * @notice Mock Compound CErc20 token for testing PriceOracle
 */
contract MockCErc20 {
    address public underlying;
    string public symbol;
    uint8 public decimals;

    constructor(
        address _underlying,
        string memory _symbol,
        uint8 _decimals
    ) {
        underlying = _underlying;
        symbol = _symbol;
        decimals = _decimals;
    }

    function setUnderlying(address _underlying) external {
        underlying = _underlying;
    }

    function setSymbol(string memory _symbol) external {
        symbol = _symbol;
    }

    function setDecimals(uint8 _decimals) external {
        decimals = _decimals;
    }
}

/**
 * @title MockCEth
 * @notice Mock Compound cETH token for testing PriceOracle
 */
contract MockCEth {
    string public constant symbol = "ccETH";

    // No underlying() function for native token
}