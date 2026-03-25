// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

interface IComptroller {
    function isMarket(address market) external view returns (bool);
    function getAllMarkets() external view returns (address[] memory);
    function getCollateralFactor(address market) external view returns (euint128);
    function calculateHealthFactor(address user, address[] calldata markets) external returns (euint128);
    function getMarketList() external view returns (address[] memory);
}
