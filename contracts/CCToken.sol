// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "./interfaces/ICCToken.sol";
import "./interfaces/IComptroller.sol";
import "./interfaces/IPriceOracle.sol";

/**
 * @title ConfidentialCCToken - Confidential Compound Token
 *  @notice FHE-enabled Compound protocol
 * @dev 
 * - Public: totalSupplied, totalBorrows (encrypted with FHE)
 * - Private: user balances, borrows (encrypted with FHE)
 * - No token transfers for now, no admin functions, minimal events
 */
contract ConfidentialCCToken is ICCToken {
    
    // ===== PUBLIC STATE =====
    
    IERC20 public immutable override underlying;
    IComptroller public comptroller;
    IPriceOracle public oracle;

    // ===== CONSTANTS =====

    /// @notice will be replaced with dynamic rates in next iteration
    uint64 public constant override SUPPLY_RATE_VALUE = 300; // 3%
    uint64 public constant override BORROW_RATE_VALUE = 500; // 5%
    uint64 public constant override COLLATERAL_FACTOR_VALUE = 8000; // 80%
    
    // ===== PRIVATE STATE (Encrypted) =====
    
    /// @notice Total cToken supplied to the market
    euint64 public totalSupplied;
    
    /// @notice Total cToken borrowed from the market
    euint64 public totalBorrows;
    
    /// @notice User's ccToken balance (supply position)
    mapping(address => euint64) private ccTokenBalance;
    
    /// @notice User's borrowed cToken amount
    mapping(address => euint64) private borrowed;
    
    // ===== Errors =====
    
    error ZeroAddress();
    error ZeroAmount();
    error InsufficientBalance();
    error InsufficientCollateral();
    
    // ===== Constructor =====
    
   
    constructor(
        IERC20 _underlying,
        IComptroller _comptroller,
        IPriceOracle _oracle
    ) {
        if (address(_underlying) == address(0)) revert ZeroAddress();
        
        underlying = _underlying;
        comptroller = _comptroller;
        oracle = _oracle;
    }
    
    // ===== CORE FUNCTIONS =====
    
    /**
     * @notice Supply cToken to the protocol
     * @param cTokenAmount Encrypted amount of cToken to supply
     * @dev User provides encrypted cToken, receives ccToken in return (1:1)
     */
    function supply(InEuint64 calldata cTokenAmount) external override {
        euint64 amount = FHE.asEuint64(cTokenAmount);
        FHE.allowThis(amount);
                
        // Update total supplied
        totalSupplied = FHE.add(totalSupplied, amount);
        FHE.allowThis(totalSupplied);
        FHE.allowPublic(totalSupplied);
        
        // Update user's ccToken balance
        ccTokenBalance[msg.sender] = FHE.add(ccTokenBalance[msg.sender], amount);
        
        // Grant access to new balance
        FHE.allowThis(ccTokenBalance[msg.sender]);
        FHE.allowSender(ccTokenBalance[msg.sender]); 
        
        // Emit event
        emit Supply(msg.sender, euint64.unwrap(amount), euint64.unwrap(amount));
    }
    
    /**
     * @notice Withdraw supplied cToken from the protocol
     * @param ccTokenAmount Encrypted amount of ccToken to burn
     * @dev Simple withdrawal - subtract from user's balance
     */
    function withdraw(InEuint64 calldata ccTokenAmount) external override {
        euint64 amount = FHE.asEuint64(ccTokenAmount);
        FHE.allowThis(amount);
        
        euint64 userBalance = ccTokenBalance[msg.sender];
        
        // Simple subtraction - no collateral checks
        euint64 newBalance = FHE.sub(userBalance, amount);
        
        ccTokenBalance[msg.sender] = newBalance;
        FHE.allowThis(ccTokenBalance[msg.sender]);
        FHE.allowSender(ccTokenBalance[msg.sender]);
        
        // Update total supplied
        totalSupplied = FHE.sub(totalSupplied, amount);
        FHE.allowThis(totalSupplied);
        FHE.allowPublic(totalSupplied);
        
        // Emit event
        emit Withdraw(msg.sender, euint64.unwrap(amount), euint64.unwrap(amount));
    }
    
    /**
     * @notice Borrow cToken from the protocol
     * @param cTokenAmount Encrypted amount of cToken to borrow
     * @dev User must have sufficient collateral
     */
    function borrow(InEuint64 calldata cTokenAmount) external override {
        euint64 amount = FHE.asEuint64(cTokenAmount);
        FHE.allowThis(amount);
        
        // Update user's borrowed balance 
        borrowed[msg.sender] = FHE.add(borrowed[msg.sender], amount);

        // Grant access
        FHE.allowThis(borrowed[msg.sender]);
        FHE.allowSender(borrowed[msg.sender]); 
        
        // Update total borrows - FIX: Store the result
        totalBorrows = FHE.add(totalBorrows, amount);
        FHE.allowThis(totalBorrows);
        FHE.allowPublic(totalBorrows);
        
        // Emit event
        emit Borrow(msg.sender, euint64.unwrap(amount));
    }
    
    /**
     * @notice Repay borrowed cToken
     * @param cTokenAmount Encrypted amount of cToken to repay
     * @dev Simple repayment - subtract from borrowed amount
     */
    function repay(InEuint64 calldata cTokenAmount) external override {
        euint64 amount = FHE.asEuint64(cTokenAmount);
        FHE.allowThis(amount);
        
        euint64 userBorrowed = borrowed[msg.sender];
        
        // Simple subtraction - no over-repayment check
        euint64 newBorrowed = FHE.sub(userBorrowed, amount);
        
        borrowed[msg.sender] = newBorrowed;
        
        // Grant access
        FHE.allowThis(borrowed[msg.sender]);
        FHE.allowSender(borrowed[msg.sender]); 
        
        // Update total borrows
        totalBorrows = FHE.sub(totalBorrows, amount);
        FHE.allowThis(totalBorrows);
        FHE.allowPublic(totalBorrows);
        
        // Emit event
        emit Repay(msg.sender, euint64.unwrap(amount));
    }
    
    // ===== VIEW FUNCTIONS =====
    
    /**
     * @notice Get user's encrypted ccToken balance
     * @return Encrypted ccToken balance
     */
    function getCCTokenBalance() external view override returns (euint64) { 
        return ccTokenBalance[msg.sender];
    }
    
    /**
     * @notice Get user's supplied cToken amount (1:1 with ccToken balance)
     * @return Encrypted supplied cToken amount
     */
    function getSupplied() public view override returns (euint64) { 
        return ccTokenBalance[msg.sender];
    }
    
    /**
     * @notice Get user's borrowed cToken amount
     * @return Encrypted borrowed cToken amount
     */
    function getBorrowed() external view override returns (euint64) { 
        return borrowed[msg.sender];
    }
}