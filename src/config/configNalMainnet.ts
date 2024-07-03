import { createPublicClient, createWalletClient, http, getAddress, custom } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'
import { nalMainnet } from './nalMainnet'
import { publicActionsL1, publicActionsL2, walletActionsL1, walletActionsL2 } from 'viem/op-stack'

export const account = privateKeyToAccount("0x480f...faddb");

export const usdtInfo = {
  addrL1 : getAddress("0xdac17f958d2ee523a2206206994597c13d831ec7"),
  addrL2 : getAddress("0xf10b577addd414ca97731c3ab772cd212813b14d")
}

const nalRpcUrl = "https://rpc.nal.network";

export const publicClientL1 = createPublicClient({
  chain: mainnet,
  transport: http()
}).extend(publicActionsL1())

export const walletClientL1 = createWalletClient({
  account,
  chain: mainnet,
  transport: http()
}).extend(walletActionsL1())

export const publicClientL2 = createPublicClient({
  chain: nalMainnet,
  transport: http(nalRpcUrl)
}).extend(publicActionsL2())

export const walletClientL2 = createWalletClient({
  account,
  chain: nalMainnet,
  transport: http(nalRpcUrl)
}).extend(walletActionsL2())