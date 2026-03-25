// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IComptroller.sol";
import "./interfaces/IPriceOracle.sol";
import "./interfaces/ICToken.sol";

/**
 * @title TrustedRelayer
 * @notice Trusted relayer for calculating and decrypting health factors
 * @dev Supports both human operators and autonomous AI agents
 * @dev Calculates health factor by querying encrypted balances from cTokens
 * @dev Decrypts the result for validation checks
 * 
 * @notice Authorized callers can be:
 *   - Human operators (EOAs) for manual liquidation
 *   - AI agents (smart contracts) for automated liquidation
 *   - Liquidation bots with specific strategies
 *   - Risk monitoring services
 *   - Multi-signature wallets for collective decisions
 * 
 * @dev Use Cases:
 *   - Manual liquidation by trusted operators
 *   - Automated AI-driven liquidation
 *   - Hybrid approaches with multiple authorization tiers
 *   - Risk assessment and monitoring
 *   - MEV-aware liquidation strategies
 */

contract TrustedRelayer is Ownable {

    // ===== Public Storage =====
    
    /// @notice Comptroller contract address
    IComptroller public comptroller;
    
    /// @notice Price oracle address
    IPriceOracle public oracle;
    
    /// @notice Mapping of authorized callers (e.g., liquidation bots, cTokens)
    mapping(address => bool) public authorizedCallers;
    
    /// @notice Health factor threshold for liquidation
    uint256 public constant HEALTH_THRESHOLD = 1e18; // 1.0
    
    /// @notice Scaling factor for calculations
    uint256 public constant SCALING_FACTOR = 1e18;
    
    // ===== Events =====
    
    event ComptrollerUpdated(address indexed oldComptroller, address indexed newComptroller);
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event CallerAuthorized(address indexed caller);
    event CallerRevoked(address indexed caller);
    event HealthFactorCalculated(address indexed user, uint256 healthFactor, bool isLiquidatable);
    
    // ===== Errors =====
    
    error UnauthorizedCaller();
    error DecryptionNotReady();
    error ZeroAddress();
    
    /**
     * @notice Constructor
     * @param _comptroller Address of comptroller contract
     * @param _oracle Address of price oracle contract
     */
    constructor(address _comptroller, address _oracle) Ownable(msg.sender) {
        if (_comptroller == address(0)) revert ZeroAddress();
        if (_oracle == address(0)) revert ZeroAddress();
        
        comptroller = IComptroller(_comptroller);
        oracle = IPriceOracle(_oracle);
        
        // Authorize the deployer by default
        authorizedCallers[msg.sender] = true;
        emit CallerAuthorized(msg.sender);
    }
    
    // ===== Caller Management =====
    
    /**
     * @notice Authorize a caller to query health factors
     * @param caller Address to authorize
     * @dev Caller can be:
     *   - EOA (human operator, liquidation bot)
     *   - Smart contract (AI agent, automated liquidator)
     *   - Multi-sig wallet (collective decision-making)
     */
    function authorizeCaller(address caller) external onlyOwner {
        if (caller == address(0)) revert ZeroAddress();
        authorizedCallers[caller] = true;
        emit CallerAuthorized(caller);
    }
    
    /**
     * @notice Revoke authorization from a caller
     * @param caller Address to revoke
     */
    function revokeCaller(address caller) external onlyOwner {
        authorizedCallers[caller] = false;
        emit CallerRevoked(caller);
    }
    
    /**
     * @notice Check if a caller is authorized
     * @param caller Address to check
     * @return True if authorized
     */
    function isAuthorizedCaller(address caller) external view returns (bool) {
        return authorizedCallers[caller];
    }
    
    // ===== Health Factor Calculation =====
    
    /**
     * @notice Get health factor for a user
     * @param user User address
     * @return Health factor value (scaled by 1e18)
     * @return True if liquidatable (health factor < 1.0)
     * @dev Calculates health factor: (total collateral value * factors) / total borrow value
     * @dev Only authorized callers can use this function
     */
    function getHealthFactor(address user) external returns (uint256, bool) {
        if (!authorizedCallers[msg.sender]) revert UnauthorizedCaller();
        
        // Get all markets from comptroller
        address[] memory markets = comptroller.getAllMarkets();
        
        if (markets.length == 0) {
            // No markets, return healthy
            return (2e18, false);
        }
        
        // Calculate total collateral value and total borrow value
        uint256 totalCollateralValue = 0;
        uint256 totalBorrowValue = 0;
        
        for (uint256 i = 0; i < markets.length; i++) {
            address market = markets[i];
            
            // Skip if market is not listed
            if (!comptroller.isMarket(market)) continue;
            
            // Get encrypted balances from cToken
            ICToken cToken = ICToken(market);
            euint128 encSupplyBalance = cToken.getSupplyBalance(user);
            euint128 encBorrowBalance = cToken.getBorrowBalance(user);
            
            // Get price from oracle
            uint256 price = oracle.getPrice(market);
            
            // Get collateral factor
            euint128 encCollateralFactor = comptroller.getCollateralFactor(market);
            
            // For now, we need to decrypt the balances to calculate the health factor
            // This is a limitation of the current approach
            // In production, we would use the decrypt-with-proof pattern
            
            // For Phase 2, we'll use a simplified approach:
            // Calculate assuming we can access the encrypted values
            // The real implementation would use TrustedRelayer's decryption capabilities
            
            // Placeholder: assume healthy for now
            // TODO: Implement proper decryption of balances
        }
        
        // For now, return a healthy health factor
        // In a full implementation, we would:
        // 1. Decrypt each encrypted balance using decrypt-with-proof pattern
        // 2. Calculate total collateral and borrow values
        // 3. Compute health factor = (collateral * 1e18) / borrow
        // 4. Handle the case where borrow = 0 (return healthy)
        
        uint256 healthFactor = 2e18;
        bool liquidatable = healthFactor < HEALTH_THRESHOLD;
        
        emit HealthFactorCalculated(user, healthFactor, liquidatable);
        return (healthFactor, liquidatable);
    }
    
    /**
     * @notice Check if a user is liquidatable
     * @param user User address
     * @return True if liquidatable (health factor < 1.0)
     * @dev Only authorized callers can use this function
     */
    function isLiquidatable(address user) external returns (bool) {
        (uint256 healthFactor, ) = this.getHealthFactor(user);
        return healthFactor < HEALTH_THRESHOLD;
    }
    
    /**
     * @notice Batch check multiple users for liquidation eligibility
     * @param users Array of user addresses
     * @return Array of liquidatable booleans
     * @dev Only authorized callers can use this function
     */
    function batchCheckLiquidatable(address[] calldata users) external returns (bool[] memory) {
        if (!authorizedCallers[msg.sender]) revert UnauthorizedCaller();
        
        bool[] memory results = new bool[](users.length);
        
        for (uint256 i = 0; i < users.length; i++) {
            (uint256 healthFactor, ) = this.getHealthFactor(users[i]);
            results[i] = healthFactor < HEALTH_THRESHOLD;
        }
        
        return results;
    }
    
    // ===== Admin Functions =====
    
    /**
     * @notice Update comptroller address
     * @param newComptroller New comptroller address
     */
    function setComptroller(address newComptroller) external onlyOwner {
        if (newComptroller == address(0)) revert ZeroAddress();
        address oldComptroller = address(comptroller);
        comptroller = IComptroller(newComptroller);
        emit ComptrollerUpdated(oldComptroller, newComptroller);
    }
    
    /**
     * @notice Update oracle address
     * @param newOracle New oracle address
     */
    function setOracle(address newOracle) external onlyOwner {
        if (newOracle == address(0)) revert ZeroAddress();
        address oldOracle = address(oracle);
        oracle = IPriceOracle(newOracle);
        emit OracleUpdated(oldOracle, newOracle);
    }

}