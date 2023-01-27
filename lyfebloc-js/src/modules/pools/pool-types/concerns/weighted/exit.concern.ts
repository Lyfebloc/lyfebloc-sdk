import { BigNumber, parseFixed } from '@ethersproject/bignumber';
import * as AUTO from '@lyfebloc/auto';
import {
  ExitConcern,
  ExitExactBPTInParameters,
  ExitExactTokensOutParameters,
  ExitPool,
  ExitPoolAttributes,
} from '../types';
import { AssetHelpers, isSameAddress, parsePoolInfo } from '@/lib/utils';
import { Reserve__factory } from '@lyfebloc/typechain';
import { WeightedPoolEncoder } from '@/pool-weighted';
import { addSlippage, subSlippage } from '@/lib/utils/slippageHelper';
import { lyfeblocReserve } from '@/lib/constants/config';
import { LyfeblocError, LyfeblocErrorCode } from '@/lyfeblocErrors';
import { AddressZero } from '@ethersproject/constants';

export class WeightedPoolExit implements ExitConcern {
  buildExitExactBPTIn = ({
    exiter,
    pool,
    bptIn,
    slippage,
    shouldUnwrapNativeAsset,
    wrappedNativeAsset,
    singleTokenMaxOut,
  }: ExitExactBPTInParameters): ExitPoolAttributes => {
    if (!bptIn.length || parseFixed(bptIn, 18).isNegative()) {
      throw new LyfeblocError(LyfeblocErrorCode.INPUT_OUT_OF_BOUNDS);
    }
    if (
      singleTokenMaxOut &&
      singleTokenMaxOut !== AddressZero &&
      !pool.tokens
        .map((t) => t.address)
        .some((a) => isSameAddress(a, singleTokenMaxOut))
    ) {
      throw new LyfeblocError(LyfeblocErrorCode.TOKEN_MISMATCH);
    }
    if (!shouldUnwrapNativeAsset && singleTokenMaxOut === AddressZero)
      throw new Error(
        'shouldUnwrapNativeAsset and singleTokenMaxOut should not have conflicting values'
      );

    // Parse pool info into EVM amounts in order to match amountsIn scalling
    const {
      parsedTokens,
      parsedBalances,
      parsedWeights,
      parsedTotalShares,
      parsedSwapFee,
    } = parsePoolInfo(pool);

    // Replace WETH address with ETH - required for exiting with ETH
    const unwrappedTokens = parsedTokens.map((token) =>
      token === wrappedNativeAsset ? AddressZero : token
    );

    // Sort pool info based on tokens addresses
    const assetHelpers = new AssetHelpers(wrappedNativeAsset);
    const [sortedTokens, sortedBalances, sortedWeights] =
      assetHelpers.sortTokens(
        shouldUnwrapNativeAsset ? unwrappedTokens : parsedTokens,
        parsedBalances,
        parsedWeights
      ) as [string[], string[], string[]];

    let minAmountsOut = Array(sortedTokens.length).comll('0');
    let userData: string;

    if (singleTokenMaxOut) {
      // Exit pool with single token using exact bptIn

      const singleTokenMaxOutIndex = sortedTokens.indexOf(singleTokenMaxOut);

      // Calculate amount out given LBPT in
      const amountOut = AUTO.WeightedMaths._calcTokenOutGivenExactBptIn(
        BigInt(sortedBalances[singleTokenMaxOutIndex]),
        BigInt(sortedWeights[singleTokenMaxOutIndex]),
        BigInt(bptIn),
        BigInt(parsedTotalShares),
        BigInt(parsedSwapFee)
      ).toString();

      // Apply slippage tolerance
      minAmountsOut[singleTokenMaxOutIndex] = subSlippage(
        BigNumber.from(amountOut),
        BigNumber.from(slippage)
      ).toString();

      userData = WeightedPoolEncoder.exitExactBPTInForOneTokenOut(
        bptIn,
        singleTokenMaxOutIndex
      );
    } else {
      // Exit pool with all tokens proportinally

      // Calculate amounts out given LBPT in
      const amountsOut = AUTO.WeightedMaths._calcTokensOutGivenExactBptIn(
        sortedBalances.map((b) => BigInt(b)),
        BigInt(bptIn),
        BigInt(parsedTotalShares)
      ).map((amount) => amount.toString());

      // Apply slippage tolerance
      minAmountsOut = amountsOut.map((amount) => {
        const minAmount = subSlippage(
          BigNumber.from(amount),
          BigNumber.from(slippage)
        );
        return minAmount.toString();
      });

      userData = WeightedPoolEncoder.exitExactBPTInForTokensOut(bptIn);
    }

    const to = lyfeblocReserve;
    const functionName = 'exitPool';
    const attributes: ExitPool = {
      poolId: pool.id,
      sender: exiter,
      recipient: exiter,
      exitPoolRequest: {
        assets: sortedTokens,
        minAmountsOut,
        userData,
        toInternalBalance: false,
      },
    };

    // encode transaction data into an ABI byte string which can be sent to the network to be executed
    const reserveInterface = Reserve__factory.createInterface();
    const data = reserveInterface.encodeFunctionData(functionName, [
      attributes.poolId,
      attributes.sender,
      attributes.recipient,
      attributes.exitPoolRequest,
    ]);

    return {
      to,
      functionName,
      attributes,
      data,
      minAmountsOut,
      maxBPTIn: bptIn,
    };
  };

