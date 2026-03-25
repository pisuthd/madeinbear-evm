import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { saveDeployment } from './utils'

// Task to deploy the FHE Compound protocol
task('deploy-compound', 'Deploy the FHE Compound protocol to the selected network')
	.setAction(async (_, hre: HardhatRuntimeEnvironment) => {
		const { ethers, network } = hre

		console.log(`Deploying FHE Compound Protocol to ${network.name}...`)

		// Get the deployer account
		const [deployer] = await ethers.getSigners()
		console.log(`Deploying with account: ${deployer.address}`)
		console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`)

		// ========== Step 1: Deploy Mock Tokens ==========
		console.log('--- Step 1: Deploying Mock Tokens ---')

		const MockERC20 = await ethers.getContractFactory('MockERC20')

		const weth = await MockERC20.deploy(
			'Wrapped Ether',
			'WETH',
			ethers.parseEther('1000000'), // 1M WETH
			deployer.address
		)
		await weth.waitForDeployment()
		const wethAddress = await weth.getAddress()
		console.log(`WETH deployed to: ${wethAddress}`)
		saveDeployment(network.name, 'MockWETH', wethAddress)

		const usdt = await MockERC20.deploy(
			'Tether USD',
			'USDT',
			ethers.parseEther('1000000'), // 1M USDT
			deployer.address
		)
		await usdt.waitForDeployment()
		const usdtAddress = await usdt.getAddress()
		console.log(`USDT deployed to: ${usdtAddress}`)
		saveDeployment(network.name, 'MockUSDT', usdtAddress)

		// ========== Step 2: Deploy Oracle ==========
		console.log('\n--- Step 2: Deploying Oracle ---')

		const Oracle = await ethers.getContractFactory('PriceOracle')
		const oracle = await Oracle.deploy(deployer.address)
		await oracle.waitForDeployment()
		const oracleAddress = await oracle.getAddress()
		console.log(`Oracle deployed to: ${oracleAddress}`)
		saveDeployment(network.name, 'PriceOracle', oracleAddress)

		// Set prices
		await oracle.setPrice(wethAddress, ethers.parseEther('3000'))
		console.log(`Set WETH price to $3000`)

		await oracle.setPrice(usdtAddress, ethers.parseEther('1'))
		console.log(`Set USDT price to $1.00`)

		// ========== Step 3: Deploy TrustedRelayer ==========
		console.log('\n--- Step 3: Deploying TrustedRelayer ---')

		const TrustedRelayer = await ethers.getContractFactory('TrustedRelayer')
		// Note: We need comptroller and oracle, but we'll set comptroller later
		// For now, deploy with deployer as temp comptroller address
		const relayer = await TrustedRelayer.deploy(
			deployer.address, // temp comptroller (will update later)
			oracleAddress
		)
		await relayer.waitForDeployment()
		const relayerAddress = await relayer.getAddress()
		console.log(`TrustedRelayer deployed to: ${relayerAddress}`)
		saveDeployment(network.name, 'TrustedRelayer', relayerAddress)

		// ========== Step 4: Deploy Comptroller ==========
		console.log('\n--- Step 4: Deploying Comptroller ---')

		const Comptroller = await ethers.getContractFactory('Comptroller')
		const comptroller = await Comptroller.deploy(
			oracleAddress,
			relayerAddress
		)
		await comptroller.waitForDeployment()
		const comptrollerAddress = await comptroller.getAddress()
		console.log(`Comptroller deployed to: ${comptrollerAddress}`)
		saveDeployment(network.name, 'Comptroller', comptrollerAddress)

		// Update TrustedRelayer to point to comptroller
		await relayer.setComptroller(comptrollerAddress)
		console.log(`Updated TrustedRelayer comptroller address`)

		// ========== Step 5: Deploy cTokens ==========
		console.log('\n--- Step 5: Deploying cTokens ---')

		const FHECToken = await ethers.getContractFactory('CToken')

		const cweth = await FHECToken.deploy(
			wethAddress,
			comptrollerAddress,
			oracleAddress,
			relayerAddress
		)
		await cweth.waitForDeployment()
		const cwethAddress = await cweth.getAddress()
		console.log(`cWETH deployed to: ${cwethAddress}`)
		saveDeployment(network.name, 'cWETH', cwethAddress)

		const cusdt = await FHECToken.deploy(
			usdtAddress,
			comptrollerAddress,
			oracleAddress,
			relayerAddress
		)
		await cusdt.waitForDeployment()
		const cusdtAddress = await cusdt.getAddress()
		console.log(`cUSDT deployed to: ${cusdtAddress}`)
		saveDeployment(network.name, 'cUSDT', cusdtAddress)

		// ========== Step 6: Register Markets ==========
		console.log('\n--- Step 6: Registering Markets ---')

		await comptroller.supportMarket(cwethAddress)
		console.log(`Added cWETH to comptroller`)

		await comptroller.supportMarket(cusdtAddress)
		console.log(`Added cUSDT to comptroller`)

		// ========== Step 7: Authorize cTokens in TrustedRelayer ==========
		console.log('\n--- Step 7: Authorizing cTokens in TrustedRelayer ---')

		await relayer.authorizeCaller(cwethAddress)
		console.log(`Authorized cWETH in TrustedRelayer`)

		await relayer.authorizeCaller(cusdtAddress)
		console.log(`Authorized cUSDT in TrustedRelayer`)

		// ========== Step 8: Set Prices for cTokens (for TrustedRelayer) ==========
		console.log('\n--- Step 8: Setting cToken Prices in Oracle ---')

		await oracle.setPrice(cwethAddress, ethers.parseEther('3000'))
		console.log(`Set cWETH price to $3000`)

		await oracle.setPrice(cusdtAddress, ethers.parseEther('1'))
		console.log(`Set cUSDT price to $1.00`)

		// ========== Summary ==========
		console.log('\n========================================')
		console.log('🎉 FHE Compound Protocol Deployed!')
		console.log('========================================')
		console.log(`Deployer: ${deployer.address}`)
		console.log(`\nContracts:`)
		console.log(`  WETH:       ${wethAddress}`)
		console.log(`  USDT:       ${usdtAddress}`)
		console.log(`  Oracle:     ${oracleAddress}`)
		console.log(`  Relayer:    ${relayerAddress}`)
		console.log(`  Comptroller:${comptrollerAddress}`)
		console.log(`  cWETH:      ${cwethAddress}`)
		console.log(`  cUSDT:      ${cusdtAddress}`)
		console.log('========================================\n')

		return {
			weth: wethAddress,
			usdt: usdtAddress,
			oracle: oracleAddress,
			relayer: relayerAddress,
			comptroller: comptrollerAddress,
			cweth: cwethAddress,
			cusdt: cusdtAddress,
		}
	})