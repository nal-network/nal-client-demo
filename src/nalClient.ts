// import { publicClientL1, publicClientL2, walletClientL1, walletClientL2, account, usdtInfo } from './config/configNalMainnet'
import { publicClientL1, publicClientL2, walletClientL1, walletClientL2, account, usdtInfo } from './config/configNalSepolia'
import { tokenType, chainType } from "./config/define"
import { parseEther, formatEther, GetTransactionReceiptReturnType, Hash, Withdrawal } from 'viem'
import { getL2TransactionHashes, GetWithdrawalsReturnType } from 'viem/op-stack'
import { erc20Abi, getAddress } from 'viem'
import { l1StandardBridgeABI, l2StandardBridgeABI } from '@eth-optimism/contracts-ts'
import { digiAbi } from './abibin/digiAbi'

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

async function getL1L2Balance() {
    console.log("L1 wallet:" + formatEther(await publicClientL1.getBalance({address : account.address})));
    console.log("L2 wallet:" + formatEther(await publicClientL2.getBalance({address : account.address})));
}

async function depositETH() {
    console.log("Before deposit:");
    await getL1L2Balance();

    // Build parameters for the transaction on the L2.
    const args = await publicClientL2.buildDepositTransaction({
        mint: parseEther('0.05'),
        to: account.address,
    })

    // Execute the deposit transaction on the L1.
    const hash = await walletClientL1.depositTransaction(args)
    console.log("L1 tx hash:" + hash);
   
    // Wait for the L1 transaction to be processed.
    const receipt = await publicClientL1.waitForTransactionReceipt({ hash });
    console.log("Finish L1 tx receipt:" + JSON.stringify(receipt));
   
    // Get the L2 transaction hash from the L1 transaction receipt.
    const [l2Hash] = getL2TransactionHashes(receipt)
    console.log("L2 tx hash:" + l2Hash);
   
    // Wait for the L2 transaction to be processed.
    const l2Receipt = await publicClientL2.waitForTransactionReceipt({ hash: l2Hash });
    console.log("Finish L2 tx receipt: " + JSON.stringify(l2Receipt));
    
    console.log("After deposit:");
    await getL1L2Balance();
}

async function withdrawETH() {
    console.log("Before withdraw:");
    await getL1L2Balance();
    
    const receipt = await withdrawInitStep1(tokenType.ETH, parseEther("1"));

    const status = await publicClientL1.getWithdrawalStatus({
        receipt,
        targetChain: walletClientL2.chain
    })
    console.log(status);

    const [withdrawal] = await withdrawProveStep2(receipt);
    
    const status2 = await publicClientL1.getWithdrawalStatus({
        receipt,
        targetChain: walletClientL2.chain
    })
    console.log(status2);
   
    await withdrawFinalStep3([withdrawal], receipt);

    console.log("After deposit:");
    await getL1L2Balance();
}

