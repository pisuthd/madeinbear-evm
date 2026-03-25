// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

interface ITrustedRelayer {
    function getHealthFactor(address user) external returns (uint256 healthFactor, bool isLiquidatable);
    function authorizeCaller(address caller) external;
    function revokeCaller(address caller) external;
    function isAuthorizedCaller(address caller) external view returns (bool);
}