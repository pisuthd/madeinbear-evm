// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @notice Simple ERC20 token for testing purposes
 */
contract MockERC20 is ERC20 {
    address public owner;
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address _owner
    ) ERC20(name, symbol) {
        owner = _owner;
        if (initialSupply > 0) {
            _mint(_owner, initialSupply);
        }
    }
    
    /**
     * @notice Mint new tokens
     * @param to Address to mint to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external { 
        _mint(to, amount);
    }
    
    /**
     * @notice Burn tokens
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burn(address from, uint256 amount) external { 
        _burn(from, amount);
    }
    
    /**
     * @notice Update minter address
     * @param newOwner New minter address
     */
    function setMinter(address newOwner) external {
        require(msg.sender == owner, "Only minter can update");
        owner = newOwner;
    }
}