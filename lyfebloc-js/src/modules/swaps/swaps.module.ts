import { AUTO, SubgraphPoolBase, SwapInfo, SwapTypes } from '@lyfebloc/auto';
import { Reserve__factory, Reserve } from '@lyfebloc/typechain';
import {
  BatchSwap,
  QuerySimpleFlashSwapParameters,
  QuerySimpleFlashSwapResponse,
  QueryWithAutoInput,
  QueryWithAutoOutput,
  SimpleFlashSwapParameters,
  FindRouteParameters,
  BuildTransactionParameters,
  SwapAttributes,
  SwapType,
} from './types';
import {
  queryBatchSwap,
  queryBatchSwapWithAuto,
  getAutoSwapInfo,
} from './queryBatchSwap';
import { lyfeblocReserve } from '@/lib/constants/config';
import { getLimitsForSlippage } from './helpers';
import { LyfeblocSdkConfig } from '@/types';
import { SwapInput } from './types';
import { Auto } from '@/modules/auto/auto.module';
import {
  convertSimpleFlashSwapToBatchSwapParameters,
  querySimpleFlashSwap,
} from './flashSwap';
import {
  SingleSwapBuilder,
  BatchSwapBuilder,
} from '@/modules/swaps/swap_builder';

export class Swaps {
  readonly auto: AUTO;
  chainId: number;
  reserveContract: Reserve;

  // TODO: sorOrConfig - let's make it more predictable and always pass configuration explicitly
  constructor(sorOrConfig: AUTO | LyfeblocSdkConfig) {
    if (sorOrConfig instanceof AUTO) {
      this.auto = sorOrConfig;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.chainId = (<any>this.auto.provider)['_network']['chainId'];
    } else {
      this.auto = new Auto(sorOrConfig);
      this.chainId = sorOrConfig.network as number;
    }

    this.reserveContract = Reserve__factory.connect(
      lyfeblocReserve,
      this.auto.provider
    );
  }

  static getLimitsForSlippage(
    tokensIn: string[],
    tokensOut: string[],
    swapType: SwapType,
    deltas: string[],
    assets: string[],
    slippage: string
  ): string[] {
    // TO DO - Check best way to do this?
    const limits = getLimitsForSlippage(
      tokensIn,
      tokensOut,
      swapType,
      deltas,
      assets,
      slippage
    );

    return limits.map((l) => l.toString());
  }

  /**
   * Uses AUTO to find optimal route for a trading pair and amount
   *
   * @param FindRouteParameters
   * @param FindRouteParameters.tokenIn Address
   * @param FindRouteParameters.tokenOut Address
   * @param FindRouteParameters.amount BigNumber with a trade amount
   * @param FindRouteParameters.gasPrice BigNumber current gas price
   * @param FindRouteParameters.maxPools number of pool included in path
   * @returns Best trade route information
   */
  async findRouteGivenIn({
    tokenIn,
    tokenOut,
    amount,
    gasPrice,
    maxPools = 4,
  }: FindRouteParameters): Promise<SwapInfo> {
    return this.auto.getSwaps(tokenIn, tokenOut, SwapTypes.SwapExactIn, amount, {
      gasPrice,
      maxPools,
    });
  }

  /**
   * Uses AUTO to find optimal route for a trading pair and amount
   *
   * @param FindRouteParameters
   * @param FindRouteParameters.tokenIn Address
   * @param FindRouteParameters.tokenOut Address
   * @param FindRouteParameters.amount BigNumber with a trade amount
   * @param FindRouteParameters.gasPrice BigNumber current gas price
   * @param FindRouteParameters.maxPools number of pool included in path
   * @returns Best trade route information
   */
  async findRouteGivenOut({
    tokenIn,
    tokenOut,
    amount,
    gasPrice,
    maxPools,
  }: FindRouteParameters): Promise<SwapInfo> {
    return this.auto.getSwaps(
      tokenIn,
      tokenOut,
      SwapTypes.SwapExactOut,
      amount,
      {
        gasPrice,
        maxPools,
      }
    );
  }

