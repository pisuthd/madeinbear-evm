// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "../tokens/MockCErc20.sol";

interface IPriceOracle {
    
     function getUnderlyingPrice(MockCErc20 cToken) external view returns (uint);

}