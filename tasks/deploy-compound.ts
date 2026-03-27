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
		const oracle = await Oracle.deploy()
		await oracle.waitForDeployment()
		const oracleAddress = await oracle.getAddress()
		console.log(`Oracle deployed to: ${oracleAddress}`)
		saveDeployment(network.name, 'PriceOracle', oracleAddress)

		// Set prices
		await oracle.setDirectPrice(wethAddress, ethers.parseEther('3000'))
		console.log(`Set WETH price to $3000`)

		await oracle.setDirectPrice(usdtAddress, ethers.parseEther('1'))
		console.log(`Set USDT price to $1.00`)

		// ========== Step 3: Deploy Comptroller ==========
		console.log('\n--- Step 3: Deploying Comptroller (Minimal Version) ---')

		const Comptroller = await ethers.getContractFactory('Comptroller')
		const comptroller = await Comptroller.deploy()
		await comptroller.waitForDeployment()
		const comptrollerAddress = await comptroller.getAddress()
		console.log(`Comptroller deployed to: ${comptrollerAddress}`)
		saveDeployment(network.name, 'Comptroller', comptrollerAddress)

		// ========== Step 4: Deploy CCTokens ==========
		console.log('\n--- Step 4: Deploying CCTokens ---')

		const CCToken = await ethers.getContractFactory('ConfidentialCCToken')

		const ccWETH = await CCToken.deploy(
			wethAddress,
			comptrollerAddress,
			oracleAddress
		)
		await ccWETH.waitForDeployment()
		const ccWETHAddress = await ccWETH.getAddress()
		console.log(`ccWETH deployed to: ${ccWETHAddress}`)
		saveDeployment(network.name, 'ccWETH', ccWETHAddress)

		const ccUSDT = await CCToken.deploy(
			usdtAddress,
			comptrollerAddress,
			oracleAddress
		)
		await ccUSDT.waitForDeployment()
		const ccUSDTAddress = await ccUSDT.getAddress()
		console.log(`ccUSDT deployed to: ${ccUSDTAddress}`)
		saveDeployment(network.name, 'ccUSDT', ccUSDTAddress)

		// ========== Step 5: Register Markets ==========
		console.log('\n--- Step 5: Registering Markets ---')

		await comptroller._supportMarket(ccWETHAddress)
		console.log(`Added ccWETH to comptroller`)

		await comptroller._supportMarket(ccUSDTAddress)
		console.log(`Added ccUSDT to comptroller`)

		// ========== Summary ==========
		console.log('\n========================================')
		console.log('🎉 FHE Compound Protocol Deployed!')
		console.log('========================================')
		console.log(`Deployer: ${deployer.address}`)
		console.log(`\nContracts:`)
		console.log(`  WETH:       ${wethAddress}`)
		console.log(`  USDT:       ${usdtAddress}`)
		console.log(`  Oracle:     ${oracleAddress}`)
		console.log(`  Comptroller:${comptrollerAddress}`)
		console.log(`  ccWETH:     ${ccWETHAddress}`)
		console.log(`  ccUSDT:     ${ccUSDTAddress}`)
		console.log('========================================\n')

		return {
			weth: wethAddress,
			usdt: usdtAddress,
			oracle: oracleAddress,
			comptroller: comptrollerAddress,
			ccWETH: ccWETHAddress,
			ccUSDT: ccUSDTAddress,
		}
	})