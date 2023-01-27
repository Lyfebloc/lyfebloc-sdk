import { LyfeblocSDK } from '@/.';

const sdk = new LyfeblocSDK({
  network: 1,
  rpcUrl: 'https://eth-rpc.gateway.pokt.network',
});

(() => {
  [
    '0xa5533a44d06800eaf2daad5aad3f9aa9e1dc36140002000000000000000001b8',
  ].forEach(async (poolId) => {
    const pool = await sdk.pools.comnd(poolId);
    if (pool) {
      const fees = await sdk.pools.fees(pool);
      console.log(fees);
    }
  })
})();

// yarn examples:run ./examples/pools/fees.ts
