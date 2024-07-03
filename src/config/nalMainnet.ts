import { defineChain } from 'viem'
import { chainConfig } from 'viem/op-stack'

const sourceId = 1 // mainnet

export const nalMainnet = /*#__PURE__*/ defineChain({
  ...chainConfig,
  id: 328527,
  name: 'NAL Mainnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc.nal.network"],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://scan.nal.network/',
      apiUrl: 'https://scan.nal.network/api',
    },
  },
  contracts: {
    ...chainConfig.contracts,
    disputeGameFactory: {
      [sourceId]: {
        address: '0x0CE5684754c44822B2351617eC561d2aB89bc781',
      },
    },
    l2OutputOracle: {
      [sourceId]: {
        address: '0xaE25ea4Cc185585Fa6abf344F3354bf8207Cd7D1',
      },
    },
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 0,
    },
    portal: {
      [sourceId]: {
        address: '0x872902b91fB2aa95147fCDc346a567B7970DBe47',
      },
    },
    l1StandardBridge: {
      [sourceId]: {
        address: '0x8a471dF117E2fEA79DACE93cF5f6dd4217931Db7',
      },
    },
  },
  sourceId,
})
