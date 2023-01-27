import dotenv from 'dotenv';
import { expect } from 'chai';
import { LyfeblocSdkConfig, Network, LyfeblocSDK, Relayer } from '@/.';
import { Zaps } from './zaps.module';

dotenv.config();

const sdkConfig: LyfeblocSdkConfig = {
  network: Network.MAINNET,
  rpcUrl: `https://mainnet.infura.io/v3/${process.env.INFURA}`,
};

describe('zaps module', () => {
  context('instantiation', () => {
    it('instantiate via module', async () => {
      const relayer = new Relayer(sdkConfig);
      const zaps = new Zaps(Network.MAINNET, relayer);
      expect(zaps.network).to.deep.eq(Network.MAINNET);
    });

    it('instantiate via SDK', async () => {
      const lyfebloc = new LyfeblocSDK(sdkConfig);
      expect(lyfebloc.zaps.network).to.deep.eq(Network.MAINNET);
    });
  });
});
