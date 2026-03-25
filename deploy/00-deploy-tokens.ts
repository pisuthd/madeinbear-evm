import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployTokens: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log("Deploying MockERC20 tokens...");

  // Deploy MockWETH
  const weth = await deploy("MockERC20", {
    from: deployer,
    args: ["Wrapped Ether", "WETH", hre.ethers.parseEther("1000000"), deployer], // 1M WETH
    log: true,
    contract: "MockERC20",
  });
  log(`MockWETH deployed at: ${weth.address}`);

  // Deploy MockUSDT
  const usdt = await deploy("MockERC20", {
    from: deployer,
    args: ["Tether USD", "USDT", hre.ethers.parseEther("1000000"), deployer], // 1M USDT
    log: true,
    contract: "MockERC20",
  });
  log(`MockUSDT deployed at: ${usdt.address}`);

  log("✅ Tokens deployed successfully");
};

export default deployTokens;
deployTokens.tags = ["tokens"];