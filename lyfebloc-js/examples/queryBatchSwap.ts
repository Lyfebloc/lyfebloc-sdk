import dotenv from 'dotenv';
import { AddressZero } from '@ethersproject/constants';
import {
  LyfeblocSDK,
  Network,
  SwapType,
  BatchSwapStep,
  LyfeblocSdkConfig,
} from '../src/index';
import { ADDRESSES } from '../src/test/lib/constants';

dotenv.config();

async function runQueryBatchSwap() {
  const config: LyfeblocSdkConfig = {
    network: Network.MAINNET,
    rpcUrl: `http://127.0.0.1:8545`,
  };
  const lyfebloc = new LyfeblocSDK(config);

  const swapType = SwapType.SwapExactIn;
  const swaps: BatchSwapStep[] = [
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
  ];

  const assets: string[] = [
    // Lyfebloc use the zero address for ETH and the Reserve will wrap/unwrap as neccessary
    AddressZero,
    // USDC
    ADDRESSES[Network.MAINNET].USDC.address,
    // LYFE
    ADDRESSES[Network.MAINNET].LYFE.address
  ];

  const deltas = await lyfebloc.swaps.queryBatchSwap({
    kind: swapType,
    swaps,
    assets,
  });
  console.log(deltas.toString());
}

// yarn examples:run ./examples/queryBatchSwap.ts
runQueryBatchSwap();
