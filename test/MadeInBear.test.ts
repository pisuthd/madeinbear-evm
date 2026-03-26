import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { CToken, MockERC20 } from "../typechain-types";

describe('MadeInBear - Confidential Compound', () => {

    async function deployCompoundFixture() {
        const [owner, user1, user2, liquidator] = await hre.ethers.getSigners();

        // Deploy core 
        const PriceOracleFactory = await hre.ethers.getContractFactory("PriceOracle");
        const oracle = await PriceOracleFactory.deploy();

        const ComtrollerFactory = await hre.ethers.getContractFactory("Comptroller");
        const comptroller = await ComtrollerFactory.deploy( await oracle.getAddress() );

        // Deploy mock tokens
        const MockERC20Factory = await hre.ethers.getContractFactory("MockERC20");
        const usdc = await MockERC20Factory.deploy("USD Coin", "USDC", 0, await owner.getAddress());
        const weth = await MockERC20Factory.deploy("Wrapped ETH", "WETH", 0, await owner.getAddress());

        await usdc.setDecimals(6);
        await weth.setDecimals(8);



        // Set prices in oracle
        // USDC: $1, ETH: $2,000 
        await oracle.setDirectPrice(await usdc.getAddress(), 1_000000000000000000n);
        await oracle.setDirectPrice(await weth.getAddress(), 2000_000000000000000000n);
        

        

        return {
            owner,
            user1,
            user2,
            liquidator,
            usdc,
            weth,
            oracle,
            comptroller
        }
    }

    describe("Deployment", function () {



        it("Should deploy all contracts correctly", async function () {
            const { usdc, weth } = await loadFixture(deployCompoundFixture);
            expect(await usdc.name()).to.equal("USD Coin");
            expect(await weth.name()).to.equal("Wrapped ETH");

        });

    })

})