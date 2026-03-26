
pragma solidity ^0.8.25;

import '@fhenixprotocol/cofhe-contracts/FHE.sol';
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPriceOracle.sol";

/**
 * @title Comptroller
 * @notice FHE-enabled comptroller for Compound protocol risk management
 * @dev Manages markets, collateral factors (PUBLIC), and market parameters
 */

contract Comptroller is Ownable {

    // ===== Public Storage =====

    /// @notice Price oracle address
    IPriceOracle public oracle;


    // ===== Errors =====

    error ZeroAddress();

    // ===== Events =====

    /// @notice Emitted when price oracle is changed
    event NewPriceOracle(IPriceOracle oldPriceOracle, IPriceOracle newPriceOracle);

    constructor(address _oracle) Ownable(msg.sender) {
        if (_oracle == address(0)) revert ZeroAddress(); 
        
        oracle = IPriceOracle(_oracle); 
    }

    

    /*** Admin Functions ***/

    function _setPriceOracle(IPriceOracle newOracle) onlyOwner public {
        if (address(newOracle) == address(0)) revert ZeroAddress(); 

        IPriceOracle oldOracle = oracle;
        oracle = newOracle;
        emit NewPriceOracle(oldOracle, newOracle);
    }

}