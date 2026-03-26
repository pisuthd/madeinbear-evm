// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@fhenixprotocol/cofhe-contracts/FHE.sol";

/**
 * @title ICCToken - Interface for Confidential Compound Token
 * @dev Interface for the confidential lending protocol token
 */
interface ICCToken {
    // ===== Public State (Plaintext) =====
    
     
    
    /// @notice Supply rate: 3% (scaled by 10000)
    function SUPPLY_RATE_VALUE() external pure returns (uint64);
    
    /// @notice Borrow rate: 5% (scaled by 10000)
    function BORROW_RATE_VALUE() external pure returns (uint64);
    
    /// @notice Collateral factor: 80% (scaled by 1e18)
    function COLLATERAL_FACTOR_VALUE() external pure returns (uint64);
    
    /// @notice The underlying cToken this CCToken represents
    function underlying() external view returns (IERC20);
    
    // ===== Core Functions =====
    
    /**
     * @notice Supply cToken to the protocol
     * @param cTokenAmount Encrypted amount of cToken to supply
     * @dev User provides encrypted cToken amount, receives ccToken in return
     */
    function supply(InEuint64 calldata cTokenAmount) external;
    
    /**
     * @notice Withdraw supplied cToken from the protocol
     * @param ccTokenAmount Encrypted amount of ccToken to burn
     * @return Encrypted amount of cToken to return to user
     * @dev Must maintain collateral ratio after withdrawal
     */
    function withdraw(InEuint64 calldata ccTokenAmount) external returns (euint64);
    
    /**
     * @notice Borrow cToken from the protocol
     * @param cTokenAmount Encrypted amount of cToken to borrow
     * @dev User must have sufficient collateral
     */
    function borrow(InEuint64 calldata cTokenAmount) external;
    
    /**
     * @notice Repay borrowed cToken
     * @param cTokenAmount Encrypted amount of cToken to repay
     */
    function repay(InEuint64 calldata cTokenAmount) external;
    
    // ===== View Functions =====
    
    /**
     * @notice Get user's encrypted ccToken balance
     * @return Encrypted ccToken balance
     */
    function getCCTokenBalance() external view returns (euint64);
    
    /**
     * @notice Get user's supplied cToken amount (calculated from ccToken balance)
     * @return Encrypted supplied cToken amount
     */
    function getSupplied() external view returns (euint64);
    
    /**
     * @notice Get user's borrowed cToken amount
     * @return Encrypted borrowed cToken amount
     */
    function getBorrowed() external view returns (euint64);
    
    // ===== Events =====
    
    event Supply(address indexed user, bytes32 cTokenHash, bytes32 ccTokenHash);
    event Withdraw(address indexed user, bytes32 ccTokenHash, bytes32 cTokenHash);
    event Borrow(address indexed user, bytes32 amountHash);
    event Repay(address indexed user, bytes32 amountHash);
}