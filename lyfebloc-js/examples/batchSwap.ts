import dotenv from 'dotenv';
import { LyfeblocSDK } from '../src/index';
import { AddressZero } from '@ethersproject/constants';
import { Wallet } from '@ethersproject/wallet';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Network, SwapType } from '../src/index';
import { Swaps } from '../src/modules/swaps/swaps.module';
import { lyfeblocReserve } from '../src/lib/constants/config';
import { ADDRESSES } from '../src/test/lib/constants';

dotenv.config();

/*
Example showing how to encode and send a batch swap transaction.
Uses local fork of mainnet: $ yarn run node
*/
async function runBatchSwap() {

  const rpcUrl = `http://127.0.0.1:8545`;
  const provider = new JsonRpcProvider(rpcUrl, Network.MAINNET);
  // Take TRADER_KEY from forked account
  const { TRADER_KEY } = process.env;
  const wallet = new Wallet(TRADER_KEY as string, provider);

  const encodedBatchSwapData = Swaps.encodeBatchSwap({
    kind: SwapType.SwapExactIn,
    swaps: [
      // First pool swap: 0.01ETH > USDC
      {
        poolId:
          '0x96646936b91d6b9d7d0c47c496afbf3d6ec7b6f8000200000000000000000019',
        // ETH
        assetInIndex: 0,
        // USDC
        assetOutIndex: 1,
        amount: '10000000000000000',
        userData: '0x',
      },
      // Second pool swap: 0.01ETH > LYFE
      {
        poolId:
          '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014',
        // ETH
        assetInIndex: 0,
        // LYFE
        assetOutIndex: 2,
        amount: '10000000000000000',
        userData: '0x',
      },
    ],
    assets: [
      // Lyfebloc use the zero address for ETH and the Reserve will wrap/unwrap as neccessary
      AddressZero,
      // USDC
      ADDRESSES[Network.MAINNET].USDC.address,
      // LYFE
      ADDRESSES[Network.MAINNET].LYFE.address
    ],
    funds: {
      fromInternalBalance: false,
      // These can be different addresses!
      recipient: wallet.address,
      sender: wallet.address,
      toInternalBalance: false,
    },
    limits: ['20000000000000000', '0', '0'], // +ve for max to send, -ve for min to receive
    deadline: '999999999999999999', // Infinity
  });

  const lyfebloc = new LyfeblocSDK({
    network: Network.MAINNET,
    rpcUrl,
  });
  const usdcContract = lyfebloc.contracts.ERC20(ADDRESSES[Network.MAINNET].USDC.address, provider);
  const balContract = lyfebloc.contracts.ERC20(ADDRESSES[Network.MAINNET].LYFE.address, provider);

  let ethBalance = await wallet.getBalance();
  let usdcBalance = await usdcContract.balanceOf(wallet.address);
  let balBalance = await balContract.balanceOf(wallet.address);
  console.log(`Balances before: `);
  console.log(`ETH: ${ethBalance.toString()}`);
  console.log(`USDC: ${usdcBalance.toString()}`);
  console.log(`LYFE: ${balBalance.toString()}`);

  const tx = await wallet.sendTransaction({
    data: encodedBatchSwapData,
    to: lyfeblocReserve,
    value: '20000000000000000'
    /**
     * The following gas inputs are optional,
     **/
    // gasPrice: '6000000000',
    // gasLimit: '2000000',
  });

  ethBalance = await wallet.getBalance();
  usdcBalance = await usdcContract.balanceOf(wallet.address);
  balBalance = await balContract.balanceOf(wallet.address);
  console.log(`Balances after: `);
  console.log(`ETH: ${ethBalance.toString()}`);
  console.log(`USDC: ${usdcBalance.toString()}`);
  console.log(`LYFE: ${balBalance.toString()}`);
}

// yarn examples:run ./examples/batchSwap.ts
runBatchSwap();
