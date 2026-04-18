// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.25;
 

import { FHE, euint64, euint128, ebool } from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import { IFHERC20 } from "fhenix-confidential-contracts/contracts/interfaces/IFHERC20.sol";

import {
    Id,
    IMorphoStaticTyping,
    IMorphoBase,
    MarketParams,
    Position,
    Market,
    Authorization,
    Signature
} from "./interfaces/IMorpho.sol";
import {
    IMorphoLiquidateCallback,
    IMorphoRepayCallback,
    IMorphoSupplyCallback,
    IMorphoSupplyCollateralCallback,
    IMorphoFlashLoanCallback
} from "./interfaces/IMorphoCallbacks.sol";

import {IIrm} from "./interfaces/IIrm.sol";
import {IOracle} from "./interfaces/IOracle.sol";

import "./libraries/ConstantsLib.sol";
import {UtilsLib} from "./libraries/UtilsLib.sol";
import {EventsLib} from "./libraries/EventsLib.sol";
import {ErrorsLib} from "./libraries/ErrorsLib.sol";
import {MathLib, WAD} from "./libraries/MathLib.sol";
import {SharesMathLib} from "./libraries/SharesMathLib.sol";
import {MarketParamsLib} from "./libraries/MarketParamsLib.sol";


/**
 * @title CMorpho - Confidential Morpho-Based Lending Contract
 * @notice An FHE-encrypted isolated lending market where all user positions (supply, borrow, collateral)
 *         are stored as encrypted types (euint128/euint64). Markets use CToken (FHERC20) for confidential
 *         token transfers instead of plain ERC20.
 * @dev Based on Morpho-Blue architecture with CoFHE (FHE Coprocessor) encryption.
 */
