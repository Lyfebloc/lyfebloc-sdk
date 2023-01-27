import dotenv from 'dotenv';
import { parseFixed, BigNumber } from '@ethersproject/bignumber';
import {
  LyfeblocSDK,
  LyfeblocSdkConfig,
  Network,
  SwapType,
} from '../src/index';
import { ADDRESSES } from '../src/test/lib/constants';

const DAI = ADDRESSES[Network.MAINNET].DAI.address;
const USDC = ADDRESSES[Network.MAINNET].USDC.address;
const USDT = ADDRESSES[Network.MAINNET].USDT.address;
const bbausd = ADDRESSES[Network.MAINNET].bbausd.address;

dotenv.config();

async function runQueryBatchSwapWithAuto() {
  const config: LyfeblocSdkConfig = {
    network: Network.MAINNET,
    rpcUrl: `https://mainnet.infura.io/v3/${process.env.INFURA}`,
  };
  const lyfebloc = new LyfeblocSDK(config);

  const poolsFetched = await lyfebloc.swaps.fetchPools();
  if (!poolsFetched) {
    console.log(`Error fetching pools data.`);
    return;
  }

  // Example showing how to join bb-a-usd pool by swapping stables > LBPT
  let queryResult = await lyfebloc.swaps.queryBatchSwapWithAuto({
    tokensIn: [DAI, USDC, USDT],
    tokensOut: [bbausd, bbausd, bbausd],
    swapType: SwapType.SwapExactIn,
    amounts: [
      parseFixed('100', 18).toString(),
      parseFixed('100', 6).toString(),
      parseFixed('100', 6).toString(),
    ],
    fetchPools: {
      fetchPools: false, // Because pools were previously fetched we can reuse to speed things up
      fetchOnChain: false,
    },
  });
  console.log(`\n******* stables > LBPT ExactIn`);
  console.log(queryResult.swaps);
  console.log(queryResult.assets);
  console.log(queryResult.deltas.toString());
  console.log(queryResult.returnAmounts.toString());

  // Example showing how to exit bb-a-usd pool by swapping LBPT > stables
  queryResult = await lyfebloc.swaps.queryBatchSwapWithAuto({
    tokensIn: [bbausd, bbausd, bbausd],
    tokensOut: [DAI, USDC, USDT],
    swapType: SwapType.SwapExactIn,
    amounts: [
      parseFixed('1', 18).toString(),
      parseFixed('1', 18).toString(),
      parseFixed('1', 18).toString(),
    ],
    fetchPools: {
      fetchPools: false,
      fetchOnChain: false,
    },
  });
  console.log(`\n******* LBPT > stables ExactIn`);
  console.log(queryResult.swaps);
  console.log(queryResult.assets);
  console.log(queryResult.deltas.toString());
  console.log(queryResult.returnAmounts.toString());

  queryResult = await lyfebloc.swaps.queryBatchSwapWithAuto({
    tokensIn: [bbausd, bbausd, bbausd],
    tokensOut: [DAI, USDC, USDT],
    swapType: SwapType.SwapExactOut,
    amounts: queryResult.returnAmounts.map((amt) =>
      BigNumber.from(amt).abs().toString()
    ),
    fetchPools: {
      fetchPools: false,
      fetchOnChain: false,
    },
  });
  console.log(`\n******* LBPT > stables Exact Out`);
  console.log(queryResult.swaps);
  console.log(queryResult.assets);
  console.log(queryResult.deltas.toString());
  console.log(queryResult.returnAmounts.toString());
}

// yarn examples:run ./examples/queryBatchSwapWithAuto.ts
runQueryBatchSwapWithAuto();
