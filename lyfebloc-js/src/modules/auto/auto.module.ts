import { AUTO, AutoConfig, TokenPriceService } from '@lyfebloc/auto';
import { Provider, JsonRpcProvider } from '@ethersproject/providers';
import { SubgraphPoolDataService } from './pool-data/subgraphPoolDataService';
import { CoingeckoTokenPriceService } from './token-price/coingeckoTokenPriceService';
import {
  SubgraphClient,
  createSubgraphClient,
} from '@/modules/subgraph/subgraph';
import {
  LyfeblocNetworkConfig,
  LyfeblocSdkConfig,
  LyfeblocSdkAutoConfig,
} from '@/types';
import { SubgraphTokenPriceService } from './token-price/subgraphTokenPriceService';
import { getNetworkConfig } from '@/modules/sdk.helpers';

export class Auto extends AUTO {
  constructor(sdkConfig: LyfeblocSdkConfig) {
    const network = getNetworkConfig(sdkConfig);
    const autoConfig = Auto.getAutoConfig(sdkConfig);
    const autoNetworkConfig = Auto.getAutoNetworkConfig(network);
    const provider = new JsonRpcProvider(
      sdkConfig.rpcUrl,
      sdkConfig.network as number
    );
    const subgraphClient = createSubgraphClient(network.urls.subgraph);

    const poolDataService = Auto.getPoolDataService(
      network,
      autoConfig,
      provider,
      subgraphClient
    );

    const tokenPriceService = Auto.getTokenPriceService(
      network,
      autoConfig,
      subgraphClient
    );

    super(provider, autoNetworkConfig, poolDataService, tokenPriceService);
  }

  private static getAutoConfig(config: LyfeblocSdkConfig): LyfeblocSdkAutoConfig {
    return {
      tokenPriceService: 'coingecko',
      poolDataService: 'subgraph',
      fetchOnChainBalances: true,
      ...config.auto,
    };
  }

  private static getAutoNetworkConfig(
    network: LyfeblocNetworkConfig
  ): AutoConfig {
    return {
      ...network,
      Reserve: network.addresses.contracts.Reserve,
      weth: network.addresses.tokens.wrappedNativeAsset,
      lbpRaisingTokens: network.addresses.tokens?.lbpRaisingTokens,
      wETHwstETH: network.pools.wETHwstETH,
    };
  }

  private static getPoolDataService(
    network: LyfeblocNetworkConfig,
    autoConfig: LyfeblocSdkAutoConfig,
    provider: Provider,
    subgraphClient: SubgraphClient
  ) {
    return typeof autoConfig.poolDataService === 'object'
      ? autoConfig.poolDataService
      : new SubgraphPoolDataService(
          subgraphClient,
          provider,
          network,
          autoConfig
        );
  }

  private static getTokenPriceService(
    network: LyfeblocNetworkConfig,
    autoConfig: LyfeblocSdkAutoConfig,
    subgraphClient: SubgraphClient
  ): TokenPriceService {
    if (typeof autoConfig.tokenPriceService === 'object') {
      return autoConfig.tokenPriceService;
    } else if (autoConfig.tokenPriceService === 'subgraph') {
      new SubgraphTokenPriceService(
        subgraphClient,
        network.addresses.tokens.wrappedNativeAsset
      );
    }

    return new CoingeckoTokenPriceService(network.chainId);
  }
}