abstract contract Morpho is IMorphoStaticTyping {

    using MathLib for uint128;
    using MathLib for uint256;
    using UtilsLib for uint256;
    using SharesMathLib for uint256;
    using MarketParamsLib for MarketParams;

    /* IMMUTABLES */

    /// @inheritdoc IMorphoBase
    bytes32 public immutable DOMAIN_SEPARATOR;

    /* STORAGE */

    /// @inheritdoc IMorphoBase
    address public owner;
    /// @dev Encrypted positions: id => user => Position (supplyShares, borrowShares, collateral all encrypted)
    mapping(Id => mapping(address => Position)) internal position;
    /// @inheritdoc IMorphoStaticTyping
    mapping(Id => Market) public market;
    /// @inheritdoc IMorphoBase
    mapping(address => bool) public isIrmEnabled;
    /// @inheritdoc IMorphoBase
    mapping(uint256 => bool) public isLltvEnabled;
    /// @inheritdoc IMorphoBase
    mapping(address => mapping(address => bool)) public isAuthorized;
    /// @inheritdoc IMorphoBase
    mapping(address => uint256) public nonce;
    /// @inheritdoc IMorphoStaticTyping
    mapping(Id => MarketParams) public idToMarketParams;
    /// @notice Designated liquidator address allowed to read all encrypted positions
    address public liquidator;

    /* CONSTRUCTOR */

    /// @param newOwner The new owner of the contract.
    constructor(address newOwner) {
        require(newOwner != address(0), ErrorsLib.ZERO_ADDRESS);

        DOMAIN_SEPARATOR = keccak256(abi.encode(DOMAIN_TYPEHASH, block.chainid, address(this)));
        owner = newOwner;

        emit EventsLib.SetOwner(newOwner);
    }

    /* MODIFIERS */

    /// @dev Reverts if the caller is not the owner.
    modifier onlyOwner() {
        require(msg.sender == owner, ErrorsLib.NOT_OWNER);
        _;
    }

    /* ONLY OWNER FUNCTIONS */

    /// @inheritdoc IMorphoBase
    function setOwner(address newOwner) external onlyOwner {
        require(newOwner != owner, ErrorsLib.ALREADY_SET);

        owner = newOwner;

        emit EventsLib.SetOwner(newOwner);
    }

    /// @inheritdoc IMorphoBase
    function enableIrm(address irm) external onlyOwner {
        require(!isIrmEnabled[irm], ErrorsLib.ALREADY_SET);

        isIrmEnabled[irm] = true;

        emit EventsLib.EnableIrm(irm);
    }

    /// @inheritdoc IMorphoBase
    function enableLltv(uint256 lltv) external onlyOwner {
        require(!isLltvEnabled[lltv], ErrorsLib.ALREADY_SET);
        require(lltv < WAD, ErrorsLib.MAX_LLTV_EXCEEDED);

        isLltvEnabled[lltv] = true;

        emit EventsLib.EnableLltv(lltv);
    }

    /// @notice Sets the designated liquidator address that can read all encrypted positions
    function setLiquidator(address newLiquidator) external onlyOwner {
        liquidator = newLiquidator;
    }

    /* MARKET CREATION */

    /// @inheritdoc IMorphoBase
    function createMarket(MarketParams memory marketParams) external {
        Id id = marketParams.id();
        require(isIrmEnabled[marketParams.irm], ErrorsLib.IRM_NOT_ENABLED);
        require(isLltvEnabled[marketParams.lltv], ErrorsLib.LLTV_NOT_ENABLED);
        require(market[id].lastUpdate == 0, ErrorsLib.MARKET_ALREADY_CREATED);

        // Safe "unchecked" cast.
        market[id].lastUpdate = uint128(block.timestamp);
        idToMarketParams[id] = marketParams;

        emit EventsLib.CreateMarket(id, marketParams);

        // Call to initialize the IRM in case it is stateful.
        if (marketParams.irm != address(0)) IIrm(marketParams.irm).borrowRate(marketParams, market[id]);
    }

    /* AUTHORIZATION HELPER */

    /// @dev Returns whether the sender is authorized to manage `onBehalf`'s positions.
    function _isSenderAuthorized(address onBehalf) internal view returns (bool) {
        return msg.sender == onBehalf || isAuthorized[onBehalf][msg.sender];
    }

    /// @dev Grants FHE permissions on all 3 position fields for: contract, owner, caller, and liquidator.
    function _grantPermissions(Id id, address user) internal {
        Position storage p = position[id][user];

        // supplyShares (euint128)
        FHE.allowThis(p.supplyShares);
        FHE.allow(p.supplyShares, user);
        FHE.allowSender(p.supplyShares);
        if (liquidator != address(0)) FHE.allow(p.supplyShares, liquidator);

        // borrowShares (euint64)
        FHE.allowThis(p.borrowShares);
        FHE.allow(p.borrowShares, user);
        FHE.allowSender(p.borrowShares);
        if (liquidator != address(0)) FHE.allow(p.borrowShares, liquidator);

        // collateral (euint64)
        FHE.allowThis(p.collateral);
        FHE.allow(p.collateral, user);
        FHE.allowSender(p.collateral);
        if (liquidator != address(0)) FHE.allow(p.collateral, liquidator);
    }

    /* SUPPLY MANAGEMENT */

    /// @inheritdoc IMorphoBase
    function supply(
        MarketParams memory marketParams,
        uint256 assets,
        uint256 shares,
        address onBehalf,
        bytes calldata data
    ) external returns (uint256, uint256) {
        Id id = marketParams.id();
        require(market[id].lastUpdate != 0, ErrorsLib.MARKET_NOT_CREATED);
        require(UtilsLib.exactlyOneZero(assets, shares), ErrorsLib.INCONSISTENT_INPUT);
        require(onBehalf != address(0), ErrorsLib.ZERO_ADDRESS);

        _accrueInterest(marketParams, id);

        if (assets > 0) shares = assets.toSharesDown(market[id].totalSupplyAssets, market[id].totalSupplyShares);
        else assets = shares.toAssetsUp(market[id].totalSupplyAssets, market[id].totalSupplyShares);

        // Encrypted: supplyShares += shares (euint128)
        position[id][onBehalf].supplyShares = FHE.add(
            position[id][onBehalf].supplyShares,
            FHE.asEuint128(shares)
        );
        _grantPermissions(id, onBehalf);

        market[id].totalSupplyShares += shares.toUint128();
        market[id].totalSupplyAssets += assets.toUint128();

        emit EventsLib.Supply(id, msg.sender, onBehalf, assets, shares);

        if (data.length > 0) IMorphoSupplyCallback(msg.sender).onMorphoSupply(assets, data);

        // Confidential token transfer: user → Morpho (requires user to have set Morpho as operator via CToken.setOperator)
        IFHERC20(marketParams.loanToken).confidentialTransferFrom(
            msg.sender, address(this), FHE.asEuint64(uint64(assets))
        );

        return (assets, shares);
    }

    /// @inheritdoc IMorphoBase
    function withdraw(
        MarketParams memory marketParams,
        uint256 assets,
        uint256 shares,
        address onBehalf,
        address receiver
    ) external returns (uint256, uint256) {
        Id id = marketParams.id();
        require(market[id].lastUpdate != 0, ErrorsLib.MARKET_NOT_CREATED);
        require(UtilsLib.exactlyOneZero(assets, shares), ErrorsLib.INCONSISTENT_INPUT);
        require(receiver != address(0), ErrorsLib.ZERO_ADDRESS);
        // No need to verify that onBehalf != address(0) thanks to the following authorization check.
        require(_isSenderAuthorized(onBehalf), ErrorsLib.UNAUTHORIZED);

        _accrueInterest(marketParams, id);

        if (assets > 0) shares = assets.toSharesUp(market[id].totalSupplyAssets, market[id].totalSupplyShares);
        else assets = shares.toAssetsDown(market[id].totalSupplyAssets, market[id].totalSupplyShares);

        // Encrypted: supplyShares -= shares (euint128)
        position[id][onBehalf].supplyShares = FHE.sub(
            position[id][onBehalf].supplyShares,
            FHE.asEuint128(shares)
        );
        _grantPermissions(id, onBehalf);

        market[id].totalSupplyShares -= shares.toUint128();
        market[id].totalSupplyAssets -= assets.toUint128();

        require(market[id].totalBorrowAssets <= market[id].totalSupplyAssets, ErrorsLib.INSUFFICIENT_LIQUIDITY);

        emit EventsLib.Withdraw(id, msg.sender, onBehalf, receiver, assets, shares);

        // Confidential token transfer: Morpho → receiver
        IFHERC20(marketParams.loanToken).confidentialTransfer(
            receiver, FHE.asEuint64(uint64(assets))
        );

        return (assets, shares);
    }

    /* BORROW MANAGEMENT */

    /// @inheritdoc IMorphoBase
    function borrow(
        MarketParams memory marketParams,
        uint256 assets,
        uint256 shares,
        address onBehalf,
        address receiver
    ) external returns (uint256, uint256) {
        Id id = marketParams.id();
        require(market[id].lastUpdate != 0, ErrorsLib.MARKET_NOT_CREATED);
        require(UtilsLib.exactlyOneZero(assets, shares), ErrorsLib.INCONSISTENT_INPUT);
        require(receiver != address(0), ErrorsLib.ZERO_ADDRESS);
        // No need to verify that onBehalf != address(0) thanks to the following authorization check.
        require(_isSenderAuthorized(onBehalf), ErrorsLib.UNAUTHORIZED);

        _accrueInterest(marketParams, id);

        if (assets > 0) shares = assets.toSharesUp(market[id].totalBorrowAssets, market[id].totalBorrowShares);
        else assets = shares.toAssetsDown(market[id].totalBorrowAssets, market[id].totalBorrowShares);

        // Encrypted: borrowShares += shares (euint64)
        position[id][onBehalf].borrowShares = FHE.add(
            position[id][onBehalf].borrowShares,
            FHE.asEuint64(uint64(shares))
        );
        _grantPermissions(id, onBehalf);

        market[id].totalBorrowShares += shares.toUint128();
        market[id].totalBorrowAssets += assets.toUint128();

        // TODO: Cannot require() with encrypted ebool result.
        // Health check skipped for now — will be enforced via liquidation or off-chain verification.
        // require(_isHealthy(marketParams, id, onBehalf), ErrorsLib.INSUFFICIENT_COLLATERAL);
        require(market[id].totalBorrowAssets <= market[id].totalSupplyAssets, ErrorsLib.INSUFFICIENT_LIQUIDITY);

        emit EventsLib.Borrow(id, msg.sender, onBehalf, receiver, assets, shares);

        // Confidential token transfer: Morpho → receiver
        IFHERC20(marketParams.loanToken).confidentialTransfer(
            receiver, FHE.asEuint64(uint64(assets))
        );

        return (assets, shares);
    }

    /// @inheritdoc IMorphoBase
    function repay(
        MarketParams memory marketParams,
        uint256 assets,
        uint256 shares,
        address onBehalf,
        bytes calldata data
    ) external returns (uint256, uint256) {
        Id id = marketParams.id();
        require(market[id].lastUpdate != 0, ErrorsLib.MARKET_NOT_CREATED);
        require(UtilsLib.exactlyOneZero(assets, shares), ErrorsLib.INCONSISTENT_INPUT);
        require(onBehalf != address(0), ErrorsLib.ZERO_ADDRESS);

        _accrueInterest(marketParams, id);

        if (assets > 0) shares = assets.toSharesDown(market[id].totalBorrowAssets, market[id].totalBorrowShares);
        else assets = shares.toAssetsUp(market[id].totalBorrowAssets, market[id].totalBorrowShares);

        // Encrypted: borrowShares -= shares (euint64)
        position[id][onBehalf].borrowShares = FHE.sub(
            position[id][onBehalf].borrowShares,
            FHE.asEuint64(uint64(shares))
        );
        _grantPermissions(id, onBehalf);

        market[id].totalBorrowShares -= shares.toUint128();
        market[id].totalBorrowAssets = UtilsLib.zeroFloorSub(market[id].totalBorrowAssets, assets).toUint128();

        // `assets` may be greater than `totalBorrowAssets` by 1.
        emit EventsLib.Repay(id, msg.sender, onBehalf, assets, shares);

        if (data.length > 0) IMorphoRepayCallback(msg.sender).onMorphoRepay(assets, data);

        // Confidential token transfer: user → Morpho (requires user to have set Morpho as operator via CToken.setOperator)
        IFHERC20(marketParams.loanToken).confidentialTransferFrom(
            msg.sender, address(this), FHE.asEuint64(uint64(assets))
        );

        return (assets, shares);
    }
    
    /* COLLATERAL MANAGEMENT */

    /// @inheritdoc IMorphoBase
    function supplyCollateral(MarketParams memory marketParams, uint256 assets, address onBehalf, bytes calldata data)
        external
    {
        Id id = marketParams.id();
        require(market[id].lastUpdate != 0, ErrorsLib.MARKET_NOT_CREATED);
        require(assets != 0, ErrorsLib.ZERO_ASSETS);
        require(onBehalf != address(0), ErrorsLib.ZERO_ADDRESS);

        // Don't accrue interest because it's not required and it saves gas.

        // Encrypted: collateral += assets (euint64)
        position[id][onBehalf].collateral = FHE.add(
            position[id][onBehalf].collateral,
            FHE.asEuint64(uint64(assets))
        );
        _grantPermissions(id, onBehalf);

        emit EventsLib.SupplyCollateral(id, msg.sender, onBehalf, assets);

        if (data.length > 0) IMorphoSupplyCollateralCallback(msg.sender).onMorphoSupplyCollateral(assets, data);

        // Confidential transfer: user → Morpho (collateralToken, not loanToken!)
        IFHERC20(marketParams.collateralToken).confidentialTransferFrom(
            msg.sender, address(this), FHE.asEuint64(uint64(assets))
        );
    }

    /// @inheritdoc IMorphoBase
    function withdrawCollateral(MarketParams memory marketParams, uint256 assets, address onBehalf, address receiver)
        external
    {
        Id id = marketParams.id();
        require(market[id].lastUpdate != 0, ErrorsLib.MARKET_NOT_CREATED);
        require(assets != 0, ErrorsLib.ZERO_ASSETS);
        require(receiver != address(0), ErrorsLib.ZERO_ADDRESS);
        // No need to verify that onBehalf != address(0) thanks to the following authorization check.
        require(_isSenderAuthorized(onBehalf), ErrorsLib.UNAUTHORIZED);

        _accrueInterest(marketParams, id);

        // Encrypted: collateral -= assets (euint64)
        position[id][onBehalf].collateral = FHE.sub(
            position[id][onBehalf].collateral,
            FHE.asEuint64(uint64(assets))
        );
        _grantPermissions(id, onBehalf);

        // TODO: Cannot require() with encrypted ebool result.
        // Health check skipped — same pattern as borrow().
        // require(_isHealthy(marketParams, id, onBehalf), ErrorsLib.INSUFFICIENT_COLLATERAL);

        emit EventsLib.WithdrawCollateral(id, msg.sender, onBehalf, receiver, assets);

        // Confidential transfer: Morpho → receiver (collateralToken, not loanToken!)
        IFHERC20(marketParams.collateralToken).confidentialTransfer(
            receiver, FHE.asEuint64(uint64(assets))
        );
    }

    /* LIQUIDATION */

    // TODO: liquidate()


    /* FLASH LOANS */

    // TODO: flashLoan()

    /* AUTHORIZATION */

    /// @inheritdoc IMorphoBase
    function setAuthorization(address authorized, bool newIsAuthorized) external {
        require(newIsAuthorized != isAuthorized[msg.sender][authorized], ErrorsLib.ALREADY_SET);

        isAuthorized[msg.sender][authorized] = newIsAuthorized;

        emit EventsLib.SetAuthorization(msg.sender, msg.sender, authorized, newIsAuthorized);
    }

    /// @inheritdoc IMorphoBase
    function setAuthorizationWithSig(Authorization memory authorization, Signature calldata signature) external {
        /// Do not check whether authorization is already set because the nonce increment is a desired side effect.
        require(block.timestamp <= authorization.deadline, ErrorsLib.SIGNATURE_EXPIRED);
        require(authorization.nonce == nonce[authorization.authorizer]++, ErrorsLib.INVALID_NONCE);

        bytes32 hashStruct = keccak256(abi.encode(AUTHORIZATION_TYPEHASH, authorization));
        bytes32 digest = keccak256(bytes.concat("\x19\x01", DOMAIN_SEPARATOR, hashStruct));
        address signatory = ecrecover(digest, signature.v, signature.r, signature.s);

        require(signatory != address(0) && authorization.authorizer == signatory, ErrorsLib.INVALID_SIGNATURE);

        emit EventsLib.IncrementNonce(msg.sender, authorization.authorizer, authorization.nonce);

        isAuthorized[authorization.authorizer][authorization.authorized] = authorization.isAuthorized;

        emit EventsLib.SetAuthorization(
            msg.sender, authorization.authorizer, authorization.authorized, authorization.isAuthorized
        );
    }
 

    /* INTEREST MANAGEMENT */

    /// @inheritdoc IMorphoBase
    function accrueInterest(MarketParams memory marketParams) external {
        Id id = marketParams.id();
        require(market[id].lastUpdate != 0, ErrorsLib.MARKET_NOT_CREATED);

        _accrueInterest(marketParams, id);
    }

    /// @dev Accrues interest for the given market `marketParams`.
    /// @dev Assumes that the inputs `marketParams` and `id` match.
    function _accrueInterest(MarketParams memory marketParams, Id id) internal {
        uint256 elapsed = block.timestamp - market[id].lastUpdate;
        if (elapsed == 0) return;

        if (marketParams.irm != address(0)) {
            uint256 borrowRate = IIrm(marketParams.irm).borrowRate(marketParams, market[id]);
            uint256 interest = market[id].totalBorrowAssets.wMulDown(borrowRate.wTaylorCompounded(elapsed));
            market[id].totalBorrowAssets += interest.toUint128();
            market[id].totalSupplyAssets += interest.toUint128();

            // Fee recipient removed: all interest accrues to suppliers equally via share price increase.

            emit EventsLib.AccrueInterest(id, borrowRate, interest, 0);
        }

        // Safe "unchecked" cast.
        market[id].lastUpdate = uint128(block.timestamp);
    }

    /* HEALTH CHECK */

    /// @dev Returns whether the position of `borrower` in the given market `marketParams` is healthy (encrypted).
    /// @dev Assumes that the inputs `marketParams` and `id` match.
    function _isHealthy(MarketParams memory marketParams, Id id, address borrower) internal returns (ebool) {
        // Plaintext check: if no borrows in entire market, must be healthy
        if (market[id].totalBorrowShares == 0) return FHE.asEbool(true);

        // Encrypted check: if this user has zero borrow shares, they are healthy
        ebool isZeroBorrow = FHE.eq(position[id][borrower].borrowShares, FHE.asEuint64(0));

        uint256 collateralPrice = IOracle(marketParams.oracle).price();
        ebool healthyWithPrice = _isHealthy(marketParams, id, borrower, collateralPrice);

        return FHE.select(isZeroBorrow, FHE.asEbool(true), healthyWithPrice);
    }

    /// @dev Returns whether the position of `borrower` in the given market `marketParams` with the given
    /// `collateralPrice` is healthy (encrypted result).
    /// @dev Assumes that the inputs `marketParams` and `id` match.
    /// @dev Note: FHE division truncates (rounds down), which is less conservative than the original
    /// round-up for borrowed amounts. This is a known trade-off of the encrypted computation.
    /// @dev All intermediate values fit in euint128 by pre-scaling the oracle price from 1e36 to 1e18 (WAD).
    function _isHealthy(MarketParams memory marketParams, Id id, address borrower, uint256 collateralPrice)
        internal
        returns (ebool)
    {
        // Safety: if no borrows in market, avoid division by zero
        if (market[id].totalBorrowShares == 0) return FHE.asEbool(true);

        // borrowed = borrowShares * totalBorrowAssets / totalBorrowShares (all in euint128)
        euint128 borrowed = FHE.mul(
            FHE.asEuint128(position[id][borrower].borrowShares),
            FHE.asEuint128(market[id].totalBorrowAssets)
        );
        borrowed = FHE.div(borrowed, FHE.asEuint128(market[id].totalBorrowShares));

        // Pre-scale price: ORACLE_PRICE_SCALE (1e36) → WAD (1e18) so products fit in euint128.
        // effectivePrice = collateralPrice / (ORACLE_PRICE_SCALE / WAD) = collateralPrice / 1e18
        uint256 effectivePrice = collateralPrice / (ORACLE_PRICE_SCALE / WAD);

        // maxBorrow = collateral * effectivePrice / WAD * lltv / WAD (all in euint128)
        euint128 maxBorrow = FHE.mul(
            FHE.asEuint128(position[id][borrower].collateral),
            FHE.asEuint128(effectivePrice)
        );
        maxBorrow = FHE.div(maxBorrow, FHE.asEuint128(WAD));
        maxBorrow = FHE.mul(maxBorrow, FHE.asEuint128(marketParams.lltv));
        maxBorrow = FHE.div(maxBorrow, FHE.asEuint128(WAD));

        // Healthy if maxBorrow >= borrowed
        return FHE.gte(maxBorrow, borrowed);
    }


    /* STORAGE VIEW */

    /// @inheritdoc IMorphoBase
    function extSloads(bytes32[] calldata slots) external view returns (bytes32[] memory res) {
        uint256 nSlots = slots.length;

        res = new bytes32[](nSlots);

        for (uint256 i; i < nSlots;) {
            bytes32 slot = slots[i++];

            assembly ("memory-safe") {
                mstore(add(res, mul(i, 32)), sload(slot))
            }
        }
    }

}