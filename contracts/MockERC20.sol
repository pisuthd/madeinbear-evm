// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @notice Simple ERC20 token for testing purposes
 * @dev Minter role can mint new tokens
 */
contract MockERC20 is ERC20 {
    address public minter;
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address _minter
    ) ERC20(name, symbol) {
        minter = _minter;
        if (initialSupply > 0) {
            _mint(_minter, initialSupply);
        }
    }
    
    /**
     * @notice Mint new tokens
     * @param to Address to mint to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external {
        require(msg.sender == minter, "Only minter can mint");
        _mint(to, amount);
    }
    
    /**
     * @notice Burn tokens
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burn(address from, uint256 amount) external {
        require(msg.sender == minter, "Only minter can burn");
        _burn(from, amount);
    }
    
    /**
     * @notice Update minter address
     * @param newMinter New minter address
     */
    function setMinter(address newMinter) external {
        require(msg.sender == minter, "Only minter can update");
        minter = newMinter;
    }
}