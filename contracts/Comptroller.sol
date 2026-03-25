// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPriceOracle.sol";
import "./interfaces/ICToken.sol";

/**
 * @title Comptroller
 * @notice FHE-enabled comptroller for Compound protocol risk management
 * @dev Manages markets, collateral factors (PUBLIC), and market parameters
 */

 contract Comptroller is Ownable {

    // ===== Public Storage =====
    
    /// @notice List of all markets
    address[] public markets;
    
    /// @notice Mapping of market to bool (is market supported)
    mapping(address => bool) public isMarket;
    
    /// @notice Price oracle address
    IPriceOracle public oracle;
    
    /// @notice Trusted relayer address
    address public trustedRelayer;
    
    /// @notice Close factor (percentage of borrow that can be liquidated)
    uint256 public closeFactor = 0.5e18; // 50%
    
    /// @notice Liquidation incentive
    uint256 public liquidationIncentive = 1.08e18; // 8%
    
    /// @notice Health factor threshold (below this means liquidatable)
    uint256 public constant HEALTH_FACTOR_THRESHOLD = 1e18; // 1.0
    
    /// @notice Scaling factor for calculations
    uint256 public constant SCALING_FACTOR = 1e18;
    
    // ===== Collateral Factors (PUBLIC - market parameters, not user data) =====
    
    /// @notice Collateral factor per market (percentage of supply that counts as collateral)
    mapping(address => uint256) public collateralFactors;
    
    // ===== Events =====
    
    event MarketListed(address market);
    event MarketDelisted(address market);
    event CollateralFactorUpdated(address market, uint256 oldFactor, uint256 newFactor);
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event TrustedRelayerUpdated(address indexed oldRelayer, address indexed newRelayer);
    event CloseFactorUpdated(uint256 oldFactor, uint256 newFactor);
    event LiquidationIncentiveUpdated(uint256 oldIncentive, uint256 newIncentive);
    
    // ===== Errors =====
    
    error MarketNotListed();
    error MarketAlreadyListed();
    error InvalidFactor();
    error ZeroAddress();
    
    // ===== Modifiers =====
    
    modifier onlyListedMarket(address market) {
        if (!isMarket[market]) revert MarketNotListed();
        _;
    }
    
    /**
     * @notice Constructor
     * @param _oracle Address of price oracle
     * @param _trustedRelayer Address of trusted relayer
     */
    constructor(address _oracle, address _trustedRelayer) Ownable(msg.sender) {
        if (_oracle == address(0)) revert ZeroAddress();
        if (_trustedRelayer == address(0)) revert ZeroAddress();
        
        oracle = IPriceOracle(_oracle);
        trustedRelayer = _trustedRelayer;
    }
    
    // ===== Market Management =====
    
    /**
     * @notice Add a new market
     * @param market Address of cToken market
     */
    function supportMarket(address market) external onlyOwner {
        if (market == address(0)) revert ZeroAddress();
        if (isMarket[market]) revert MarketAlreadyListed();
        
        isMarket[market] = true;
        markets.push(market);
        
        // Set default collateral factor (80%)
        collateralFactors[market] = 0.8e18;
        
        emit MarketListed(market);
    }
    
    /**
     * @notice Remove a market
     * @param market Address of cToken market
     */
    function delistMarket(address market) external onlyOwner {
        if (!isMarket[market]) revert MarketNotListed();
        
        isMarket[market] = false;
        
        // Remove from array
        for (uint256 i = 0; i < markets.length; i++) {
            if (markets[i] == market) {
                markets[i] = markets[markets.length - 1];
                markets.pop();
                break;
            }
        }
        
        emit MarketDelisted(market);
    }
    
    /**
     * @notice Get all markets
     * @return Array of market addresses
     */
    function getAllMarkets() external view returns (address[] memory) {
        return markets;
    }
    
    /**
     * @notice Get number of markets
     * @return Number of markets
     */
    function getMarketCount() external view returns (uint256) {
        return markets.length;
    }
    
    // ===== Collateral Factor Management =====
    
    /**
     * @notice Get collateral factor for a market
     * @param market Address of cToken market
     * @return Collateral factor (scaled by 1e18)
     */
    function getCollateralFactor(address market) external view onlyListedMarket(market) returns (uint256) {
        return collateralFactors[market];
    }
    
    /**
     * @notice Set collateral factor for a market
     * @param market Address of cToken market
     * @param newFactor New collateral factor (scaled by 1e18, must be <= 1e18)
     */
    function setCollateralFactor(address market, uint256 newFactor) external onlyOwner onlyListedMarket(market) {
        if (newFactor == 0 || newFactor > 1e18) revert InvalidFactor();
        
        uint256 oldFactor = collateralFactors[market];
        collateralFactors[market] = newFactor;
        
        emit CollateralFactorUpdated(market, oldFactor, newFactor);
    }
    
    // ===== Market Info =====
    
    /**
     * @notice Get market info
     * @param market Address of cToken market
     * @return isListed Whether market is listed
     * @return factor Collateral factor
     */
    function getMarketInfo(address market) external view returns (bool isListed, uint256 factor) {
        return (isMarket[market], collateralFactors[market]);
    }
    
    // ===== Admin Functions =====
    
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
    
    /**
     * @notice Update trusted relayer address
     * @param newRelayer New trusted relayer address
     */
    function setTrustedRelayer(address newRelayer) external onlyOwner {
        if (newRelayer == address(0)) revert ZeroAddress();
        address oldRelayer = trustedRelayer;
        trustedRelayer = newRelayer;
        emit TrustedRelayerUpdated(oldRelayer, newRelayer);
    }
    
    /**
     * @notice Update close factor
     * @param newCloseFactor New close factor (scaled by 1e18)
     */
    function setCloseFactor(uint256 newCloseFactor) external onlyOwner {
        if (newCloseFactor == 0 || newCloseFactor > 1e18) revert InvalidFactor();
        uint256 oldFactor = closeFactor;
        closeFactor = newCloseFactor;
        emit CloseFactorUpdated(oldFactor, newCloseFactor);
    }
    
    /**
     * @notice Update liquidation incentive
     * @param newLiquidationIncentive New liquidation incentive (scaled by 1e18)
     */
    function setLiquidationIncentive(uint256 newLiquidationIncentive) external onlyOwner {
        require(newLiquidationIncentive >= 1e18, "Incentive must be >= 1e18");
        uint256 oldIncentive = liquidationIncentive;
        liquidationIncentive = newLiquidationIncentive;
        emit LiquidationIncentiveUpdated(oldIncentive, newLiquidationIncentive);
    }
    
    // ===== Account Liquidity =====
    
    /**
     * @notice Determine the current account liquidity wrt collateral requirements
     * @param account User address to check
     * @return error Error code (0 = no error)
     * @return liquidity Account liquidity in excess of collateral requirements (encrypted)
     * @return shortfall Account shortfall below collateral requirements (encrypted)
     * @dev Calculates total collateral value across all markets and subtracts total borrow value
     * @dev Not view because FHE.allowSender modifies state for permission granting
     */
    function getAccountLiquidity(address account) external returns (uint error, euint128 liquidity, euint128 shortfall) {
        euint128 totalCollateralValue = FHE.asEuint128(0);
        euint128 totalBorrowValue = FHE.asEuint128(0);
        
        for (uint256 i = 0; i < markets.length; i++) {
            address market = markets[i];
            if (!isMarket[market]) continue;
            
            ICToken cToken = ICToken(market);
            
            // Get encrypted balances from cToken
            euint128 supplyBalance = cToken.getSupplyBalance(account);
            euint128 borrowBalance = cToken.getBorrowBalance(account);
            
            // Get price from oracle (public value)
            uint256 price = oracle.getPrice(market);
            euint128 encPrice = FHE.asEuint128(price);
            
            // Get collateral factor (public value)
            uint256 collateralFactor = collateralFactors[market];
            euint128 encCollateralFactor = FHE.asEuint128(collateralFactor);
            
            // Calculate collateral value: supply * price * collateralFactor
            euint128 collateralValue = FHE.mul(
                FHE.mul(supplyBalance, encPrice),
                encCollateralFactor
            );
            // Scale back by 1e36 (1e18 from price, 1e18 from collateralFactor)
            collateralValue = FHE.div(collateralValue, FHE.asEuint128(1e36));
            
            // Calculate borrow value: borrow * price
            euint128 borrowValue = FHE.mul(borrowBalance, encPrice);
            
            // Accumulate totals
            totalCollateralValue = FHE.add(totalCollateralValue, collateralValue);
            totalBorrowValue = FHE.add(totalBorrowValue, borrowValue);
        }
        
        // Calculate liquidity and shortfall using encrypted comparisons
        // If collateral >= borrow: liquidity = collateral - borrow, shortfall = 0
        // If borrow > collateral: liquidity = 0, shortfall = borrow - collateral
        
        euint128 zero = FHE.asEuint128(0);
        ebool hasCollateralMore = FHE.gte(totalCollateralValue, totalBorrowValue);
        
        liquidity = FHE.select(
            hasCollateralMore,
            FHE.sub(totalCollateralValue, totalBorrowValue),
            zero
        );
        
        shortfall = FHE.select(
            hasCollateralMore,
            zero,
            FHE.sub(totalBorrowValue, totalCollateralValue)
        );
        
        // Grant access to caller so they can decrypt with decryptForView
        FHE.allowSender(liquidity);
        FHE.allowSender(shortfall);
        
        return (0, liquidity, shortfall);
    }

}
