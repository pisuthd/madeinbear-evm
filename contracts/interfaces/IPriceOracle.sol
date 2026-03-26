// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./ICCToken.sol";

interface IPriceOracle {
    
     function getUnderlyingPrice(ICCToken ccToken) external view returns (uint);

}