  /**
   * Uses AUTO to find optimal route for a trading pair and amount
   *
   * @param BuildTransactionParameters
   * @param BuildTransactionParameters.userAddress Address
   * @param BuildTransactionParameters.swapInfo result of route finding
   * @param BuildTransactionParameters.kind 0 - givenIn, 1 - givenOut
   * @param BuildTransactionParameters.deadline BigNumber block timestamp
   * @param BuildTransactionParameters.maxSlippage [bps], eg: 1 === 0.01%, 100 === 1%
   * @returns transaction request ready to send with signer.sendTransaction
   */
  buildSwap({
    userAddress,
    recipient,
    swapInfo,
    kind,
    deadline,
    maxSlippage,
  }: BuildTransactionParameters): SwapAttributes {
    if (!this.chainId) throw 'Missing network configuration';

    // one vs batch (gas cost optimisation when using single swap)
    const builder =
      swapInfo.swaps.length > 1
        ? new BatchSwapBuilder(swapInfo, kind, this.chainId)
        : new SingleSwapBuilder(swapInfo, kind, this.chainId);
    builder.setFunds(userAddress, recipient);
    builder.setDeadline(deadline);
    builder.setLimits(maxSlippage);

    const to = builder.to();
    const { functionName } = builder;
    const attributes = builder.attributes();
    const data = builder.data();
    const value = builder.value(maxSlippage);

    return { to, functionName, attributes, data, value };
  }

  /**
   * Encode batchSwap in an ABI byte string
   *
   * [See method for a batchSwap](https://dev.lyfebloc.com/references/contracts/apis/the-Reserve#batch-swaps).
   *
   * _NB: This method doesn't execute a batchSwap -- it returns an [ABI byte string](https://docs.soliditylang.org/en/latest/abi-spec.html)
   * containing the data of the function call on a contract, which can then be sent to the network to be executed.
   * (ex. [sendTransaction](https://web3js.readthedocs.io/en/v1.2.11/web3-eth.html#sendtransaction)).
   *
   * @param {BatchSwap}           batchSwap - BatchSwap information used for query.
   * @param {SwapType}            batchSwap.kind - either exactIn or exactOut
   * @param {BatchSwapSteps[]}    batchSwap.swaps - sequence of swaps
   * @param {string[]}            batchSwap.assets - array contains the addresses of all assets involved in the swaps
   * @param {FundManagement}      batchSwap.funds - object containing information about where funds should be taken/sent
   * @param {number[]}            batchSwap.limits - limits for each token involved in the swap, where either the maximum number of tokens to send (by passing a positive value) or the minimum amount of tokens to receive (by passing a negative value) is specified
   * @param {string}              batchSwap.deadline -  time (in Unix timestamp) after which it will no longer attempt to make a trade
   * @returns {string}            encodedBatchSwapData - Returns an ABI byte string containing the data of the function call on a contract
   */
  static encodeBatchSwap(batchSwap: BatchSwap): string {
    const reserveInterface = Reserve__factory.createInterface();

    return reserveInterface.encodeFunctionData('batchSwap', [
      batchSwap.kind,
      batchSwap.swaps,
      batchSwap.assets,
      batchSwap.funds,
      batchSwap.limits,
      batchSwap.deadline,
    ]);
  }

  /**
   * Encode simple flash swap into a ABI byte string
   *
   * A "simple" flash swap is an arbitrage executed with only two tokens and two pools,
   * swapping in the first pool and then back in the second pool for a profit. For more
   * complex flash swaps, you will have to use the batch swap method.
   *
   * Learn more: A [Flash Swap](https://dev.lyfebloc.com/resources/swaps/flash-swaps).
   *
   * @param {SimpleFlashSwapParameters}   params - BatchSwap information used for query.
   * @param {string}                      params.flashLoanAmount - initial input amount for the flash loan (first asset)
   * @param {string[]}                    params.poolIds - array of Lyfebloc pool ids
   * @param {string[]}                    params.assets - array of token addresses
   * @param {string}                      params.walletAddress - array of token addresses
   * @returns {string}                    encodedBatchSwapData - Returns an ABI byte string containing the data of the function call on a contract
   */
  static encodeSimpleFlashSwap(params: SimpleFlashSwapParameters): string {
    return this.encodeBatchSwap(
      convertSimpleFlashSwapToBatchSwapParameters(params)
    );
  }

  /**
   * fetchPools saves updated pools data to AUTO internal onChainBalanceCache.
   * @param {SubgraphPoolBase[]} [poolsData=[]] If poolsData passed uses this as pools source otherwise fetches from config.subgraphUrl.
   * @param {boolean} [isOnChain=true] If isOnChain is true will retrieve all required onChain data via multicall otherwise uses subgraph values.
   * @returns {boolean} Boolean indicating whether pools data was fetched correctly (true) or not (false).
   */
  async fetchPools(): Promise<boolean> {
    return this.auto.fetchPools();
  }

