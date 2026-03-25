// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/**
 * @title PriceOracle
 * @notice Simple price oracle for FHE-enabled Compound protocol
 * @dev Returns plaintext prices to maintain market transparency
 * @dev Prices are returned with 18 decimals
 */

 contract PriceOracle {
    address public admin;
    mapping(address => uint256) public prices;
    
    event PriceUpdated(address indexed token, uint256 oldPrice, uint256 newPrice);
    event AdminUpdated(address indexed oldAdmin, address indexed newAdmin);
    
    /**
     * @notice Constructor
     * @param _admin Admin address that can update prices
     */
    constructor(address _admin) {
        admin = _admin;
    }
    
    /**
     * @notice Get price for a token
     * @param token Token address
     * @return Price in USD with 18 decimals
     */
    function getPrice(address token) external view returns (uint256) {
        uint256 price = prices[token];
        require(price > 0, "Price not set for token");
        return price;
    }
    
    /**
     * @notice Update price for a token (admin only)
     * @param token Token address
     * @param newPrice New price in USD with 18 decimals
     */
    function setPrice(address token, uint256 newPrice) external {
        require(msg.sender == admin, "Only admin can set price");
        require(newPrice > 0, "Price must be positive");
        
        uint256 oldPrice = prices[token];
        prices[token] = newPrice;
        
        emit PriceUpdated(token, oldPrice, newPrice);
    }
    
    /**
     * @notice Batch update prices (admin only)
     * @param tokens Array of token addresses
     * @param newPrices Array of new prices
     */
    function setPrices(address[] calldata tokens, uint256[] calldata newPrices) external {
        require(msg.sender == admin, "Only admin can set prices");
        require(tokens.length == newPrices.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < tokens.length; i++) {
            require(newPrices[i] > 0, "Price must be positive");
            uint256 oldPrice = prices[tokens[i]];
            prices[tokens[i]] = newPrices[i];
            emit PriceUpdated(tokens[i], oldPrice, newPrices[i]);
        }
    }
    
    /**
     * @notice Update admin address
     * @param newAdmin New admin address
     */
    function setAdmin(address newAdmin) external {
        require(msg.sender == admin, "Only admin can update");
        require(newAdmin != address(0), "Invalid admin address");
        
        address oldAdmin = admin;
        admin = newAdmin;
        
        emit AdminUpdated(oldAdmin, newAdmin);
    }
}