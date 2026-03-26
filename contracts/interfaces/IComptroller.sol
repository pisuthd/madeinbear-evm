// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

interface IComptroller {
    function isMarket(address market) external view returns (bool);
    function getAllMarkets() external view returns (address[] memory); 
    function calculateHealthFactor(address user, address[] calldata markets) external returns (euint128);
    function getMarketList() external view returns (address[] memory);
    
    /**
     * @notice Determine the current account liquidity wrt collateral requirements
     * @return error Error code (0 = no error)
     * @return liquidity Account liquidity in excess of collateral requirements (encrypted)
     * @return shortfall Account shortfall below collateral requirements (encrypted)
     * @dev Not view because FHE.allowSender modifies state for permission granting
     */
    function getAccountLiquidity(address account) external returns (uint error, euint128 liquidity, euint128 shortfall);
}