async function depositERC20(){
    console.log("Before deposit:")
    console.log("L1Wallet: " + (await publicClientL1.readContract({
        abi: erc20Abi, address: usdtInfo.addrL1, functionName: "balanceOf", args: [account.address]})))
    console.log("L2Wallet: " + (await publicClientL2.readContract({
        abi: erc20Abi, address: usdtInfo.addrL2, functionName: "balanceOf", args: [account.address]})))

    // decimal is 6, It is one usdt below;
    const usdtTransfer = 100000000n;

    //1. approve
    const hash = await walletClientL1.writeContract({
        abi: erc20Abi,
        address: usdtInfo.addrL1,
        functionName: 'approve',
        args: [
            getAddress(publicClientL2.chain.contracts.l1StandardBridge[publicClientL2.chain.sourceId].address), 
            usdtTransfer],
    });
    
    // const hash = "0x8165b36712cc270e5bae...de344b561213d01b1";
    console.log("L1 ERC20 Approve tx hash: " + hash);
    // Wait for the L1 transaction to be processed.
    const receipt = await publicClientL1.waitForTransactionReceipt({ hash });
    console.log("Finish L1 ERC20 Approve TX:" + JSON.stringify(receipt));

    //2. call contract depositERC20
    const depositHash = await walletClientL1.writeContract({
        abi: l1StandardBridgeABI,
        address: getAddress(publicClientL2.chain.contracts.l1StandardBridge[publicClientL2.chain.sourceId].address),
        functionName: "depositERC20To",
        args: [usdtInfo.addrL1, usdtInfo.addrL2, account.address, usdtTransfer, 0, "0x"]
    });
    console.log("L1 ERC20 deposit tx hash: " + depositHash);
    // Wait for the L1 transaction to be processed.
    const depositReceipt = await publicClientL1.waitForTransactionReceipt({ hash: depositHash });
    console.log("Finish L1 ERC20 deposit TX:" + JSON.stringify(depositReceipt));

    // Get the L2 transaction hash from the L1 transaction receipt.
    const [l2Hash] = getL2TransactionHashes(depositReceipt)
    console.log("L2 ERC20 deposit tx hash:" + l2Hash);
   
    // Wait for the L2 transaction to be processed.
    const l2Receipt = await publicClientL2.waitForTransactionReceipt({ hash: l2Hash });
    console.log("Finish L2 ERC20 deposit TX: " + JSON.stringify(l2Receipt));

    console.log("after deposit:")
    console.log("l1Wallet: " + (await publicClientL1.readContract({
        abi: erc20Abi, address: usdtInfo.addrL1, functionName: "balanceOf", args: [account.address]})))
    console.log("l2Wallet: " + (await publicClientL2.readContract({
        abi: erc20Abi, address: usdtInfo.addrL2, functionName: "balanceOf", args: [account.address]})))
}

async function withdrawERC20(){
    console.log("Before withdraw:")
    console.log("l1Wallet: " + (await publicClientL1.readContract({
        abi: erc20Abi, address: usdtInfo.addrL1, functionName: "balanceOf", args: [account.address]})))
    console.log("l2Wallet: " + (await publicClientL2.readContract({
        abi: erc20Abi, address: usdtInfo.addrL2, functionName: "balanceOf", args: [account.address]})))
    //decimal is 6, It is one usdt below;
    const usdtTransfer = 100000000n;

    //1. L2 withdraw, if not standard L2 erc20, need approve first
    const receipt = await withdrawInitStep1(tokenType.ERC20, usdtTransfer);
    // const receipt = await withdrawInitStep1(tokenType.ERC20, usdtTransfer, false, "0xa1b2f...fb88");

    const status = await publicClientL1.getWithdrawalStatus({
        receipt,
        targetChain: walletClientL2.chain
    })
    console.log(status);

    //2. L1 submit proof;
    const [withdrawal] = await withdrawProveStep2(receipt);
    
    const status2 = await publicClientL1.getWithdrawalStatus({
        receipt,
        targetChain: walletClientL2.chain
    })
    console.log(status2);

    //3. L1 submit finalize;
    await withdrawFinalStep3([withdrawal], receipt);

    console.log("After deposit:")
    console.log("l1Wallet: " + (await publicClientL1.readContract({
        abi: erc20Abi, address: usdtInfo.addrL1, functionName: "balanceOf", args: [account.address]})))
    console.log("l2Wallet: " + (await publicClientL2.readContract({
        abi: erc20Abi, address: usdtInfo.addrL2, functionName: "balanceOf", args: [account.address]})))
}

async function withdrawInitStep1(tokenT : tokenType, amount : bigint, isFirst = true, hash? : string) {
    let hash_ = <Hash>hash;
    if(isFirst){
        if(tokenType.ETH == tokenT) {
            // Build parameters to initiate the withdrawal transaction on the L1.
            const args = await publicClientL1.buildInitiateWithdrawal({
                to: account.address,
                // value: parseEther('0.01')
                value: amount
            })
            // Execute the initiate withdrawal transaction on the L2.
            hash_ = await walletClientL2.initiateWithdrawal(args)
        }
        else if(tokenType.ERC20 == tokenT) {
            hash_ = await walletClientL2.writeContract({
                abi: l2StandardBridgeABI,
                address: getAddress(publicClientL2.chain.contracts.l2StandardBridge.address),
                functionName: 'withdrawTo',
                args: [usdtInfo.addrL2, account.address, amount, 0, "0x"],
            });
        }
    }
    
    console.log("L2 withdraw tx hash:" + hash_);

    // Wait for the initiate withdrawal transaction receipt.
    const receipt = await publicClientL2.waitForTransactionReceipt({ hash : hash_ })
    console.log("Finish L2 withdraw receipt: " + JSON.stringify(receipt));
    return receipt;
}

