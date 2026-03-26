// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

contract Counter {
    euint32 public count;
    euint32 public ONE;
    ebool public isInitialized;

    constructor() {
        ONE = FHE.asEuint32(1);
        count = FHE.asEuint32(0);

        isInitialized = FHE.asEbool(false);
        isInitialized = FHE.asEbool(true);

        FHE.allowThis(count);
        FHE.allowThis(ONE);

        FHE.gte(count, ONE);

        FHE.allowSender(count);
    }

    function increment() public {
        count = FHE.add(count, ONE);
        FHE.allowThis(count);
        FHE.allowSender(count);
    }

    function decrement() public {
        count = FHE.sub(count, ONE);
        FHE.allowThis(count);
        FHE.allowSender(count);
    }

    function reset(InEuint32 memory value) public {
        count = FHE.asEuint32(value);
        FHE.allowThis(count);
        FHE.allowSender(count);
    }

    // New: mark as publicly decryptable
    function allow_counter_publicly() external {
        FHE.allowPublic(count);
    }

    // New: accept decrypted value with Threshold Network proof
    function reveal_counter(uint32 _decrypted, bytes memory _signature) external {
        FHE.publishDecryptResult(count, _decrypted, _signature);
    }

    // Same: read the published result
    function get_counter_value() external view returns (uint256) {
        (uint256 value, bool decrypted) = FHE.getDecryptResultSafe(count);
        if (!decrypted) revert("Value is not ready");
        return value;
    }
}