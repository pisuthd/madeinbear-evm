// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ICCToken.sol";

/**
 * @title Comptroller
 * @notice Minimal Comptroller for confidential Compound protocol
 * @dev Manages markets only
 */
contract Comptroller is Ownable {

    // ===== Public Storage =====

    /// @notice List of all supported markets
    ICCToken[] public markets;
    
    /// @notice Mapping to check if an address is a supported market
    mapping(address => bool) public isMarket;
    
    // ===== Errors =====

    error ZeroAddress();
    error MarketAlreadySupported();

    // ===== Events =====

    /// @notice Emitted when a new market is supported
    event MarketSupported(address indexed ccToken);

    constructor() Ownable(msg.sender) {}

    // ===== Admin Functions =====
    
    /**
     * @notice Add a new market to the protocol
     * @param ccToken The CCToken to support
     */
    function _supportMarket(ICCToken ccToken) onlyOwner external {
        address ccTokenAddr = address(ccToken);
        if (ccTokenAddr == address(0)) revert ZeroAddress(); 
        if (isMarket[ccTokenAddr]) revert MarketAlreadySupported();
        
        markets.push(ccToken);
        isMarket[ccTokenAddr] = true;
        
        emit MarketSupported(ccTokenAddr);
    }
    
    // ===== View Functions =====
    
    /**
     * @notice Get the number of supported markets
     * @return Number of markets
     */
    function getMarketCount() external view returns (uint256) {
        return markets.length;
    }
    
    /**
     * @notice Get all supported markets as address array
     * @return Array of market addresses
     */
    function getAllMarkets() external view returns (address[] memory) {
        address[] memory marketAddresses = new address[](markets.length);
        for (uint256 i = 0; i < markets.length; i++) {
            marketAddresses[i] = address(markets[i]);
        }
        return marketAddresses;
    }
    
    /**
     * @notice Get list of all markets (alias for getAllMarkets)
     * @return Array of market addresses
     */
    function getMarketList() external view returns (address[] memory) {
        address[] memory marketAddresses = new address[](markets.length);
        for (uint256 i = 0; i < markets.length; i++) {
            marketAddresses[i] = address(markets[i]);
        }
        return marketAddresses;
    }
    
    /**
     * @notice Get a market by index
     * @param index The market index
     * @return The CCToken address at that index
     */
    function getMarket(uint256 index) external view returns (address) {
        require(index < markets.length, "Invalid market index");
        return address(markets[index]);
    }
}