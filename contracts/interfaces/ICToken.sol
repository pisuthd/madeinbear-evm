// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

interface ICToken {
    function getSupplyBalance(address user) external view returns (euint128);
    function getBorrowBalance(address user) external view returns (euint128);
    
    /**
     * @notice Get account snapshot with encrypted balances
     * @param user User address
     * @return error Error code (0 = no error)
     * @return cTokenBalance User's cToken balance (encrypted)
     * @return borrowBalance User's borrow balance (encrypted)
     * @return exchangeRate Current exchange rate (public)
     */
    function getAccountSnapshot(address user) 
        external view 
        returns (uint error, euint128 cTokenBalance, euint128 borrowBalance, uint256 exchangeRate);
    
    /**
     * @notice Get user liquidity for this specific market
     * @param user User address
     * @return liquidity Available liquidity (encrypted)
     * @return shortfall Shortfall amount if liquidatable (encrypted)
     */
    function getLiquidity(address user) 
        external view 
        returns (euint128 liquidity, euint128 shortfall);
}
