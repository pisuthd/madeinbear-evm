// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

interface IPriceOracle {
    function getPrice(address token) external view returns (uint256);
    function setPrice(address token, uint256 price) external;
}