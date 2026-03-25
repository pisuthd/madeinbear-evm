import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployCTokens: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, get, execute, read } = deployments;
  const { deployer } = await getNamedAccounts();

  log("Deploying FHECToken markets...");

  const oracle = await get("FHEPriceOracle");
  const comptroller = await get("FHEComptroller");
  const relayer = await get("TrustedRelayer");

  // Deploy cWETH
  const cweth = await deploy("FHECToken", {
    from: deployer,
    args: [
      (await get("MockERC20_0")).address, // WETH
      comptroller.address,
      oracle.address,
      relayer.address,
    ],
    log: true,
    contract: "FHECToken",
  });
  log(`cWETH deployed at: ${cweth.address}`);

  // Deploy cUSDT
  const cusdt = await deploy("FHECToken", {
    from: deployer,
    args: [
      (await get("MockERC20_1")).address, // USDT
      comptroller.address,
      oracle.address,
      relayer.address,
    ],
    log: true,
    contract: "FHECToken",
  });
  log(`cUSDT deployed at: ${cusdt.address}`);

  // Set prices in oracle
  const oracleContract = await hre.ethers.getContractAt("FHEPriceOracle", oracle.address);
  
  // WETH price: $3000
  await oracleContract.setPrice((await get("MockERC20_0")).address, hre.ethers.parseEther("3000"));
  log(`Set WETH price to $3000`);
  
  // USDT price: $1.00
  await oracleContract.setPrice((await get("MockERC20_1")).address, hre.ethers.parseEther("1"));
  log(`Set USDT price to $1.00`);

  // Add markets to comptroller
  const comptrollerContract = await hre.ethers.getContractAt("FHEComptroller", comptroller.address);
  
  await comptrollerContract.supportMarket(cweth.address);
  log(`Added cWETH to comptroller`);
  
  await comptrollerContract.supportMarket(cusdt.address);
  log(`Added cUSDT to comptroller`);

  // Authorize deployer in trusted relayer for testing
  const relayerContract = await hre.ethers.getContractAt("TrustedRelayer", relayer.address);
  await relayerContract.authorizeCaller(deployer);
  log(`Authorized deployer in TrustedRelayer`);

  log("✅ cTokens deployed successfully");
};

export default deployCTokens;
deployCTokens.tags = ["ctokens"];
deployCTokens.dependencies = ["comptroller"];