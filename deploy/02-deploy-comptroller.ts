import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployComptroller: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, get, read } = deployments;
  const { deployer } = await getNamedAccounts();

  log("Deploying FHEComptroller...");

  const oracle = await get("FHEPriceOracle");

  // Deploy TrustedRelayer first (placeholder address for now)
  const relayer = await deploy("TrustedRelayer", {
    from: deployer,
    args: [deployer], // Will be updated to comptroller address later
    log: true,
    contract: "TrustedRelayer",
  });
  log(`TrustedRelayer deployed at: ${relayer.address}`);

  // Deploy Comptroller
  const comptroller = await deploy("FHEComptroller", {
    from: deployer,
    args: [oracle.address, relayer.address],
    log: true,
    contract: "FHEComptroller",
  });
  log(`FHEComptroller deployed at: ${comptroller.address}`);

  // Update TrustedRelayer to point to comptroller
  const relayerContract = await hre.ethers.getContractAt("TrustedRelayer", relayer.address);
  await relayerContract.setComptroller(comptroller.address);
  log(`Updated TrustedRelayer comptroller address`);

  log("✅ Comptroller and TrustedRelayer deployed successfully");
};

export default deployComptroller;
deployComptroller.tags = ["comptroller"];
deployComptroller.dependencies = ["oracle"];