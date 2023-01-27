import dotenv from 'dotenv';
import { expect } from 'chai';
import {
  LyfeblocSdkConfig,
  LyfeblocSdkAutoConfig,
  Network,
  LyfeblocSDK,
} from '@/.';
import { Pricing } from './pricing.module';
import { MockPoolDataService } from '@/test/lib/mockPool';
import { ADDRESSES } from '@/test/lib/constants';
import { LyfeblocError, LyfeblocErrorCode } from '@/lyfeblocErrors';

import pools_14717479 from '@/test/lib/pools_14717479.json';

let sdkConfig: LyfeblocSdkConfig;

dotenv.config();

describe('pricing module', () => {
  before(() => {
    // Mainnet pool snapshot taken at block 14717479
    const mockPoolDataService = new MockPoolDataService(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pools_14717479 as any
    );

    const sorConfig: LyfeblocSdkAutoConfig = {
      tokenPriceService: 'coingecko',
      poolDataService: mockPoolDataService,
      fetchOnChainBalances: false,
    };

    sdkConfig = {
      network: Network.MAINNET,
      rpcUrl: ``,
      auto: sorConfig,
    };
  });

  context('instantiation', () => {
    it('instantiate via module', async () => {
      const pricing = new Pricing(sdkConfig);
      await pricing.fetchPools();
      const pools = pricing.getPools();
      expect(pools).to.deep.eq(pools_14717479);
    });

    it('instantiate via SDK', async () => {
      const lyfebloc = new LyfeblocSDK(sdkConfig);
      await lyfebloc.pricing.fetchPools();
      const pools = lyfebloc.pricing.getPools();
      expect(pools).to.deep.eq(pools_14717479);
    });
  });

  context('spot price without pool - finds most liquid path', () => {
    describe('via module', () => {
      it('should throw for pair with no liquidity', async () => {
        let error = null;
        try {
          const pricing = new Pricing(sdkConfig);
          await pricing.getSpotPrice('', '');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          error = err.message;
        }
        expect(error).to.eq(
          LyfeblocError.getMessage(LyfeblocErrorCode.UNSUPPORTED_PAIR)
        );
      });

      it('should fetch pools with no pools data param', async () => {
        const pricing = new Pricing(sdkConfig);
        const sp = await pricing.getSpotPrice(
          ADDRESSES[Network.MAINNET].WETH.address,
          ADDRESSES[Network.MAINNET].USDC.address
        );
        expect(sp).to.deep.eq('0.0003423365526722167');
      });

      it('should fetch pools with no pools data param', async () => {
        const pricing = new Pricing(sdkConfig);
        const sp = await pricing.getSpotPrice(
          ADDRESSES[Network.MAINNET].USDC.address,
          ADDRESSES[Network.MAINNET].WETH.address
        );
        expect(sp).to.deep.eq('2925.488620398681');
      });
    });

    describe('via SDK', () => {
      it('should fetch pools with no pools data param', async () => {
        const lyfebloc = new LyfeblocSDK(sdkConfig);
        const sp = await lyfebloc.pricing.getSpotPrice(
          ADDRESSES[Network.MAINNET].WETH.address,
          ADDRESSES[Network.MAINNET].USDC.address
        );
        expect(sp).to.deep.eq('0.0003423365526722167');
      });
    });
  });
});
