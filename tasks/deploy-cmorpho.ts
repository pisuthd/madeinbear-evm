import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { saveDeployment } from './utils'

// Price constants (USD, scaled by 1e18)
const ETH_USD = 3000n * 10n ** 18n // 1 ETH = $3000
const USDT_USD = 10n ** 18n // 1 USDT = $1

// LLTV values (WAD scale)
const ETH_LLTV = 750000000000000000n // 75% = 0.75 * 10^18

// Task to deploy the CMorpho Confidential Lending protocol
task('deploy-cmorpho', 'Deploy the CMorpho Confidential Lending protocol to the selected network')
	.setAction(async (_, hre: HardhatRuntimeEnvironment) => {
		const { ethers, network } = hre

		console.log(`Deploying CMorpho Confidential Lending Protocol to ${network.name}...`)

		// Get the deployer account
		const [deployer] = await ethers.getSigners()
		console.log(`Deploying with account: ${deployer.address}`)
		console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`)

		// ========== Step 1: Deploy MockERC20 Tokens ==========
		console.log('--- Step 1: Deploying MockERC20 Tokens ---')

		const MockERC20 = await ethers.getContractFactory('MockERC20')

		const usdt = await MockERC20.deploy('Mock USDT', 'USDT', 0, deployer.address)
		await usdt.waitForDeployment()
		const usdtAddress = await usdt.getAddress()
		console.log(`USDT deployed to: ${usdtAddress}`)
		saveDeployment(network.name, 'MockUSDT', usdtAddress)

		// Set USDT to 6 decimals
		await usdt.setDecimals(6)

		const eth = await MockERC20.deploy('Mock ETH', 'ETH', 0, deployer.address)
		await eth.waitForDeployment()
		const ethAddress = await eth.getAddress()
		console.log(`ETH deployed to: ${ethAddress}`)
		saveDeployment(network.name, 'MockETH', ethAddress)

		// Set ETH to 6 decimals (matching fhenix confidential token requirements)
		await eth.setDecimals(6);

		// ========== Step 2: Deploy CToken Wrappers ==========
		console.log('\n--- Step 2: Deploying CToken Wrappers ---')

		const CToken = await ethers.getContractFactory('CToken')

		const cUSDT = await CToken.deploy(usdtAddress, "Confidential USDT", "cUSDT", "")
		await cUSDT.waitForDeployment()
		const cUSDTAddress = await cUSDT.getAddress()
		console.log(`cUSDT deployed to: ${cUSDTAddress}`)
		console.log(`  Underlying USDT: ${usdtAddress}`)
		saveDeployment(network.name, 'cUSDT', cUSDTAddress)

		const cETH = await CToken.deploy(ethAddress, "Confidential ETH", "cETH", "")
		await cETH.waitForDeployment()
		const cETHAddress = await cETH.getAddress()
		console.log(`cETH deployed to: ${cETHAddress}`)
		console.log(`  Underlying ETH: ${ethAddress}`)
		saveDeployment(network.name, 'cETH', cETHAddress)

		// ========== Step 3: Deploy Interest Rate Model ==========
		console.log('\n--- Step 3: Deploying Interest Rate Model (JumpRateIrm) ---')

		const JumpRateIrm = await ethers.getContractFactory('JumpRateIrm')
		const ethIrm = await JumpRateIrm.deploy(
			1n * 10n ** 16n,  // baseRatePerYear: 1% (starting rate at 0% utilization)
			5n * 10n ** 17n,  // multiplierPerYear: 5% (rate increase up to kink)
			2n * 10n ** 18n,  // jumpMultiplierPerYear: 2% (additional rate after kink)
			8n * 10n ** 17n,  // kink: 80% (utilization point where slope changes)
		)
		await ethIrm.waitForDeployment()
		const ethIrmAddress = await ethIrm.getAddress()
		console.log(`JumpRateIrm deployed to: ${ethIrmAddress}`)
		saveDeployment(network.name, 'JumpRateIrm', ethIrmAddress)

		// ========== Step 4: Deploy PriceOracle ==========
		console.log('\n--- Step 4: Deploying PriceOracle ---')

		const PriceOracle = await ethers.getContractFactory('PriceOracle')
		const ethOracle = await PriceOracle.deploy(
			cUSDTAddress, // loanToken (cUSDT)
			cETHAddress, // collateralToken (cETH)
			ETH_USD, // initialCollateralUsdPrice
			USDT_USD, // initialLoanUsdPrice
			6, // loanTokenDecimals (USDT is 6 decimals)
			6, // collateralTokenDecimals (ETH is also 6 decimals)
		)
		await ethOracle.waitForDeployment()
		const ethOracleAddress = await ethOracle.getAddress()
		console.log(`PriceOracle deployed to: ${ethOracleAddress}`)
		console.log(`  ETH/USD Price: ${ETH_USD / 10n ** 18n}`)
		console.log(`  USDT/USD Price: ${USDT_USD / 10n ** 18n}`)
		saveDeployment(network.name, 'PriceOracle', ethOracleAddress)

		// ========== Step 5: Deploy CMorpho ==========
		console.log('\n--- Step 5: Deploying CMorpho ---')

		const CMorpho = await ethers.getContractFactory('CMorpho')
		const cMorpho = await CMorpho.deploy(deployer.address)
		await cMorpho.waitForDeployment()
		const cMorphoAddress = await cMorpho.getAddress()
		console.log(`CMorpho deployed to: ${cMorphoAddress}`)
		saveDeployment(network.name, 'CMorpho', cMorphoAddress)

		// ========== Step 6: Enable IRM and LLTV ==========
		console.log('\n--- Step 6: Enabling IRM and LLTV on CMorpho ---')

		await cMorpho.enableIrm(ethIrmAddress)
		console.log(`IRM enabled: ${ethIrmAddress}`)

		await cMorpho.enableLltv(ETH_LLTV)
		console.log(`LLTV enabled: ${ETH_LLTV} (75%)`)

		// ========== Step 7: Create Market ==========
		console.log('\n--- Step 7: Creating Market ---')

		const marketParams = {
			loanToken: cUSDTAddress,
			collateralToken: cETHAddress,
			oracle: ethOracleAddress,
			irm: ethIrmAddress,
			lltv: ETH_LLTV,
		}

		const { AbiCoder } = ethers
		const marketId = ethers.keccak256(
			AbiCoder.defaultAbiCoder().encode(
				['address', 'address', 'address', 'address', 'uint256'],
				[marketParams.loanToken, marketParams.collateralToken, marketParams.oracle, marketParams.irm, marketParams.lltv],
			),
		)

		await cMorpho.createMarket(marketParams)
		console.log(`Market created with ID: ${marketId}`)
		saveDeployment(network.name, 'MarketId', marketId)

		// ========== Step 8: Whitelist deployer on Oracle ==========
		console.log('\n--- Step 8: Whitelisting deployer on Oracle ---')

		await ethOracle.addToWhitelist(deployer.address)
		console.log(`Deployer whitelisted on PriceOracle`)

		// ========== Summary ==========
		console.log('\n========================================')
		console.log('🎉 CMorpho Protocol Deployed!')
		console.log('========================================')
		console.log(`Deployer: ${deployer.address}`)
		console.log(`\nCore Contracts:`)
		console.log(`  MockUSDT:    ${usdtAddress}`)
		console.log(`  MockETH:     ${ethAddress}`)
		console.log(`  cUSDT:       ${cUSDTAddress}`)
		console.log(`  cETH:        ${cETHAddress}`)
		console.log(`  JumpRateIrm: ${ethIrmAddress}`)
		console.log(`  PriceOracle: ${ethOracleAddress}`)
		console.log(`  CMorpho:     ${cMorphoAddress}`)
		console.log(`  Market ID:  ${marketId}`)
		console.log('========================================\n')

		return {
			usdt: usdtAddress,
			eth: ethAddress,
			cUSDT: cUSDTAddress,
			cETH: cETHAddress,
			ethIrm: ethIrmAddress,
			ethOracle: ethOracleAddress,
			cMorpho: cMorphoAddress,
			marketId: marketId,
			marketParams,
		}
	})