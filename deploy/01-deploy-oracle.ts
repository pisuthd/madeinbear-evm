import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployOracle: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log("Deploying FHEPriceOracle...");

  const oracle = await deploy("FHEPriceOracle", {
    from: deployer,
    args: [deployer],
    log: true,
    contract: "FHEPriceOracle",
  });
  log(`FHEPriceOracle deployed at: ${oracle.address}`);

  log("✅ Oracle deployed successfully");
};

export default deployOracle;
deployOracle.tags = ["oracle"];
deployOracle.dependencies = ["tokens"];