  public getPools(): SubgraphPoolBase[] {
    return this.auto.getPools();
  }

  /**
   * queryBatchSwap simulates a call to `batchSwap`, returning an array of Reserve asset deltas.
   * @param batchSwap - BatchSwap information used for query.
   * @param {SwapType} batchSwap.kind - either exactIn or exactOut.
   * @param {BatchSwapStep[]} batchSwap.swaps - sequence of swaps.
   * @param {string[]} batchSwap.assets - array contains the addresses of all assets involved in the swaps.
   * @returns {Promise<string[]>} Returns an array with the net Reserve asset balance deltas. Positive amounts represent tokens (or ETH) sent to the
   * Reserve, and negative amounts represent tokens (or ETH) sent by the Reserve. Each delta corresponds to the asset at
   * the same index in the `assets` array.
   */
  async queryBatchSwap(
    batchSwap: Pick<BatchSwap, 'kind' | 'swaps' | 'assets'>
  ): Promise<string[]> {
    return await queryBatchSwap(
      this.reserveContract,
      batchSwap.kind,
      batchSwap.swaps,
      batchSwap.assets
    );
  }

  /**
   * Uses AUTO to create and query a batchSwap.
   * @param {QueryWithAutoInput} queryWithAuto - Swap information used for querying using AUTO.
   * @param {string[]} queryWithAuto.tokensIn - Array of addresses of assets in.
   * @param {string[]} queryWithAuto.tokensOut - Array of addresses of assets out.
   * @param {SwapType} queryWithAuto.swapType - Type of Swap, ExactIn/Out.
   * @param {string[]} queryWithAuto.amounts - Array of amounts used in swap.
   * @param {FetchPoolsInput} queryWithAuto.fetchPools - Set whether AUTO will fetch updated pool info.
   * @returns {Promise<QueryWithAutoOutput>} Returns amount of tokens swaps along with swap and asset info that can be submitted to a batchSwap call.
   */
  async queryBatchSwapWithAuto(
    queryWithAuto: QueryWithAutoInput
  ): Promise<QueryWithAutoOutput> {
    return await queryBatchSwapWithAuto(
      this.auto,
      this.reserveContract,
      queryWithAuto
    );
  }

  /**
   * Simple interface to test if a simple flash swap is valid and see potential profits.
   *
   * A "simple" flash swap is an arbitrage executed with only two tokens and two pools,
   * swapping in the first pool and then back in the second pool for a profit. For more
   * complex flash swaps, you will have to use the batch swap method.
   *
   * Learn more: A [Flash Swap](https://dev.lyfebloc.com/resources/swaps/flash-swaps).
   *
   * _NB: This method doesn't execute a flashSwap
   *
   * @param {SimpleFlashSwapParameters}   params - BatchSwap information used for query.
   * @param {string}                      params.flashLoanAmount - initial input amount for the flash loan (first asset)
   * @param {string[]}                    params.poolIds - array of Lyfebloc pool ids
   * @param {string[]}                    params.assets - array of token addresses
   * @returns {Promise<{profits: Record<string, string>, isProfitable: boolean}>}       Returns an ethersjs transaction response
   */
  async querySimpleFlashSwap(
    params: Omit<QuerySimpleFlashSwapParameters, 'reserveContract'>
  ): Promise<QuerySimpleFlashSwapResponse> {
    return await querySimpleFlashSwap({
      ...params,
      reserveContract: this.reserveContract,
    });
  }

  /**
   * Use AUTO to get swapInfo for tokenIn<>tokenOut.
   * @param {SwapInput} swapInput - Swap information used for querying using AUTO.
   * @param {string} swapInput.tokenIn - Addresse of asset in.
   * @param {string} swapInput.tokenOut - Addresse of asset out.
   * @param {SwapType} swapInput.swapType - Type of Swap, ExactIn/Out.
   * @param {string} swapInput.amount - Amount used in swap.
   * @returns {Promise<SwapInfo>} AUTO swap info.
   */
  async getAutoSwap(swapInput: SwapInput): Promise<SwapInfo> {
    return await getAutoSwapInfo(
      swapInput.tokenIn,
      swapInput.tokenOut,
      swapInput.swapType,
      swapInput.amount,
      this.auto
    );
  }
}
