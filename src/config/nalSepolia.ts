import { defineChain } from 'viem'
import { chainConfig } from 'viem/op-stack'

const sourceId = 11_155_111 // sepolia

export const nalSepolia = /*#__PURE__*/ defineChain({
  ...chainConfig,
  id: 328527624,
  name: 'NAL Sepolia',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.nal.network"],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://testnet-scan.nal.network/',
      apiUrl: 'https://testnet-scan.nal.network/api',
    },
  },
  contracts: {
    ...chainConfig.contracts,
    disputeGameFactory: {
      [sourceId]: {
        address: '0xfB8c0915ad20ad38D16ce904651639dcc4073062',
      },
    },
    l2OutputOracle: {
      [sourceId]: {
        address: '0x31584aA9bBDcF32938a47B46579859C6a5a1FeF4',
      },
    },
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 0,
    },
    portal: {
      [sourceId]: {
        address: '0x24C83C822EADCC5C4A432aB00A030E338d3713a2',
      },
    },
    l1StandardBridge: {
      [sourceId]: {
        address: '0xf76fEd96b34F80BdefDAC20c3163834703B2d536',
      },
    },
  },
  testnet: true,
  sourceId,
})
