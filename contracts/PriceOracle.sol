// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.25;

import {IOracle} from "./interfaces/IOracle.sol";

/// @title PriceOracle
/// @notice An admin-settable price oracle for Morpho-based lending.
///         Each instance is bound to one collateral/loan pair at construction.
///         Prices are set in USD (scaled by 1e18) and converted internally to Morpho's expected format.
contract PriceOracle is IOracle {
    address public immutable LOAN_TOKEN;
    address public immutable COLLATERAL_TOKEN;
    uint8 public immutable LOAN_TOKEN_DECIMALS;
    uint8 public immutable COLLATERAL_TOKEN_DECIMALS;

    address public owner;
    uint256 public collateralUsdPrice; // USD price of 1 collateral token, scaled by 1e18
    uint256 public loanUsdPrice; // USD price of 1 loan token, scaled by 1e18
    uint256 public lastPriceUpdateTime;
 
    uint256 public constant PRICE_UPDATE_DELAY = 1 hours;

    mapping(address => bool) public whitelist;

    event PriceUpdated(uint256 collateralUsdPrice, uint256 loanUsdPrice);
    event WhitelistUpdated(address indexed user, bool whitelisted);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    error NotWhitelisted();
    error NotOwner();
    error ZeroPrice();
    error UpdateTooFrequent();
    error PriceDeviationTooHigh();

    constructor(
        address loanToken,
        address collateralToken,
        uint256 initialCollateralUsdPrice,
        uint256 initialLoanUsdPrice,
        uint8 loanTokenDecimals,
        uint8 collateralTokenDecimals
    ) {
        owner = msg.sender;
        whitelist[msg.sender] = true;
        LOAN_TOKEN = loanToken;
        COLLATERAL_TOKEN = collateralToken;
        LOAN_TOKEN_DECIMALS = loanTokenDecimals;
        COLLATERAL_TOKEN_DECIMALS = collateralTokenDecimals;
        collateralUsdPrice = initialCollateralUsdPrice;
        loanUsdPrice = initialLoanUsdPrice;
        lastPriceUpdateTime = block.timestamp;
    }

    /// @notice Returns the price of 1 raw collateral unit in raw loan units, scaled by 1e36 (ORACLE_PRICE_SCALE).
    ///         Formula: (collateralUSD / loanUSD) * 10^(loanDecimals + 36 - collateralDecimals)
    function price() external view returns (uint256) {
        require(collateralUsdPrice > 0, "collateral price not set");
        require(loanUsdPrice > 0, "loan price not set");

        uint256 priceScale = 10 ** (uint256(LOAN_TOKEN_DECIMALS) + 36 - uint256(COLLATERAL_TOKEN_DECIMALS));
        return (collateralUsdPrice * priceScale) / loanUsdPrice;
    }

    /// @notice Update USD prices for both assets. Only callable by whitelisted addresses.
    function setPrice(uint256 newCollateralUsdPrice, uint256 newLoanUsdPrice) external {
        if (!whitelist[msg.sender]) revert NotWhitelisted();
        if (newCollateralUsdPrice == 0 || newLoanUsdPrice == 0) revert ZeroPrice();
        if (block.timestamp < lastPriceUpdateTime + PRICE_UPDATE_DELAY) revert UpdateTooFrequent();

        collateralUsdPrice = newCollateralUsdPrice;
        loanUsdPrice = newLoanUsdPrice;
        lastPriceUpdateTime = block.timestamp;

        emit PriceUpdated(newCollateralUsdPrice, newLoanUsdPrice);
    }
 

    function addToWhitelist(address user) external {
        if (msg.sender != owner) revert NotOwner();
        whitelist[user] = true;
        emit WhitelistUpdated(user, true);
    }

    function removeFromWhitelist(address user) external {
        if (msg.sender != owner) revert NotOwner();
        whitelist[user] = false;
        emit WhitelistUpdated(user, false);
    }

    function transferOwnership(address newOwner) external {
        if (msg.sender != owner) revert NotOwner();
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}
