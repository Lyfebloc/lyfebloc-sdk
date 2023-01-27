import { PriceImpactConcern } from '@/modules/pools/pool-types/concerns/types';
import {
  ONE,
  BZERO,
  _computeScalingFactor,
  _upscale,
} from '@/lib/utils/solidityMaths';
import { calcPriceImpact } from '@/modules/pricing/priceImpact';
import { LyfeblocError, LyfeblocErrorCode } from '@/lyfeblocErrors';
import { Pool } from '@/types';
import { bptSpotPrice } from '@/lib/utils/stableMathHelpers';
import { parsePoolInfo } from '@/lib/utils';

export class StablePoolPriceImpact implements PriceImpactConcern {
  /**
   * Calculates the LBPT return amount when investing with no price impact.
   * @param { Pool } pool Investment pool.
   * @param { bigint [] } amounts Token amounts being invested. Needs a value for each pool token.
   * @returns { bigint } LBPT amount.
   */
  bptZeroPriceImpact(pool: Pool, tokenAmounts: bigint[]): bigint {
    if (tokenAmounts.length !== pool.tokensList.length)
      throw new LyfeblocError(LyfeblocErrorCode.INPUT_LENGTH_MISMATCH);

    // upscales amp, swapfee, totalshares
    const { parsedBalances, parsedDecimals, parsedAmp, parsedTotalShares } =
      parsePoolInfo(pool);

    const decimals = parsedDecimals.map((decimals) => {
      if (!decimals)
        throw new LyfeblocError(LyfeblocErrorCode.MISSING_DECIMALS);
      return BigInt(decimals);
    });
    if (!parsedAmp)
      throw new LyfeblocError(LyfeblocErrorCode.MISSING_PRICE_RATE);
    const totalShares = BigInt(parsedTotalShares);

    const scalingFactors = decimals.map((decimals) =>
      _computeScalingFactor(BigInt(decimals))
    );
    const balances = parsedBalances.map((balance, i) =>
      _upscale(BigInt(balance), scalingFactors[i])
    );

    let bptZeroPriceImpact = BZERO;
    for (let i = 0; i < balances.length; i++) {
      const price = bptSpotPrice(
        BigInt(parsedAmp), // this already includes the extra digits from precision
        balances,
        totalShares,
        i
      );
      const scalingFactor = _computeScalingFactor(BigInt(decimals[i]));
      const amountUpscaled = _upscale(tokenAmounts[i], scalingFactor);
      const newTerm = (price * amountUpscaled) / ONE;
      bptZeroPriceImpact += newTerm;
    }
    return bptZeroPriceImpact;
  }

  calcPriceImpact(
    pool: Pool,
    tokenAmounts: string[],
    bptAmount: string,
    isJoin: boolean
  ): string {
    const bptZeroPriceImpact = this.bptZeroPriceImpact(
      pool,
      tokenAmounts.map((a) => BigInt(a))
    );
    return calcPriceImpact(
      BigInt(bptAmount),
      bptZeroPriceImpact,
      isJoin
    ).toString();
  }
}
