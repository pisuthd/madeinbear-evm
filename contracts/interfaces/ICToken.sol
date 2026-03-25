// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

interface ICToken {
    function getSupplyBalance(address user) external view returns (euint128);
    function getBorrowBalance(address user) external view returns (euint128);
}