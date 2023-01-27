import dotenv from 'dotenv';
import { expect } from 'chai';
import {
  LyfeblocSdkConfig,
  LyfeblocSdkAutoConfig,
  Network,
  LyfeblocSDK,
} from '@/.';
import { mockPool, mockPoolDataService } from '@/test/lib/mockPool';
import { Auto } from './auto.module';

dotenv.config();

const autoConfig: LyfeblocSdkAutoConfig = {
  tokenPriceService: 'coingecko',
  poolDataService: mockPoolDataService,
  fetchOnChainBalances: false,
};

const sdkConfig: LyfeblocSdkConfig = {
  network: Network.GOERLI,
  rpcUrl: `https://goerli.infura.io/v3/${process.env.INFURA}`,
  auto: autoConfig,
};

describe('auto module', () => {
  context('instantiation', () => {
    it('instantiate via module', async () => {
      const auto = new Auto(sdkConfig);
      await auto.fetchPools();
      const pools = auto.getPools();
      expect(pools).to.deep.eq([mockPool]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const providerNetwork = (<any>auto.provider)['_network']['chainId'];
      expect(providerNetwork).to.eq(sdkConfig.network);
    });

    it('instantiate via SDK', async () => {
      const lyfebloc = new LyfeblocSDK(sdkConfig);

      await lyfebloc.auto.fetchPools();
      const pools = lyfebloc.auto.getPools();
      expect(pools).to.deep.eq([mockPool]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const providerNetwork = (<any>lyfebloc.auto.provider)['_network'][
        'chainId'
      ];
      expect(providerNetwork).to.eq(sdkConfig.network);
    });
  });
});
