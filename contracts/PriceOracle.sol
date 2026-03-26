// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/access/Ownable.sol";

interface CCToken {
    function symbol() external view returns (string memory);
    function underlying() external view returns (address);
    function decimals() external view returns (uint8);
}

/**
 * @title PriceOracle
 * @notice A Compound V2-compatible price oracle for FHE-enabled Compound protocol
 *      - Fallback mode (default): allows admins to manually set fallback prices for testing 
 *      - Oracle mode: TBD
 * @dev Prices are normalized to account for underlying token decimals:
 *      - For 18-decimal tokens: price = USD_price * 1e18
 *      - For 6-decimal tokens:  price = USD_price * 1e30 (1e18 * 1e12 decimal adjustment)
 *      - For 8-decimal tokens:  price = USD_price * 1e28 (1e18 * 1e10 decimal adjustment)
 */

 contract PriceOracle is Ownable {
    
    // Oracle mode per token: 0=fallback, ...
    mapping(address => uint8) public oracleMode;
    mapping(address => uint256) public fallbackPrices;
 
    mapping(address => bool) public whitelist;
 
    uint256 public constant MIN_PRICE = 1e6;    // $0.000001
    uint256 public constant MAX_PRICE = 1e24;   // $1,000,000

    event PricePosted(address asset, uint previousPriceMantissa, uint requestedPriceMantissa, uint newPriceMantissa); 
    event OracleModeSet(address token, uint8 mode); 

    modifier isWhitelisted() {
        require(whitelist[msg.sender], "Not whitelisted");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        whitelist[msg.sender] = true;
    }

    function _getUnderlyingAddress(CCToken cToken) private view returns (address) {
        address asset;
        if (compareStrings(cToken.symbol(), "ccETH")) {
            asset = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
        } else {
            asset = address(CCToken(address(cToken)).underlying());
        }
        return asset;
    }
    
    function getUnderlyingPrice(CCToken cToken) public view returns (uint) {
        address underlying = _getUnderlyingAddress(cToken);
        uint8 underlyingDecimals = _getUnderlyingDecimals(underlying);

        uint256 basePrice = fallbackPrices[underlying];
 
        // Apply decimal adjustment for Compound V2 compatibility
        uint256 decimalAdjustment = _getDecimalAdjustment(underlyingDecimals);
        
        // Avoid overflow by checking if we need to divide instead of multiply
        if (decimalAdjustment > 1e18) {
            return basePrice * (decimalAdjustment / 1e18);
        } else {
            return basePrice * decimalAdjustment / 1e18;
        }
    }

    function setDirectPrice(address asset, uint price) public isWhitelisted { 
        // automatically enable fallback mode if not set
        if (fallbackPrices[asset] == 0) {
            oracleMode[asset] = 0; // fallback mode
        }
        require(oracleMode[asset] == 0, "only fallback mode"); 
        require(price > 0, "price must be positive");
        require(price >= MIN_PRICE && price <= MAX_PRICE, 
            "price out of global bounds");

        emit PricePosted(asset, fallbackPrices[asset], price, price);
        fallbackPrices[asset] = price; 
    }

    function getPriceInfo(CCToken cToken) external view returns (
        address underlying,
        uint8 decimals,
        uint256 basePrice,
        uint256 finalPrice,
        uint256 decimalAdjustment
    ) {
        underlying = _getUnderlyingAddress(cToken);
        decimals = _getUnderlyingDecimals(underlying);
         
        basePrice = fallbackPrices[underlying]; 
        
        decimalAdjustment = _getDecimalAdjustment(decimals);
        finalPrice = getUnderlyingPrice(cToken);
    }

    function _getUnderlyingDecimals(address underlying) private view returns (uint8) { 
        if (underlying == 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE) {
            return 18;
        }
        
        return CCToken(underlying).decimals();
    }   

    function _getDecimalAdjustment(uint8 tokenDecimals) private pure returns (uint256) {
        if (tokenDecimals >= 18) {
            return 1e18;
        }
        
        // For tokens with < 18 decimals, multiply by additional factor
        // This ensures borrowBalance * price calculation works correctly
        uint8 decimalDifference = 18 - tokenDecimals;
        return 1e18 * (10 ** decimalDifference);
    }

    function compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }

    // Whitelist management functions

    /**
     * @notice Add address to whitelist for setDirectPrice function
     * @param user The address to add to whitelist
     */
    function addToWhitelist(address user) external onlyOwner {
        require(user != address(0), "Cannot whitelist zero address");
        whitelist[user] = true; 
    }

    /**
     * @notice Remove address from whitelist
     * @param user The address to remove from whitelist
     */
    function removeFromWhitelist(address user) external onlyOwner {
        whitelist[user] = false; 
    }
}