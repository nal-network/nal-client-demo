import { createPublicClient, createWalletClient, http, getAddress, custom } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia, optimismSepolia } from 'viem/chains'
import { nalSepolia } from './nalSepolia'
import { publicActionsL1, publicActionsL2, walletActionsL1, walletActionsL2 } from 'viem/op-stack'
import 'dotenv/config'

export const account = privateKeyToAccount(process.env.TEST_PRIKEY as `0x${string}`);

export const usdtInfo = {
  addrL1 : getAddress("0x84E7a252AD39Cc9BFcDcB16208c3e912a313be97"),
  addrL2 : getAddress("0xe4f926348d533d2b20857bd4d96ba92a4ceb9c15")
}

const opRpcUrl = "https://optimism-sepolia.drpc.org";
const nalRpcUrl = "https://testnet-rpc.nal.network";

export const publicClientL1 = createPublicClient({
  chain: sepolia,
  transport: http()
}).extend(publicActionsL1())

export const walletClientL1 = createWalletClient({
  account,
  chain: sepolia,
  transport: http()
}).extend(walletActionsL1())
 
export const pubClientOpL2 = createPublicClient({
  chain: optimismSepolia,
  transport: http(opRpcUrl)
}).extend(publicActionsL2())

export const walletClientOpL2 = createWalletClient({
  account,
  chain: optimismSepolia,
  transport: http(opRpcUrl)
}).extend(walletActionsL2())

export const publicClientL2 = createPublicClient({
  chain: nalSepolia,
  transport: http(nalRpcUrl)
}).extend(publicActionsL2())

export const walletClientL2 = createWalletClient({
  account,
  chain: nalSepolia,
  transport: http(nalRpcUrl)
}).extend(walletActionsL2())