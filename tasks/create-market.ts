import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { getDeployment } from './utils'
import { ethers, Contract } from 'ethers'

// LLTV values (WAD scale)
const ETH_LLTV = 750000000000000000n // 75% = 0.75 * 10^18

// Task to create a market on an already deployed CMorpho
task('create-market', 'Create a market on an already deployed CMorpho')
	.addOptionalParam('cmorpho', 'CMorpho contract address (optional, will read from deployments if not provided)')
	.addOptionalParam('lltv', 'LLTV in WAD scale (e.g., 750000000000000000 for 75%)', ETH_LLTV.toString())
	.setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
		const { ethers, network } = hre

		// Get CMorpho address from task args or deployments file
		let cMorphoAddress = taskArgs.cmorpho
		
		// If not provided or is placeholder, try to get from deployments
		if (!cMorphoAddress || cMorphoAddress === '0x' || cMorphoAddress === '0x0000000000000000000000000000000000000000') {
			cMorphoAddress = getDeployment(network.name, 'CMorpho')
		}
		
		if (!cMorphoAddress) {
			throw new Error('CMorpho address not provided. Use --cmorpho <address> or deploy first with deploy-cmorpho')
		}
		
		// Validate address format
		if (!cMorphoAddress.startsWith('0x') || cMorphoAddress.length !== 42) {
			throw new Error(`Invalid CMorpho address: ${cMorphoAddress}`)
		}

		const lltv = BigInt(taskArgs.lltv || ETH_LLTV.toString())

		console.log(`Creating market on CMorpho at ${cMorphoAddress} on ${network.name}...`)

		// Get the deployer account
		const [deployer] = await ethers.getSigners()
		console.log(`Using account: ${deployer.address}`)

		// Get contract addresses from deployments
		const cUSDTAddress = getDeployment(network.name, 'cUSDT')
		const cETHAddress = getDeployment(network.name, 'cETH')
		const ethIrmAddress = getDeployment(network.name, 'JumpRateIrm')
		const ethOracleAddress = getDeployment(network.name, 'PriceOracle')

		if (!cUSDTAddress || !cETHAddress || !ethIrmAddress || !ethOracleAddress) {
			throw new Error('Missing deployment addresses. Run deploy-cmorpho first.')
		}

		// Get CMorpho contract with explicit ABI for the methods we need
		const cMorpho = new Contract(cMorphoAddress, [
			"function enableIrm(address irm) external",
			"function enableLltv(uint256 lltv) external",
			"function createMarket(tuple(address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) marketParams) external",
			"function owner() external view returns (address)",
		], deployer)
 

		// ========== Step 1: Enable IRM and LLTV ==========
		console.log('\n--- Step 1: Enabling IRM and LLTV on CMorpho ---')

		try {
			const tx1 = await cMorpho.enableIrm(ethIrmAddress)
			await tx1.wait()
			console.log(`IRM enabled: ${ethIrmAddress}`)
		} catch (e: any) {
			if (e.message?.includes('already') || e.message?.includes('Already')) {
				console.log(`IRM already enabled: ${ethIrmAddress}`)
			} else {
				console.log(`IRM enable result: ${e.message?.slice(0, 100) || 'unknown'}`)
			}
		}

		try {
			const tx2 = await cMorpho.enableLltv(lltv)
			await tx2.wait()
			console.log(`LLTV enabled: ${lltv}`)
		} catch (e: any) {
			if (e.message?.includes('already') || e.message?.includes('Already')) {
				console.log(`LLTV already enabled: ${lltv}`)
			} else {
				console.log(`LLTV enable result: ${e.message?.slice(0, 100) || 'unknown'}`)
			}
		}
 
		// ========== Step 2: Create Market ==========
		console.log('\n--- Step 2: Creating Market ---')

		const marketParams = {
			loanToken: cUSDTAddress,
			collateralToken: cETHAddress,
			oracle: ethOracleAddress,
			irm: ethIrmAddress,
			lltv: lltv,
		}

		const { AbiCoder } = ethers
		const marketId = ethers.keccak256(
			AbiCoder.defaultAbiCoder().encode(
				['address', 'address', 'address', 'address', 'uint256'],
				[marketParams.loanToken, marketParams.collateralToken, marketParams.oracle, marketParams.irm, marketParams.lltv],
			),
		)

		try {
			const tx3 = await cMorpho.createMarket(marketParams)
			await tx3.wait()
			console.log(`Market created with ID: ${marketId}`)
		} catch (e: any) {
			if (e.message?.includes('already') || e.message?.includes('Already')) {
				console.log(`Market already created with ID: ${marketId}`)
			} else {
				throw e
			}
		}

		// Save market ID to deployments
		const fs = require('fs')
		const path = require('path')
		const deploymentsDir = path.join(__dirname, '../deployments')
		const deploymentPath = path.join(deploymentsDir, `${network.name}.json`)

		if (fs.existsSync(deploymentPath)) {
			const deployments = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'))
			deployments.MarketId = marketId
			fs.writeFileSync(deploymentPath, JSON.stringify(deployments, null, 2))
		}

		// ========== Summary ==========
		console.log('\n========================================')
		console.log('🎉 Market Created!')
		console.log('========================================')
		console.log(`Market ID: ${marketId}`)
		console.log(`Loan Token: ${cUSDTAddress}`)
		console.log(`Collateral Token: ${cETHAddress}`)
		console.log(`Oracle: ${ethOracleAddress}`)
		console.log(`IRM: ${ethIrmAddress}`)
		console.log(`LLTV: ${lltv}`)
		console.log('========================================\n')

		return {
			marketId,
			marketParams,
		}
	})