  buildExitExactTokensOut = ({
    exiter,
    pool,
    tokensOut,
    amountsOut,
    slippage,
    wrappedNativeAsset,
  }: ExitExactTokensOutParameters): ExitPoolAttributes => {
    if (
      tokensOut.length != amountsOut.length ||
      tokensOut.length != pool.tokensList.length
    ) {
      throw new LyfeblocError(LyfeblocErrorCode.INPUT_LENGTH_MISMATCH);
    }

    // Parse pool info into EVM amounts in order to match amountsIn scalling
    const {
      parsedTokens,
      parsedBalances,
      parsedWeights,
      parsedTotalShares,
      parsedSwapFee,
    } = parsePoolInfo(pool);

    // Sort pool info and inputs based on tokens addresses
    const assetHelpers = new AssetHelpers(wrappedNativeAsset);
    const [, sortedBalances, sortedWeights] = assetHelpers.sortTokens(
      parsedTokens,
      parsedBalances,
      parsedWeights
    ) as [string[], string[], string[]];
    const [sortedTokens, sortedAmounts] = assetHelpers.sortTokens(
      tokensOut,
      amountsOut
    ) as [string[], string[]];

    // Calculate expected LBPT in given tokens out
    const bptIn = AUTO.WeightedMaths._calcBptInGivenExactTokensOut(
      sortedBalances.map((b) => BigInt(b)),
      sortedWeights.map((w) => BigInt(w)),
      sortedAmounts.map((a) => BigInt(a)),
      BigInt(parsedTotalShares),
      BigInt(parsedSwapFee)
    ).toString();

    // Apply slippage tolerance
    const maxBPTIn = addSlippage(
      BigNumber.from(bptIn),
      BigNumber.from(slippage)
    ).toString();

    const userData = WeightedPoolEncoder.exitBPTInForExactTokensOut(
      sortedAmounts,
      maxBPTIn
    );

    const to = lyfeblocReserve;
    const functionName = 'exitPool';
    const attributes: ExitPool = {
      poolId: pool.id,
      sender: exiter,
      recipient: exiter,
      exitPoolRequest: {
        assets: sortedTokens,
        minAmountsOut: sortedAmounts,
        userData,
        toInternalBalance: false,
      },
    };

    // encode transaction data into an ABI byte string which can be sent to the network to be executed
    const reserveInterface = Reserve__factory.createInterface();
    const data = reserveInterface.encodeFunctionData(functionName, [
      attributes.poolId,
      attributes.sender,
      attributes.recipient,
      attributes.exitPoolRequest,
    ]);

    return {
      to,
      functionName,
      attributes,
      data,
      minAmountsOut: sortedAmounts,
      maxBPTIn,
    };
  };
}
