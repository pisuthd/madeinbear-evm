import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { saveDeployment } from './utils'

// Task to deploy CToken (Confidential Token Wrappers)
task('deploy-ctoken', 'Deploy CToken wrappers for existing underlying tokens')
	.setAction(async (_, hre: HardhatRuntimeEnvironment) => {
		const { ethers, network } = hre

		console.log(`Deploying CToken Wrappers to ${network.name}...`)

		// Get the deployer account
		const [deployer] = await ethers.getSigners()
		console.log(`Deploying with account: ${deployer.address}`)
		console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`)

		const EXISTING_WETH = '0xF834024dF747196803368523E1677328fD50415f'
		const EXISTING_USDT = '0x2a003dd5ceFCA17767b103963C34fBD8d1E81dC9'

		// Helper to check if address is a valid contract
		const isContract = async (address: string): Promise<boolean> => {
			const code = await ethers.provider.getCode(address)
			return code !== '0x'
		}

		// Determine which addresses to use
		let wethAddress: string
		let usdtAddress: string

		const useExisting = await isContract(EXISTING_WETH) && await isContract(EXISTING_USDT)

		if (useExisting) {
			console.log('--- Using existing deployed tokens ---')
			wethAddress = EXISTING_WETH
			usdtAddress = EXISTING_USDT
		} else {
			console.log('--- Step 1: Deploying Mock Underlying Tokens ---')
			
			const MockERC20 = await ethers.getContractFactory('MockERC20')

			const weth = await MockERC20.deploy(
				'Wrapped Ether',
				'WETH',
				ethers.parseEther('1000000'), // 1M WETH
				deployer.address
			)
			await weth.waitForDeployment()
			wethAddress = await weth.getAddress()
			console.log(`WETH deployed to: ${wethAddress}`)
			saveDeployment(network.name, 'MockWETH', wethAddress)

			const usdt = await MockERC20.deploy(
				'Tether USD',
				'USDT',
				ethers.parseEther('1000000'), // 1M USDT
				deployer.address
			)
			await usdt.waitForDeployment()
			usdtAddress = await usdt.getAddress()
			console.log(`USDT deployed to: ${usdtAddress}`)
			saveDeployment(network.name, 'MockUSDT', usdtAddress)
		}

		// ========== Step 2: Deploy CToken Wrappers ==========
		console.log('\n--- Step 2: Deploying CToken Wrappers ---')

		const CToken = await ethers.getContractFactory('CToken')

		// Deploy cWETH
		const cWETH = await CToken.deploy(wethAddress)
		await cWETH.waitForDeployment()
		const cWETHAddress = await cWETH.getAddress()
		console.log(`cWETH deployed to: ${cWETHAddress}`)
		console.log(`  Underlying WETH: ${wethAddress}`)
		saveDeployment(network.name, 'cWETH', cWETHAddress)

		// Deploy cUSDT
		const cUSDT = await CToken.deploy(usdtAddress)
		await cUSDT.waitForDeployment()
		const cUSDTAddress = await cUSDT.getAddress()
		console.log(`cUSDT deployed to: ${cUSDTAddress}`)
		console.log(`  Underlying USDT: ${usdtAddress}`)
		saveDeployment(network.name, 'cUSDT', cUSDTAddress)

		// ========== Summary ==========
		console.log('\n========================================')
		console.log('🎉 CToken Wrappers Deployed!')
		console.log('========================================')
		console.log(`Deployer: ${deployer.address}`)
		console.log(`\nContracts:`)
		console.log(`  WETH:  ${wethAddress}`)
		console.log(`  USDT:  ${usdtAddress}`)
		console.log(`  cWETH: ${cWETHAddress}`)
		console.log(`  cUSDT: ${cUSDTAddress}`)
		console.log('========================================\n')

		return {
			weth: wethAddress,
			usdt: usdtAddress,
			cWETH: cWETHAddress,
			cUSDT: cUSDTAddress,
		}
	})