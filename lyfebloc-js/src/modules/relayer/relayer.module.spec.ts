import dotenv from 'dotenv';
import { expect } from 'chai';
import {
  LyfeblocSdkConfig,
  LyfeblocSdkAutoConfig,
  Network,
  LyfeblocSDK,
} from '@/.';
import { Relayer } from './relayer.module';
import { mockPool, mockPoolDataService } from '@/test/lib/mockPool';

dotenv.config();

const sorConfig: LyfeblocSdkAutoConfig = {
  tokenPriceService: 'coingecko',
  poolDataService: mockPoolDataService,
  fetchOnChainBalances: false,
};

const sdkConfig: LyfeblocSdkConfig = {
  network: Network.GOERLI,
  rpcUrl: `https://goerli.infura.io/v3/${process.env.INFURA}`,
  auto: sorConfig,
};

describe('relayer module', () => {
  context('instantiation', () => {
    it('instantiate via module', async () => {
      const relayer = new Relayer(sdkConfig);
      await relayer.fetchPools();
      const pools = relayer.getPools();
      expect(pools).to.deep.eq([mockPool]);
    });

    it('instantiate via SDK', async () => {
      const lyfebloc = new LyfeblocSDK(sdkConfig);

      await lyfebloc.relayer.fetchPools();
      const pools = lyfebloc.relayer.getPools();
      expect(pools).to.deep.eq([mockPool]);
    });
  });
});
