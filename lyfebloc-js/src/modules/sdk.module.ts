import { LyfeblocSdkConfig, LyfeblocNetworkConfig } from '@/types';
import { Swaps } from './swaps/swaps.module';
import { Relayer } from './relayer/relayer.module';
import { Subgraph } from './subgraph/subgraph.module';
import { Auto } from './auto/auto.module';
import { getNetworkConfig } from './sdk.helpers';
import { Pricing } from './pricing/pricing.module';
import { ContractInstances, Contracts } from './contracts/contracts.module';
import { Zaps } from './zaps/zaps.module';
import { Pools } from './pools';
import { Data } from './data';
import { Provider } from '@ethersproject/providers';

export interface LyfeblocSDKRoot {
  config: LyfeblocSdkConfig;
  auto: Auto;
  subgraph: Subgraph;
  pools: Pools;
  data: Data;
  swaps: Swaps;
  relayer: Relayer;
  networkConfig: LyfeblocNetworkConfig;
  rpcProvider: Provider;
}

export class LyfeblocSDK implements LyfeblocSDKRoot {
  readonly swaps: Swaps;
  readonly relayer: Relayer;
  readonly pricing: Pricing;
  readonly pools: Pools;
  readonly data: Data;
  lyfeblocContracts: Contracts;
  zaps: Zaps;
  readonly networkConfig: LyfeblocNetworkConfig;
  readonly provider: Provider;

  constructor(
    public config: LyfeblocSdkConfig,
    public auto = new Auto(config),
    public subgraph = new Subgraph(config)
  ) {
    this.networkConfig = getNetworkConfig(config);
    this.provider = auto.provider;

    this.data = new Data(
      this.networkConfig,
      auto.provider,
      config.subgraphQuery
    );
    this.swaps = new Swaps(this.config);
    this.relayer = new Relayer(this.swaps);
    this.pricing = new Pricing(config, this.swaps);
    this.pools = new Pools(this.networkConfig, this.data);

    this.lyfeblocContracts = new Contracts(
      this.networkConfig.addresses.contracts,
      auto.provider
    );
    this.zaps = new Zaps(this.networkConfig.chainId);
  }

  get rpcProvider(): Provider {
    return this.auto.provider;
  }

  /**
   * Expose lyfebloc contracts, e.g. Reserve, LidoRelayer.
   */
  get contracts(): ContractInstances {
    return this.lyfeblocContracts.contracts;
  }
}