async function withdrawProveStep2(receipt :GetTransactionReceiptReturnType, onlyGetWithdrawal=false){
    console.log("l2 withdraw hash:" + receipt.transactionHash);
    // Wait until the withdrawal is ready to prove.
    const { output, withdrawal } = await publicClientL1.waitToProve({
        receipt,
        targetChain: walletClientL2.chain
    })
    
    console.log("output:" + JSON.stringify(output));
    console.log("withdrawal:" + JSON.stringify(withdrawal));
    if(onlyGetWithdrawal){
        return [withdrawal];
    }

    // Build parameters to prove the withdrawal on the L2.
    const proveArgs = await publicClientL2.buildProveWithdrawal({
        output,
        withdrawal,
    })

    // Prove the withdrawal on the L1.
    const proveHash = await walletClientL1.proveWithdrawal(proveArgs)
    console.log("L1 proveHash: " + proveHash);
   
    // Wait until the prove withdrawal is processed.
    const proveReceipt = await publicClientL1.waitForTransactionReceipt({
        hash: proveHash
    })
    console.log("L1 prove tx receipt:" + JSON.stringify(proveReceipt));
    return [withdrawal];
}

async function withdrawFinalStep3(withdrawal :GetWithdrawalsReturnType, receipt :GetTransactionReceiptReturnType){
    // Wait until the withdrawal is ready to finalize.
    const realWithdrawal = withdrawal[0];
    await publicClientL1.waitToFinalize({
        targetChain: walletClientL2.chain,
        withdrawalHash: realWithdrawal.withdrawalHash,
    })
    const status = await publicClientL1.getWithdrawalStatus({
        receipt,
        targetChain: walletClientL2.chain
    })
    console.log("Withdraw Final Step3:" + status);
    await delay(5000);
    // Finalize the withdrawal.
    const finalizeHash = await walletClientL1.finalizeWithdrawal({
        targetChain: walletClientL2.chain,
        withdrawal: realWithdrawal,
        gas: null,
    })
    console.log("L1 finalizeHash: " + finalizeHash);

    // Wait until the withdrawal is finalized.
    const finalizeReceipt = await publicClientL1.waitForTransactionReceipt({
        hash: finalizeHash
    })
    console.log("L1 finalize tx receipt:" + JSON.stringify(finalizeReceipt));
}

async function transferETH(chainT = chainType.l2) {
    const reciever = "0x6A46F3b8e1F12F4f3382C7Aedb5C1B893125DcBD";
    console.log("Before transfer:");

    let hash : Hash
    if(chainType.l1 == chainT) {
        console.log("Sender wallet:" + formatEther(await publicClientL1.getBalance({address : account.address})));
        console.log("Reciever wallet:" + formatEther(await publicClientL1.getBalance({address : reciever})));
        hash = await walletClientL1.sendTransaction({
            to: reciever,
            value: parseEther("1.577"),
            // nonce: 0,
            // gasPrice: parseEther("0.0000001")
        })
        console.log("tx hash: " + hash);
        const receipt = await publicClientL1.waitForTransactionReceipt({hash});
        console.log("tx receipt: " + JSON.stringify(receipt));

        console.log("After transfer:");
        console.log("Sender wallet:" + formatEther(await publicClientL1.getBalance({address : account.address})));
        console.log("Reciever wallet:" + formatEther(await publicClientL1.getBalance({address : reciever})));
    } else {
        console.log("Sender wallet:" + formatEther(await publicClientL2.getBalance({address : account.address})));
        console.log("Reciever wallet:" + formatEther(await publicClientL2.getBalance({address : reciever})));
        hash = await walletClientL2.sendTransaction({
            to: reciever,
            value: parseEther("0.01"),
            data: "0x"
        })
        console.log("tx hash: " + hash);
        const receipt = await publicClientL2.waitForTransactionReceipt({hash});
        console.log("tx receipt: " + JSON.stringify(receipt));

        console.log("After transfer:");
        console.log("Sender wallet:" + formatEther(await publicClientL2.getBalance({address : account.address})));
        console.log("Reciever wallet:" + formatEther(await publicClientL2.getBalance({address : reciever})));
    }
}

