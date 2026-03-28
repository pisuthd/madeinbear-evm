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
    
    /// @notice Backend relayer used to decrypt encrypted data on behalf of users since decryptForView() is not working in React
    address public constant TRUSTED_DECRYPTOR = 0x91C65f404714Ac389b38335CccA4A876a8669d32;
    
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
        FHE.allow(ccTokenBalance[msg.sender], TRUSTED_DECRYPTOR);
        
        // Emit event
        emit Supply(msg.sender, euint64.unwrap(amount), euint64.unwrap(amount));
    }
    
    /**
     * @notice Withdraw supplied cToken from the protocol
     * @param ccTokenAmount Encrypted amount of ccToken to burn
     * @dev Must maintain collateral ratio after withdrawal (1:1)
     */
    function withdraw(InEuint64 calldata ccTokenAmount) external override {
        
        euint64 amount = FHE.asEuint64(ccTokenAmount);
        FHE.allowThis(amount);
        
        // Check: user has enough ccToken
        euint64 userBalance = ccTokenBalance[msg.sender];
        ebool sufficientBalance = FHE.gte(userBalance, amount);
        
        // Check collateral: newSupplied * COLLATERAL_FACTOR / SCALE >= userBorrowed
        euint64 supplied = getSupplied();
        euint64 userBorrowed = borrowed[msg.sender];
        
        // Calculate new supplied after withdrawal
        euint64 newSupplied = FHE.sub(supplied, amount);
        
        // Check: newSupplied * COLLATERAL_FACTOR >= userBorrowed * SCALE
        // Equivalent to: newSupplied * 0.8 >= userBorrowed
        euint64 encryptedCollateralFactor = FHE.asEuint64(COLLATERAL_FACTOR_VALUE);
        euint64 maxBorrow = FHE.div(FHE.mul(newSupplied, encryptedCollateralFactor), FHE.asEuint64(10000));
        ebool sufficientCollateral = FHE.gte(maxBorrow, userBorrowed);
        
        // Only allow withdrawal if both conditions are met
        ebool canWithdraw = FHE.and(sufficientBalance, sufficientCollateral);
        
        // Update balance if can withdraw, else revert
        euint64 newBalance = FHE.select(
            canWithdraw,
            FHE.sub(userBalance, amount),
            userBalance
        );
        
        ccTokenBalance[msg.sender] = newBalance;
        FHE.allowThis(ccTokenBalance[msg.sender]);
        FHE.allowSender(ccTokenBalance[msg.sender]);
        FHE.allow(ccTokenBalance[msg.sender], TRUSTED_DECRYPTOR);
        
        // Update total supplied
        totalSupplied = FHE.select(
            canWithdraw,
            FHE.sub(totalSupplied, amount),
            totalSupplied
        );
        FHE.allowThis(totalSupplied);
        FHE.allowPublic(totalSupplied);
        
        // Return the cToken amount (1:1)
        euint64 cTokenReturn = FHE.select(
            canWithdraw,
            amount,
            FHE.asEuint64(0)
        ); 
        
        // Emit event
        emit Withdraw(msg.sender, euint64.unwrap(amount), euint64.unwrap(cTokenReturn));

    }
    
    /**
     * @notice Borrow cToken from the protocol
     * @param cTokenAmount Encrypted amount of cToken to borrow
     * @dev User must have sufficient collateral
     */
    function borrow(InEuint64 calldata cTokenAmount) external override {
        euint64 amount = FHE.asEuint64(cTokenAmount);
        FHE.allowThis(amount);
        
        // Get user's supplied amount
        euint64 supplied = getSupplied();
        euint64 userBorrowed = borrowed[msg.sender];
        
        // Check: supplied * COLLATERAL_FACTOR >= (userBorrowed + newBorrow) * SCALE
        // SCALE is 10000, COLLATERAL_FACTOR is 8000 (80%)
        // Equivalent to: supplied * 0.8 >= userBorrowed + newBorrow
        euint64 newBorrow = FHE.add(userBorrowed, amount);
        euint64 encryptedCollateralFactor = FHE.asEuint64(COLLATERAL_FACTOR_VALUE);
        euint64 maxBorrow = FHE.div(FHE.mul(supplied, encryptedCollateralFactor), FHE.asEuint64(10000));
        ebool sufficientCollateral = FHE.gte(maxBorrow, newBorrow);
        
        // Only borrow if sufficient collateral
        euint64 newBorrowed = FHE.select(
            sufficientCollateral,
            newBorrow,
            userBorrowed
        );
        
        // Update user's borrowed balance
        borrowed[msg.sender] = newBorrowed;
        
        // Grant access
        FHE.allowThis(borrowed[msg.sender]);
        FHE.allowSender(borrowed[msg.sender]);
        FHE.allow(borrowed[msg.sender], TRUSTED_DECRYPTOR);
        
        // Update total borrows
        totalBorrows = FHE.select(
            sufficientCollateral,
            FHE.add(totalBorrows, amount),
            totalBorrows
        );
        FHE.allowThis(totalBorrows);
        FHE.allowPublic(totalBorrows);
        
        // Emit event
        emit Borrow(msg.sender, euint64.unwrap(amount));
    }
    
    /**
     * @notice Repay borrowed cToken
     * @param cTokenAmount Encrypted amount of cToken to repay
     */
    function repay(InEuint64 calldata cTokenAmount) external override { 
        
        euint64 amount = FHE.asEuint64(cTokenAmount);
        FHE.allowThis(amount);

        euint64 userBorrowed = borrowed[msg.sender];
        
        // Check: amount <= borrowed
        ebool canRepayFull = FHE.gte(userBorrowed, amount);
        
        // New borrowed balance
        euint64 newBorrowed = FHE.select(
            canRepayFull,
            FHE.sub(userBorrowed, amount),
            FHE.asEuint64(0)
        );
        
        borrowed[msg.sender] = newBorrowed;
        
        // Grant access
        FHE.allowThis(borrowed[msg.sender]);
        FHE.allowSender(borrowed[msg.sender]);
        FHE.allow(borrowed[msg.sender], TRUSTED_DECRYPTOR);
        
        // Update total borrows
        totalBorrows = FHE.select(
            canRepayFull,
            FHE.sub(totalBorrows, amount),
            totalBorrows
        );
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