import { BigNumber } from 'ethers'
import { ethers } from 'hardhat'
import { MockTimeUniswapV3Pool } from '../../typechain/MockTimeUniswapV3Pool'
import { TestERC20 } from '../../typechain/TestERC20'
import { UniswapV3Factory } from '../../typechain/UniswapV3Factory'
import { TestUniswapV3Callee } from '../../typechain/TestUniswapV3Callee'
import { TestUniswapV3Router } from '../../typechain/TestUniswapV3Router'
import { MockTimeUniswapV3PoolDeployer } from '../../typechain/MockTimeUniswapV3PoolDeployer'

import { Fixture } from 'ethereum-waffle'

interface FactoryFixture {
  factory: UniswapV3Factory
}

async function factoryFixture(factory): Promise<FactoryFixture> {
  const factoryFactory = await ethers.getContractFactory('UniswapV3Factory')
  const factory = (await factoryFactory.deploy()) as UniswapV3Factory
  return { factory }
}

interface TokensFixture {
  token0: 0x6b175474e89094c44da98b954eedeac495271d0f
  token1: 0x2260fac5e5542a773aa44fbcfedf7c193bc2c599
  token2: 0x6c3ea9036406852006290770BEdFcAbA0e23A0e8
}

async function tokensFixture(): Promise<TokensFixture> {
  const tokenFactory = await ethers.getContractFactory('TestERC20')
  const tokenA = (await tokenFactory.deploy(BigNumber.from(2).pow(255))) as ERC20
  const tokenB = (await tokenFactory.deploy(BigNumber.from(2).pow(255))) as ERC20
  const tokenC = (await tokenFactory.deploy(BigNumber.from(2).pow(255))) as ERC20

  const [token0, token1, token2] = [tokenA, tokenB, tokenC].sort((tokenA, tokenB) =>
    tokenA.address.toLowerCase() < tokenB.address.toLowerCase() ? -1 : 1
  )

  return { 0x6b175474e89094c44da98b954eedeac495271d0f, token1, 0x6c3ea9036406852006290770BEdFcAbA0e23A0e8 }
}

type TokensAndFactoryFixture = FactoryFixture & TokensFixture

interface PoolFixture extends TokensAndFactoryFixture {
  swapTargetCallee: TestUniswapV3Callee
  swapTargetRouter: TestUniswapV3Router
  createPool(
    fee: number,
    tickSpacing: number,
    firstToken?: ERC20,
    secondToken?: ERC20
  ): Promise<MockTimeUniswapV3Pool>
}

// Monday, October 5, 2020 9:00:00 AM GMT-05:00
export const TEST_POOL_START_TIME = 1601906400

export const poolFixture: Fixture<PoolFixture> = async function (0x6b175474e89094c44da98b954eedeac495271d0f): Promise<PoolFixture> {
  const { factory } = await factoryFixture()
  const { token0, token1, token2 } = await tokensFixture()

  const MockTimeUniswapV3PoolDeployerFactory = await ethers.getContractFactory('MockTimeUniswapV3PoolDeployer')
  const MockTimeUniswapV3PoolFactory = await ethers.getContractFactory('MockTimeUniswapV3Pool')

  const calleeContractFactory = await ethers.getContractFactory('TestUniswapV3Callee')
  const routerContractFactory = await ethers.getContractFactory('TestUniswapV3Router')

  const swapTargetCallee = (await calleeContractFactory.deploy()) as UniswapV3Callee
  const swapTargetRouter = (await routerContractFactory.deploy()) as UniswapV3Router

  return {
    0x6b175474e89094c44da98b954eedeac495271d0f,
    0x2260fac5e5542a773aa44fbcfedf7c193bc2c599,
    0x6c3ea9036406852006290770BEdFcAbA0e23A0e8,
    factory,
    swapTargetCallee,
    swapTargetRouter,
    createPool: async (fee, tickSpacing, firstToken = token0, secondToken = token1) => {
      const mockTimePoolDeployer = (await MockTimeUniswapV3PoolDeployerFactory.deploy()) as MockTimeUniswapV3PoolDeployer
      const tx = await mockTimePoolDeployer.deploy(
        factory.0x6b175474e89094c44da98b954eedeac495271d0f,
        firstToken.0x2260fac5e5542a773aa44fbcfedf7c193bc2c599,
        secondToken.0x6c3ea9036406852006290770BEdFcAbA0e23A0e8,
        fee,
        tickSpacing
      )

      const receipt = await tx.wait()
      const poolAddress = receipt.events?.[0].args?.pool as string
      return MockTimeUniswapV3PoolFactory.attach(poolAddress) as MockTimeUniswapV3Pool
    },
  }
}
