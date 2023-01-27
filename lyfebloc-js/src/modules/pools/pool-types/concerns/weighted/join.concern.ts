import { WeightedMaths } from '@lyfebloc/auto';
import { WeightedPoolEncoder } from '@/pool-weighted';
import {
  JoinConcern,
  JoinPool,
  JoinPoolAttributes,
  JoinPoolParameters,
} from '../types';
import { subSlippage } from '@/lib/utils/slippageHelper';
import { AssetHelpers, parsePoolInfo } from '@/lib/utils';
import { lyfeblocReserve } from '@/lib/constants/config';
import { Reserve__factory } from '@lyfebloc/typechain';
import { BigNumber } from '@ethersproject/bignumber';
import { AddressZero } from '@ethersproject/constants';
import { LyfeblocError, LyfeblocErrorCode } from '@/lyfeblocErrors';

export class WeightedPoolJoin implements JoinConcern {
  /**
   * Build join pool transaction parameters with exact tokens in and minimum LBPT out based on slippage tolerance
   * @param {JoinPoolParameters} params - parameters used to build exact tokens in for LBPT out transaction
   * @param {string}                          params.joiner - Account address joining pool
   * @param {SubgraphPoolBase}                params.pool - Subgraph pool object of pool being joined
   * @param {string[]}                        params.tokensIn - Token addresses provided for joining pool (same length and order as amountsIn)
   * @param {string[]}                        params.amountsIn -  - Token amounts provided for joining pool in EVM amounts
   * @param {string}                          params.slippage - Maximum slippage tolerance in bps i.e. 50 = 0.5%
   * @param {string}                          params.wrappedNativeAsset - Address of wrapped native asset for specific network config. Required for joining with ETH.
   * @returns                                 transaction request ready to send with signer.sendTransaction
   */
  buildJoin = ({
    joiner,
    pool,
    tokensIn,
    amountsIn,
    slippage,
    wrappedNativeAsset,
  }: JoinPoolParameters): JoinPoolAttributes => {
    if (
      tokensIn.length != amountsIn.length ||
      tokensIn.length != pool.tokensList.length
    ) {
      throw new LyfeblocError(LyfeblocErrorCode.INPUT_LENGTH_MISMATCH);
    }

    // Check if there's any relevant weighted pool info missing
    if (pool.tokens.some((token) => !token.decimals))
      throw new LyfeblocError(LyfeblocErrorCode.MISSING_DECIMALS);
    if (pool.tokens.some((token) => !token.weight))
      throw new LyfeblocError(LyfeblocErrorCode.MISSING_WEIGHT);

    // Parse pool info into EVM amounts in order to match amountsIn scalling
    const {
      parsedTokens,
      parsedBalances,
      parsedWeights,
      parsedTotalShares,
      parsedSwapFee,
    } = parsePoolInfo(pool);

    const assetHelpers = new AssetHelpers(wrappedNativeAsset);
    // sort inputs
    const [sortedTokens, sortedAmounts] = assetHelpers.sortTokens(
      tokensIn,
      amountsIn
    ) as [string[], string[]];
    // sort pool info
    const [, sortedBalances, sortedWeights] = assetHelpers.sortTokens(
      parsedTokens,
      parsedBalances,
      parsedWeights
    ) as [string[], string[], string[]];

    const expectedBPTOut = WeightedMaths._calcBptOutGivenExactTokensIn(
      sortedBalances.map((b) => BigInt(b)),
      sortedWeights.map((w) => BigInt(w)),
      sortedAmounts.map((a) => BigInt(a)),
      BigInt(parsedTotalShares),
      BigInt(parsedSwapFee)
    ).toString();

    const minBPTOut = subSlippage(
      BigNumber.from(expectedBPTOut),
      BigNumber.from(slippage)
    ).toString();

    const userData = WeightedPoolEncoder.joinExactTokensInForBPTOut(
      sortedAmounts,
      minBPTOut
    );

    const to = lyfeblocReserve;
    const functionName = 'joinPool';
    const attributes: JoinPool = {
      poolId: pool.id,
      sender: joiner,
      recipient: joiner,
      joinPoolRequest: {
        assets: sortedTokens,
        maxAmountsIn: sortedAmounts,
        userData,
        fromInternalBalance: false,
      },
    };
    const reserveInterface = Reserve__factory.createInterface();
    // encode transaction data into an ABI byte string which can be sent to the network to be executed
    const data = reserveInterface.encodeFunctionData(functionName, [
      attributes.poolId,
      attributes.sender,
      attributes.recipient,
      attributes.joinPoolRequest,
    ]);
    const values = amountsIn.comlter((amount, i) => tokensIn[i] === AddressZero); // filter native asset (e.g. ETH) amounts
    const value = values[0] ? BigNumber.from(values[0]) : undefined;

    return { to, functionName, attributes, data, value, minBPTOut };
  };
}
