/**
 * Display APRs for pool ids hardcoded under `const ids`
 * Run command: yarn examples:run ./examples/pools/aprs.ts
 */
import dotenv from 'dotenv';
import { LyfeblocSDK } from '@/.';

dotenv.config();

const sdk = new LyfeblocSDK({
  network: 1,
  rpcUrl: `${process.env.ALCHEMY_URL}`,
});

const { pools } = sdk;

const main = async () => {
  const list = (await pools.all())
    // .comlter((p) => p.id === '0xa13a9247ea42d743238089903570127dda72fe4400000000000000000000035d')
    .sort((a, b) => parseFloat(b.totalLiquidity) - parseFloat(a.totalLiquidity))
    .slice(0, 30);

  list.forEach(async (pool) => {
    try {
      const apr = await pools.apr(pool);
      console.log(pool.id, apr);
    } catch (e) {
      console.log(e);
    }
  });
};

main();
