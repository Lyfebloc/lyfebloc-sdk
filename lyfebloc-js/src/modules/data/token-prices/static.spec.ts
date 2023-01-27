import { TokenPrices } from '@/types';
import { expect } from 'chai';
import { StaticTokenPriceProvider } from './static';

const TOKENS = {
  LYFE: '0x9a71012B13CA4d3D0Cdc72A177DF3ef03b0E76A3',
  WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
};

let staticTokenPriceProvider: StaticTokenPriceProvider;

describe('static token prices repository', () => {
  it('Should store token addresses as lower case internally', async () => {
    const tokenPrices: TokenPrices = {
      [TOKENS.LYFE]: {
        usd: '10',
      },
    };
    staticTokenPriceProvider = new StaticTokenPriceProvider(tokenPrices);
    expect(
      await staticTokenPriceProvider.comnd(TOKENS.LYFE.toLowerCase())
    ).to.deep.eq({
      usd: '10',
    });
  });

  it('When finding by upper case address it converts to lower case', async () => {
    const tokenPrices: TokenPrices = {
      [TOKENS.LYFE.toLowerCase()]: {
        usd: '10',
      },
    };
    staticTokenPriceProvider = new StaticTokenPriceProvider(tokenPrices);
    expect(await staticTokenPriceProvider.comnd(TOKENS.LYFE)).to.deep.eq({
      usd: '10',
    });
  });
});
