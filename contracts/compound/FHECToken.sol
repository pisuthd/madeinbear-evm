// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "./interfaces/IComptroller.sol";
import "./interfaces/IPriceOracle.sol";
import "./interfaces/ITrustedRelayer.sol";

contract FHECToken is ERC20, Ownable {
    using SafeERC20 for IERC20;

    // ===== PUBLIC STATE =====
    IERC20 public immutable underlying;
    IComptroller public comptroller;
    IPriceOracle public oracle;
    ITrustedRelayer public trustedRelayer;

    // Interest rates (fixed for Phase 2)
    uint256 public borrowRate = 0.05e18;    // 5% APY
    uint256 public supplyRate = 0.02e18;    // 2% APY
    uint256 public constant RATE_PRECISION = 1e18;
    uint256 public constant BLOCKS_PER_YEAR = 2_628_000; // ~15s block time

    // Exchange rate (cTokens to underlying)
    uint256 public exchangeRate = 1e18;

    // Global totals (public for transparency)
    uint256 public totalUnderlying;     // Total underlying tokens supplied
    uint256 public totalBorrows;         // Total borrows (includes interest)

    // Accrual tracking per user
    mapping(address => uint256) public lastAccrualBlock;

    // ===== ENCRYPTED STATE (Private) =====
    mapping(address => euint128) private userSupplyBalances;  // User's supplied amount (encrypted)
    mapping(address => euint128) private userBorrowBalances;   // User's borrowed amount (encrypted)

    // ===== EVENTS =====
    event Supply(address indexed user, uint256 underlyingAmount, uint256 cTokenAmount);
    event Withdraw(address indexed user, uint256 cTokenAmount, uint256 underlyingAmount);
    event Borrow(address indexed user, uint256 amount);
    event Repay(address indexed user, uint256 amount);
    event InterestAccrued(address indexed user, euint128 borrowInterest, euint128 supplyInterest);
    event ComptrollerUpdated(address newComptroller);
    event OracleUpdated(address newOracle);
    event TrustedRelayerUpdated(address newTrustedRelayer);
    event ExchangeRateUpdated(uint256 newRate);
    event BorrowRateUpdated(uint256 newRate);
    event SupplyRateUpdated(uint256 newRate);

    // ===== ERRORS =====
    error InsufficientLiquidity();
    error InsufficientCollateral();
    error InsufficientCTokens();
    error InsufficientBalance();
    error InvalidAmount();
    error InsufficientLiquidityForWithdraw();
    error ZeroBalance();

    // ===== MODIFIERS =====
    modifier onlyComptroller() {
        require(msg.sender == address(comptroller), "Only comptroller");
        _;
    }

    modifier onlyTrustedRelayer() {
        require(msg.sender == address(trustedRelayer), "Only trusted relayer");
        _;
    }

    // ===== CONSTRUCTOR =====
    constructor(
        IERC20 _underlying,
        IComptroller _comptroller,
        IPriceOracle _oracle,
        ITrustedRelayer _trustedRelayer
    ) ERC20("FHE Compound Token", "cToken") Ownable(msg.sender) {
        underlying = _underlying;
        comptroller = _comptroller;
        oracle = _oracle;
        trustedRelayer = _trustedRelayer;
    }

    // ===== ADMIN FUNCTIONS =====
    function setComptroller(address _comptroller) external onlyOwner {
        comptroller = IComptroller(_comptroller);
        emit ComptrollerUpdated(_comptroller);
    }

    function setOracle(address _oracle) external onlyOwner {
        oracle = IPriceOracle(_oracle);
        emit OracleUpdated(_oracle);
    }

    function setTrustedRelayer(address _trustedRelayer) external onlyOwner {
        trustedRelayer = ITrustedRelayer(_trustedRelayer);
        emit TrustedRelayerUpdated(_trustedRelayer);
    }

    function setExchangeRate(uint256 _exchangeRate) external onlyOwner {
        exchangeRate = _exchangeRate;
        emit ExchangeRateUpdated(_exchangeRate);
    }

    function setBorrowRate(uint256 _borrowRate) external onlyOwner {
        borrowRate = _borrowRate;
        emit BorrowRateUpdated(_borrowRate);
    }

    function setSupplyRate(uint256 _supplyRate) external onlyOwner {
        supplyRate = _supplyRate;
        emit SupplyRateUpdated(_supplyRate);
    }

    // ===== VIEW FUNCTIONS =====

    function getSupplyBalance(address user) external view onlyTrustedRelayer returns (euint128) {
        return userSupplyBalances[user];
    }

    function getBorrowBalance(address user) external view onlyTrustedRelayer returns (euint128) {
        return userBorrowBalances[user];
    }

    function calculateUnderlying(uint256 cTokenAmount) external view returns (uint256) {
        return (cTokenAmount * exchangeRate) / RATE_PRECISION;
    }

    function calculateCToken(uint256 underlyingAmount) external view returns (uint256) {
        return (underlyingAmount * RATE_PRECISION) / exchangeRate;
    }

    function getAvailableLiquidity() external view returns (uint256) {
        return underlying.balanceOf(address(this)) - totalBorrows;
    }

    // ===== INTEREST ACCRUAL =====

    function accrueInterestForUser(address user) internal returns (euint128 borrowInterest, euint128 supplyInterest) {
        uint256 currentBlock = block.number;
        uint256 blocksElapsed = currentBlock - lastAccrualBlock[user];

        if (blocksElapsed == 0) {
            return (FHE.asEuint128(0), FHE.asEuint128(0));
        }

        // Calculate borrow interest (encrypted)
        euint128 encBorrowBalance = userBorrowBalances[user];
        euint128 encBorrowRate = FHE.asEuint128(borrowRate);

        borrowInterest = FHE.div(
            FHE.mul(FHE.mul(encBorrowBalance, encBorrowRate), FHE.asEuint128(blocksElapsed)),
            FHE.asEuint128(BLOCKS_PER_YEAR * RATE_PRECISION)
        );

        // Calculate supply interest (encrypted)
        euint128 encSupplyBalance = userSupplyBalances[user];
        euint128 encSupplyRate = FHE.asEuint128(supplyRate);

        supplyInterest = FHE.div(
            FHE.mul(FHE.mul(encSupplyBalance, encSupplyRate), FHE.asEuint128(blocksElapsed)),
            FHE.asEuint128(BLOCKS_PER_YEAR * RATE_PRECISION)
        );

        // Update balances
        userBorrowBalances[user] = FHE.add(encBorrowBalance, borrowInterest);
        userSupplyBalances[user] = FHE.add(encSupplyBalance, supplyInterest);

        // Grant permissions
        FHE.allowThis(userBorrowBalances[user]);
        FHE.allowThis(userSupplyBalances[user]);
        FHE.allow(userBorrowBalances[user], address(comptroller));
        FHE.allow(userSupplyBalances[user], address(comptroller));
        FHE.allow(userBorrowBalances[user], address(trustedRelayer));
        FHE.allow(userSupplyBalances[user], address(trustedRelayer));

        lastAccrualBlock[user] = currentBlock;

        emit InterestAccrued(user, borrowInterest, supplyInterest);
    }

    // ===== CORE FUNCTIONS =====

    function supply(uint256 underlyingAmount) external returns (uint256 cTokenAmount) {
        if (underlyingAmount == 0) revert InvalidAmount();

        // 1. Accrue interest for user
        accrueInterestForUser(msg.sender);

        // 2. Transfer underlying tokens to contract
        underlying.safeTransferFrom(msg.sender, address(this), underlyingAmount);

        // 3. Calculate cTokens (PUBLIC exchange rate)
        cTokenAmount = (underlyingAmount * RATE_PRECISION) / exchangeRate;

        // 4. Mint public cTokens (ERC20)
        _mint(msg.sender, cTokenAmount);

        // 5. Store encrypted supply balance (PRIVATE)
        euint128 encAmount = FHE.asEuint128(underlyingAmount);
        userSupplyBalances[msg.sender] = FHE.add(userSupplyBalances[msg.sender], encAmount);
        FHE.allowThis(userSupplyBalances[msg.sender]);
        FHE.allow(userSupplyBalances[msg.sender], address(comptroller));
        FHE.allow(userSupplyBalances[msg.sender], address(trustedRelayer));

        // 6. Update public totals (_mint already updates ERC20 totalSupply)
        totalUnderlying += underlyingAmount;

        emit Supply(msg.sender, underlyingAmount, cTokenAmount);
        return cTokenAmount;
    }

    function withdraw(uint256 cTokenAmount) external returns (uint256 underlyingAmount) {
        if (cTokenAmount == 0) revert InvalidAmount();
        if (balanceOf(msg.sender) < cTokenAmount) revert InsufficientCTokens();

        // 1. Accrue interest for user
        accrueInterestForUser(msg.sender);

        // 2. Calculate underlying amount (PUBLIC exchange rate)
        underlyingAmount = (cTokenAmount * exchangeRate) / RATE_PRECISION;

        // 3. Check liquidity availability (PUBLIC)
        uint256 availableLiquidity = underlying.balanceOf(address(this)) - totalBorrows;
        if (availableLiquidity < underlyingAmount) revert InsufficientLiquidityForWithdraw();

        // 4. Check health factor after withdraw (via TrustedRelayer)
        // We need to check if user still has enough collateral
        (uint256 healthFactorDecrypted, ) = trustedRelayer.getHealthFactor(msg.sender);
        if (healthFactorDecrypted < 1e18) revert InsufficientCollateral();

        // 5. Burn cTokens (PUBLIC)
        _burn(msg.sender, cTokenAmount);

        // 6. Update encrypted supply balance
        euint128 encAmount = FHE.asEuint128(underlyingAmount);
        euint128 currentSupply = userSupplyBalances[msg.sender];
        euint128 newSupply = FHE.sub(currentSupply, encAmount);
        userSupplyBalances[msg.sender] = newSupply;
        FHE.allowThis(userSupplyBalances[msg.sender]);
        FHE.allow(userSupplyBalances[msg.sender], address(comptroller));
        FHE.allow(userSupplyBalances[msg.sender], address(trustedRelayer));

        // 7. Update public totals (_burn already updates ERC20 totalSupply)
        totalUnderlying -= underlyingAmount;

        // 8. Transfer tokens to user
        underlying.safeTransfer(msg.sender, underlyingAmount);

        emit Withdraw(msg.sender, cTokenAmount, underlyingAmount);
        return underlyingAmount;
    }

    function borrow(uint256 amount) external returns (uint256) {
        if (amount == 0) revert InvalidAmount();

        // 1. Accrue interest for user
        accrueInterestForUser(msg.sender);

        // 2. Check liquidity availability (PUBLIC check)
        uint256 availableLiquidity = underlying.balanceOf(address(this)) - totalBorrows;
        if (availableLiquidity < amount) revert InsufficientLiquidity();

        // 3. Check health factor (via TrustedRelayer)
        (uint256 healthFactorDecrypted, ) = trustedRelayer.getHealthFactor(msg.sender);
        if (healthFactorDecrypted < 1e18) revert InsufficientCollateral();

        // 4. Update encrypted borrow balance
        euint128 encAmount = FHE.asEuint128(amount);
        euint128 currentBorrow = userBorrowBalances[msg.sender];
        euint128 newBorrow = FHE.add(currentBorrow, encAmount);
        userBorrowBalances[msg.sender] = newBorrow;
        FHE.allowThis(userBorrowBalances[msg.sender]);
        FHE.allow(userBorrowBalances[msg.sender], address(comptroller));
        FHE.allow(userBorrowBalances[msg.sender], address(trustedRelayer));

        // 5. Update public totals
        totalBorrows += amount;

        // 6. Transfer tokens to user
        underlying.safeTransfer(msg.sender, amount);

        emit Borrow(msg.sender, amount);
        return amount;
    }

    function repay(uint256 amount) external returns (uint256) {
        if (amount == 0) revert InvalidAmount();

        // 1. Accrue interest for user
        accrueInterestForUser(msg.sender);

        // 2. Get current encrypted borrow balance
        euint128 currentBorrow = userBorrowBalances[msg.sender];
        euint128 encAmount = FHE.asEuint128(amount);

        // 3. Calculate new balance (encrypted subtraction)
        euint128 newBorrow = FHE.sub(currentBorrow, encAmount);

        // 4. Update encrypted balance
        userBorrowBalances[msg.sender] = newBorrow;
        FHE.allowThis(userBorrowBalances[msg.sender]);
        FHE.allow(userBorrowBalances[msg.sender], address(comptroller));
        FHE.allow(userBorrowBalances[msg.sender], address(trustedRelayer));

        // 5. Transfer tokens from user
        underlying.safeTransferFrom(msg.sender, address(this), amount);

        // 6. Update public totals
        totalBorrows -= amount;
        totalUnderlying += amount;

        emit Repay(msg.sender, amount);
        return amount;
    }
}