async function transferERC20() {
    const reciever = "0x5c54Eab4B15B83B7050Bf9ECF333896CAad79A8B";
    console.log("before transfer:")
    console.log("Sender: " + (await publicClientL2.readContract({
        abi: erc20Abi, address: usdtInfo.addrL2, functionName: "balanceOf", args: [account.address]})))
    console.log("Reciever: " + (await publicClientL2.readContract({
        abi: erc20Abi, address: usdtInfo.addrL2, functionName: "balanceOf", args: [reciever]})))

    const hash = await walletClientL2.writeContract({
        abi: erc20Abi,
        address: usdtInfo.addrL2,
        functionName: 'transfer',
        args: [reciever, 1000000000000000000n],
    });
    console.log("erc20 tx hash: " + hash);
    const receipt = await publicClientL2.waitForTransactionReceipt({hash});
    console.log("erc20 tx receipt: " + JSON.stringify(receipt));

    console.log("after transfer:")
    console.log("Sender: " + (await publicClientL2.readContract({
        abi: erc20Abi, address: usdtInfo.addrL2, functionName: "balanceOf", args: [account.address]})))
    console.log("Reciever: " + (await publicClientL2.readContract({
        abi: erc20Abi, address: usdtInfo.addrL2, functionName: "balanceOf", args: [reciever]})))
}

async function faucetUSDT(){
    const sepUSDTAbi = [{ constant: true, inputs: [{ name: "_owner", type: "address" }], name: "balanceOf", outputs: [{ name: "balance", type: "uint256" }], type: "function" }, { inputs: [], name: "faucet", outputs: [], stateMutability: "nonpayable", type: "function" }];

    const hash = await walletClientL1.writeContract({
        abi: sepUSDTAbi,
        address: usdtInfo.addrL1,
        functionName: 'faucet'
    });
    console.log("L1 USDT faucet tx hash: " + hash);
    // Wait for the L1 transaction to be processed.
    const receipt = await publicClientL1.waitForTransactionReceipt({ hash });
    console.log("Finish L1 USDT faucet TX:" + JSON.stringify(receipt));
}

async function digiCoin() {
    const transferAmount = 5000000n;
    const digiProxy = "0x3201...a95c4bD";
    const orderId = 123456n;
    const receiver = "0x5c54E...9A8B";
    const hash = await walletClientL2.writeContract({
        abi: erc20Abi,
        address: usdtInfo.addrL2,
        functionName: 'approve',
        args: [digiProxy, transferAmount],
    });
    console.log("erc20 approve tx hash: " + hash);
    const receipt = await publicClientL2.waitForTransactionReceipt({hash});
    console.log("erc20 tx receipt: " + JSON.stringify(receipt));

    const transferHash = await walletClientL2.writeContract({
        abi: digiAbi,
        address: digiProxy,
        functionName: 'transferFrom',
        args: [0, orderId, receiver, transferAmount],
    });
    console.log("digiCoinColl tx hash: " + transferHash);
    const transferReceipt = await publicClientL2.waitForTransactionReceipt({hash: transferHash});
    console.log("digiCoinColl tx receipt: " + JSON.stringify(transferReceipt));
}

function delay(ms: number){
    return new Promise( resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log("L1 blockNumber:"+ await publicClientL1.getBlockNumber());
    console.log("L2 blockNumber:"+ await publicClientL2.getBlockNumber());
    
    // await depositETH();
    // await withdrawETH();

    // faucetUSDT();
    // await depositERC20();
    // await withdrawERC20();

    // await transferETH(chainType.l2);
    // await transferERC20();

    await digiCoin();
}

main();