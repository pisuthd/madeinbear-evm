
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPriceOracle.sol";
import "./interfaces/ICCToken.sol";

/**
 * @title Comptroller
 * @notice Comptroller for confidential Compound protocol
 * @dev Manages markets and collateral factors (PUBLIC, plaintext only)
 */
contract Comptroller is Ownable {

    // ===== Public Storage =====

    /// @notice Price oracle
    IPriceOracle public oracle;
    
    /// @notice List of all supported markets
    ICCToken[] public markets;
    
    /// @notice Mapping to check if an address is a supported market
    mapping(ICCToken => bool) public isMarket;
    
    // ===== Errors =====

    error ZeroAddress();
    error InvalidCollateralFactor();
    error MarketAlreadySupported();
    error MarketNotSupported();

    // ===== Events =====

    /// @notice Emitted when price oracle is changed
    event NewPriceOracle(IPriceOracle oldPriceOracle, IPriceOracle newOracle);
    
    /// @notice Emitted when a new market is supported
    event MarketSupported(ICCToken indexed ccToken);

    constructor(address _oracle) Ownable(msg.sender) {
        if (_oracle == address(0)) revert ZeroAddress(); 
        
        oracle = IPriceOracle(_oracle); 
    }

    // ===== Admin Functions =====

    /**
     * @notice Update the price oracle
     * @param newOracle New oracle address
     */
    function _setPriceOracle(IPriceOracle newOracle) onlyOwner external {
        if (address(newOracle) == address(0)) revert ZeroAddress(); 

        IPriceOracle oldOracle = oracle;
        oracle = newOracle;
        emit NewPriceOracle(oldOracle, newOracle);
    }
    
    /**
     * @notice Add a new market to the protocol
     * @param ccToken The CCToken to support
     */
    function _supportMarket(ICCToken ccToken) onlyOwner external {
        if (address(ccToken) == address(0)) revert ZeroAddress(); 
        if (isMarket[ccToken]) revert MarketAlreadySupported();
        
        markets.push(ccToken);
        isMarket[ccToken] = true;
        
        emit MarketSupported(ccToken);
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
     * @notice Get a market by index
     * @param index The market index
     * @return The CCToken at that index
     */
    function getMarket(uint256 index) external view returns (ICCToken) {
        require(index < markets.length, "Invalid market index");
        return markets[index];
    }
    
 
}
