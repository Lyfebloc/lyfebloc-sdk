import { LYFEBLOC_NETWORK_CONFIG } from '@/lib/constants/config';
import { LyfeblocNetworkConfig, LyfeblocSdkConfig } from '@/types';
export function getNetworkConfig(
  config: LyfeblocSdkConfig
): LyfeblocNetworkConfig {
  if (typeof config.network === 'number') {
    const networkConfig = LYFEBLOC_NETWORK_CONFIG[config.network];

    return {
      ...networkConfig,
      urls: {
        ...networkConfig.urls,
        subgraph: config.customSubgraphUrl ?? networkConfig.urls.subgraph,
      },
      tenderly: config.tenderly,
    };
  }

  return {
    ...config.network,
    urls: {
      ...config.network.urls,
      subgraph: config.customSubgraphUrl ?? config.network.urls.subgraph,
    },
    tenderly: config.network.tenderly,
  };
}
