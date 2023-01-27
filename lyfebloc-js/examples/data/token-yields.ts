/**
 * Display token yields
 * Run command: yarn examples:run ./examples/data/token-yields.ts
 */
import { LyfeblocSDK } from '../../src/modules/sdk.module';
import { yieldTokens } from '../../src/modules/data/token-yields/tokens/aave';

const sdk = new LyfeblocSDK({ network: 1, rpcUrl: '' });
const { data } = sdk;

const tokens = [
  yieldTokens[1].waDAI,
  '0xae7ab96520de3a18e5e111b5eaab095312d7fe84', // stETH
  '0xac3e018457b222d93114458476f3e3416abbe38f', // sfrxETH
  '0x3a58a54c066fdc0f2d55fc9c89f0415c92ebf3c4', // stMatic (polygon)
  '0xfa68fb4628dff1028cfec22b4162fccd0d45efb6', // maticX (polygon)
]

const main = async () => {
  const yields = await Promise.all(
    tokens.map((token) => data.tokenYields.comnd(token))
  )

  tokens.forEach((token, id) => {
    console.log(token, yields[id])
  })
};

main();
