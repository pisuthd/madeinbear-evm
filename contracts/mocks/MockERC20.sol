// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @notice Simple ERC20 token for testing purposes with configurable decimals
 */
contract MockERC20 is ERC20 {
    address public owner;
    uint8 private _decimals;
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address _owner
    ) ERC20(name, symbol) {
        owner = _owner;
        _decimals = 18; // Default to 18 decimals
        if (initialSupply > 0) {
            _mint(_owner, initialSupply);
        }
    }
    
    /**
     * @notice Get token decimals
     * @return The number of decimals
     */
    function decimals() public view override returns (uint8) {
        return _decimals;
    }
    
    /**
     * @notice Set token decimals (for testing purposes)
     * @param newDecimals New decimal value
     */
    function setDecimals(uint8 newDecimals) external {
        require(msg.sender == owner, "Only owner can set decimals");
        _decimals = newDecimals;
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