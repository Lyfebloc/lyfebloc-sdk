import * as AUTO from '@lyfebloc/auto';

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
import { StablePoolEncoder } from '@/pool-stable';
import { _upscaleArray } from '@/lib/utils/solidityMaths';

export class StablePoolJoin implements JoinConcern {
  /**
   * Build join pool transaction parameters with exact tokens in and minimum LBPT out based on slippage tolerance
   * @param {JoinPoolParameters}  params - parameters used to build exact tokens in for LBPT out transaction
   * @param {string}              params.joiner - Account address joining pool
   * @param {Pool}                params.pool - Subgraph pool object of pool being joined
   * @param {string[]}            params.tokensIn - Token addresses provided for joining pool (same length and order as amountsIn)
   * @param {string[]}            params.amountsIn -  - Token amounts provided for joining pool in EVM amounts
   * @param {string}              params.slippage - Maximum slippage tolerance in bps i.e. 50 = 0.5%
   * @returns                     transaction request ready to send with signer.sendTransaction
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

    // Check if there's any relevant stable pool info missing
    if (pool.tokens.some((token) => !token.decimals))
      throw new LyfeblocError(LyfeblocErrorCode.MISSING_DECIMALS);
    if (!pool.amp) throw new LyfeblocError(LyfeblocErrorCode.MISSING_AMP);

    // Parse pool info into EVM amounts in order to match amountsIn scalling
    const {
      parsedTokens,
      parsedAmp,
      parsedTotalShares,
      parsedSwapFee,
      scalingFactors,
      upScaledBalances,
    } = parsePoolInfo(pool);

    const assetHelpers = new AssetHelpers(wrappedNativeAsset);
    // sort inputs
    const [sortedTokens, sortedAmountsIn] = assetHelpers.sortTokens(
      tokensIn,
      amountsIn
    ) as [string[], string[]];
    // sort pool info
    const [, sortedUpscaledBalances, sortedScalingFactors] =
      assetHelpers.sortTokens(
        parsedTokens,
        upScaledBalances,
        scalingFactors
      ) as [string[], string[], string[]];

    // Maths should use upscaled amounts, e.g. 1USDC => 1e18 not 1e6
    const scaledAmountsIn = _upscaleArray(
      sortedAmountsIn.map((a) => BigInt(a)),
      sortedScalingFactors.map((a) => BigInt(a))
    );

    const expectedBPTOut = AUTO.StableMathBigInt._calcBptOutGivenExactTokensIn(
      BigInt(parsedAmp as string),
      sortedUpscaledBalances.map((b) => BigInt(b)),
      scaledAmountsIn,
      BigInt(parsedTotalShares),
      BigInt(parsedSwapFee)
    ).toString();

    const minBPTOut = subSlippage(
      BigNumber.from(expectedBPTOut),
      BigNumber.from(slippage)
    ).toString();

    const userData = StablePoolEncoder.joinExactTokensInForBPTOut(
      sortedAmountsIn,
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
        maxAmountsIn: sortedAmountsIn,
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
