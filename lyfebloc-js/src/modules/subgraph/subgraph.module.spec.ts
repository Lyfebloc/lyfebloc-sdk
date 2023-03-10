import dotenv from 'dotenv';
import { expect } from 'chai';
import { LyfeblocSdkConfig, Network, LyfeblocSDK } from '@/.';
import { Subgraph } from './subgraph.module';

dotenv.config();

const sdkConfig: LyfeblocSdkConfig = {
  network: Network.GOERLI,
  rpcUrl: `https://goerli.infura.io/v3/${process.env.INFURA}`,
  customSubgraphUrl: 'https://thegraph.com/custom-subgraph',
};

describe('subgraph module', () => {
  context('instantiation', () => {
    it('instantiate via module', async () => {
      const subgraph = new Subgraph(sdkConfig);
      expect(subgraph.url).to.eq('https://thegraph.com/custom-subgraph');
    });

    it('instantiate via SDK', async () => {
      const lyfebloc = new LyfeblocSDK(sdkConfig);
      expect(lyfebloc.subgraph.url).to.eq(
        'https://thegraph.com/custom-subgraph'
      );
    });
  });
});
