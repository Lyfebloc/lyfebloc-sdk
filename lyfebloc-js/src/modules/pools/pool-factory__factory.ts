import { LyfeblocNetworkConfig, PoolType } from '@/types';
import { LyfeblocError, LyfeblocErrorCode } from '@/lyfeblocErrors';
import { PoolFactory } from '@/modules/pools/factory/pool-factory';
import { ComposableStableFactory } from '@/modules/pools/factory/composable-stable/composable-stable.factory';
import { WeightedFactory } from '@/modules/pools/factory/weighted/weighted.factory';

/**
 * Wrapper around pool type specific methods.
 *
 * Returns a class instance of a type specific factory.
 */
export class PoolFactory__factory {
  networkConfig: LyfeblocNetworkConfig;

  constructor(networkConfig: LyfeblocNetworkConfig) {
    this.networkConfig = networkConfig;
  }

  of(poolType: PoolType): PoolFactory {
    switch (poolType) {
      case 'Weighted':
        return new WeightedFactory(this.networkConfig);
      case 'Investment':
      case 'LiquidityBootstrapping': {
        throw new LyfeblocError(LyfeblocErrorCode.UNSUPPORTED_POOL_TYPE);
      }
      case 'Stable': {
        throw new LyfeblocError(LyfeblocErrorCode.UNSUPPORTED_POOL_TYPE);
      }
      case 'ComposableStable': {
        return new ComposableStableFactory(this.networkConfig);
      }
      case 'MetaStable': {
        throw new LyfeblocError(LyfeblocErrorCode.UNSUPPORTED_POOL_TYPE);
      }
      case 'StablePhantom': {
        throw new LyfeblocError(LyfeblocErrorCode.UNSUPPORTED_POOL_TYPE);
      }
      case 'AaveLinear':
      case 'ERC4626Linear': {
        throw new LyfeblocError(LyfeblocErrorCode.UNSUPPORTED_POOL_TYPE);
      }
      default:
        throw new LyfeblocError(LyfeblocErrorCode.UNSUPPORTED_POOL_TYPE);
    }
  }
}
