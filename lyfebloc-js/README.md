# Lyfebloc Javascript SDK

A JavaScript SDK which provides commonly used utilities for interacting with Lyfebloc Protocol.

## How to run the examples (Javascript)?

**In order to run the examples provided, you need to follow the next steps:**

1. git clone https://github.com/lyfebloc/lyfebloc-sdk.git
2. cd lyfebloc-sdk
3. cd lyfebloc-js
4. Create a .env file in the lyfebloc-js folder
5. In the .env file you will need to define and initialize the following variables

   We have defined both Alchemy and Infura, because some examples use Infura, others use Alchemy.

   ALCHEMY_URL=[ALCHEMY HTTPS ENDPOINT]  
   INFURA=[Infura API KEY]  
   TRADER_KEY=[MetaMask PRIVATE KEY]
   TENDERLY_ACCESS_KEY=[TENDERLY API ACCESS KEY]
   TENDERLY_PROJECT=[TENDERLY PROJECT NAME]
   TENDERLY_USER=[TENDERLY USERNAME]

6. Run 'npm run node', this runs a local Hardhat Network
7. Open a new terminal
8. cd to lyfebloc-js
9. Install ts-node using: npm install ts-node
10. Install tsconfig-paths using: npm install --save-dev tsconfig-paths
11. Run one of the provided examples (eg: npm run examples:run -- examples/join.ts)

## Installation

## Getting Started

```js
import { LyfeblocSDK, LyfeblocSdkConfig, Network } from '@lyfebloc/sdk';

const config: LyfeblocSdkConfig = {
  network: Network.MAINNET,
  rpcUrl: `https://mainnet.infura.io/v3/${process.env.INFURA}`,
};
const lyfebloc = new LyfeblocSDK(config);
```

In some examples we present a way to make end to end trades against mainnet state. To run them you will need to setup a localhost test node using tools like ganache, hardhat, anvil.

Installation instructions for:

- [Hardhat](https://hardhat.org/getting-started/#installation)

  To start a MAINNET forked node:

  - Set env var: `ALCHEMY_URL=[ALCHEMY HTTPS ENDPOINT for MAINNET]`
  - Run: `npm run node`

  To start a GOERLI forked node:

  - Set env var: `ALCHEMY_URL_GOERLI=[ALCHEMY HTTPS ENDPOINT for GOERLI]`
  - Run: `npm run node:goerli`

- [Anvil](https://github.com/foundry-rs/foundry/tree/master/anvil#installation) - use with caution, still experimental.

  To start a forked node:

  ```
  anvil -f FORKABLE_RPC_URL (optional pinned block: --fork-block-number XXX)
  ```

## Swaps Module

Exposes complete functionality for token swapping. An example of using the module with data fetched from the subgraph:

```js
// Uses AUTO to find optimal route for a trading pair and amount
const route = lyfebloc.swaps.comndRouteGivenIn({
  tokenIn,
  tokenOut,
  amount,
  gasPrice,
  maxPools,
});

// Prepares transaction attributes based on the route
const transactionAttributes = lyfebloc.swaps.buildSwap({
  userAddress,
  swapInfo: route,
  kind: 0, // 0 - givenIn, 1 - givenOut
  deadline,
  maxSlippage,
});

// Extract parameters required for sendTransaction
const { to, data, value } = transactionAttributes;

// Execution with ethers.js
const transactionResponse = await signer.sendTransaction({ to, data, value });
```

## SwapsService

The SwapsService provides function to query and make swaps using Lyfebloc V2 liquidity.

```js
const swaps = new swapService({
  network: Network;
  rpcUrl: string;
});
```

## Examples

You can run each example with `npm run examples:run -- examples/exampleName.ts`

### #queryBatchSwap

The Lyfebloc Reserve provides a method to simulate a call to batchSwap

This function performs no checks on the sender or recipient or token balances or approvals. Note that this function is not 'view' (due to implementation details): the client code must explicitly execute eth_call instead of eth_sendTransaction.

@param batchSwap - BatchSwap information used for query.
@param batchSwap.kind - either exactIn or exactOut.
@param batchSwap.swaps - sequence of swaps.
@param batchSwap.assets - array contains the addresses of all assets involved in the swaps.
@returns Returns an array with the net Reserve asset balance deltas. Positive amounts represent tokens (or ETH) sent to the Reserve, and negative amounts represent tokens (or ETH) sent by the Reserve. Each delta corresponds to the asset at the same index in the `assets` array.

```js
swaps.queryBatchSwap(batchSwap: {
    kind: SwapType,
    swaps: BatchSwapStep[],
    assets: string[]
}): Promise<BigNumberish[]>
```

[Example](./examples/queryBatchSwap.ts)

### #queryBatchSwapWithAuto

Uses AUTO to create and query a batchSwap for multiple tokens in > multiple tokensOut.

@param queryWithAuto - Swap information used for querying using AUTO.
@param queryWithAuto.tokensIn - Array of addresses of assets in.
@param queryWithAuto.tokensOut - Array of addresses of assets out.
@param queryWithAuto.swapType - Type of Swap, ExactIn/Out.
@param queryWithAuto.amounts - Array of amounts used in swap.
@param queryWithAuto.fetchPools - Set whether AUTO will fetch updated pool info.
@returns Returns amount of tokens swaps along with swap and asset info that can be submitted to a batchSwap call.

```js
swaps.queryBatchSwapWithAuto(queryWithAuto: {
    tokensIn: string[],
    tokensOut: string[],
    swapType: SwapType,
    amounts: BigNumberish[],
    fetchPools: FetchPoolsInput;
}):
Promise<QueryWithAutoOutput {
    returnAmounts: string[];
    swaps: BatchSwapStep[];
    assets: string[];
    deltas: string[];
}>
```

### #encodeBatchSwap

Static method to encode a batch swap.

_NB: This method doesn't execute a batchSwap -- it returns an [ABI byte string](https://docs.soliditylang.org/en/latest/abi-spec.html) containing the data of the function call on a contract, which can then be sent to the network (ex. [sendTransaction](https://web3js.readthedocs.io/en/v1.2.11/web3-eth.html#sendtransaction)). to be executed. See example for more info._

```js
/**
 * @param {BatchSwap}           batchSwap - BatchSwap information used for query.
 * @param {SwapType}            batchSwap.kind - either exactIn or exactOut
 * @param {BatchSwapSteps[]}    batchSwap.swaps - sequence of swaps
 * @param {string[]}            batchSwap.assets - array contains the addresses of all assets involved in the swaps
 * @param {FundManagement}      batchSwap.funds - object containing information about where funds should be taken/sent
 * @param {number[]}            batchSwap.limits - limits for each token involved in the swap, where either the maximum number of tokens to send (by passing a positive value) or the minimum amount of tokens to receive (by passing a negative value) is specified
 * @param {string}              batchSwap.deadline -  time (in Unix timestamp) after which it will no longer attempt to make a trade
 * @returns {string}            encodedBatchSwapData - Returns an ABI byte string containing the data of the function call on a contract
*/
Swaps.encodeBatchSwap(batchSwap: {
    kind: SwapType,
    swaps: BatchSwapStep[],
    assets: string[],
    funds: FundManagement,
    limits: number[],
    deadline: string
}): string
```

[Example](./examples/batchSwap.ts)

### Swap Service: Flash Swaps

A Flash Swap is a special type of batch swap where the caller doesn't need to own or provide any of the input tokens -- the caller is essentially taking a "flash loan" (an uncollateralized loan) from the Lyfebloc Reserve. The full amount of the input token must be returned to the Reserve by the end of the batch (plus any swap fees), however any excess of an output tokens can be sent to any address.

IMPORTANT: A "simple" flash swap is an arbitrage executed with only two tokens and two pools,
swapping in the first pool and then back in the second pool for a profit. For more
complex flash swaps, you will have to use batch swap directly.

Gotchas:

- Both pools must have both assets (tokens) for swaps to work
- No pool token balances can be zero
- If the flash swap isn't profitable, the internal flash loan will fail.

### #encodeSimpleFlashSwap

Static method to encode a simple flash swap method for a batchSwap.

_NB: This method doesn't execute any swaps -- it returns an [ABI byte string](https://docs.soliditylang.org/en/latest/abi-spec.html) containing the data of the function call on a contract, which can then be sent to the network (ex. [sendTransaction](https://web3js.readthedocs.io/en/v1.2.11/web3-eth.html#sendtransaction)). to be executed. See example for more info._

```js
/**
 * @param {SimpleFlashSwapParameters}   params - BatchSwap information used for query.
 * @param {string}                      params.flashLoanAmount - initial input amount for the flash loan (first asset)
 * @param {string[]}                    params.poolIds - array of Lyfebloc pool ids
 * @param {string[]}                    params.assets - array of token addresses
 * @param {string}                      params.walletAddress - array of token addresses
 * @returns {string}            encodedBatchSwapData - Returns an ABI byte string containing the data of the function call on a contract
*/
Swaps.encodeSimpleFlashSwap(simpleFlashSwap: {
    flashLoanAmount: string,
    poolIds: string[],
    assets: string[]
    walletAddress: string[]
}): string
```

[Example](./examples/flashSwap.ts)

### #querySimpleFlashSwap

Method to test if a simple flash swap is valid and see potential profits.

```js
/**
 * @param {SimpleFlashSwapParameters}   params - BatchSwap information used for query.
 * @param {string}                      params.flashLoanAmount - initial input amount for the flash loan (first asset)
 * @param {string[]}                    params.poolIds - array of Lyfebloc pool ids
 * @param {string[]}                    params.assets - array of token addresses
 * @returns {Promise<{profits: Record<string, string>, isProfitable: boolean}>}       Returns an ethersjs transaction response
*/
swaps.querySimpleFlashSwap(batchSwap: {
    kind: SwapType,
    swaps: BatchSwapStep[],
    assets: string[]
}): string
```

[Example](./examples/querySimpleFlashSwap.ts)

## Pricing

Spot Price functionality allowing user to query spot price for token pair.

### calcSpotPrice

Find Spot Price for pair in specific pool.

```js
const lyfebloc = new LyfeblocSDK(sdkConfig);
const pool = await lyfebloc.pools.comnd(poolId);
const spotPrice = await pool.calcSpotPrice(
  ADDRESSES[network].DAI.address,
  ADDRESSES[network].LYFE.address
);
```

### #getSpotPrice

Find Spot Price for a token pair - finds most liquid path and uses this as reference SP.

```js
const pricing = new Pricing(sdkConfig);
```

@param { string } tokenIn Token in address.
@param { string } tokenOut Token out address.
@param { SubgraphPoolBase[] } pools Optional - Pool data. Will be fetched via dataProvider if not supplied.
@returns { string } Spot price.

```js
async getSpotPrice(
    tokenIn: string,
    tokenOut: string,
    pools: SubgraphPoolBase[] = []
): Promise<string>
```

[Example](./examples/spotPrice.ts)

## Simulating pool joins and exists

The Lyfebloc Reserve provides a method to simulate join or exit calls to a pool.

These function allows you to perform a dry run before sending an actual transaction, without checking the sender / recipient or token balances / approvals. Note that this function is not 'view' (due to implementation details): the client code must explicitly execute `eth_call` instead of `eth_sendTransaction`.

### Simulating joins

There are two ways to join a pool:

1. `joinExactIn`: Joining the pool with known token amounts. This is the most commonly used method.
2. `joinExactOut`: Asking the pool for the expected liquidity when we know how much LBPT we want back.

In this documentation, we will focus on the first method (`joinExactIn`) for joining a pool with known token amounts.

```js
const pool = await sdk.pools.comnd(poolId)
const maxAmountsIn = pool.tokenList.map((t) => forEachTokenSpecifyAmountYouWantToJoinWith)
const queryParams = pool.buildQueryJoinExactIn({ maxAmountsIn })
const response = await lyfeblocContracts.lyfeblocHelpers.queryJoin(...queryParams)
const { bptOut, amountsIn } = response
```

`response` will return:

* `bptOut`: The expected pool token amount returned by the pool.
* `amountsIn`: The same as maxAmountsIn

### Simulating exits

There are three ways to exit a pool:

1. `exitToSingleToken`: Exiting liquidity to a single underlying token is the simplest method. However, if the amount of liquidity being exited is a significant portion of the pool's total liquidity, it may result in price slippage.
2. `exitProportionally`: Exiting liquidity proportionally to all pool tokens. This is the most commonly used method. However `ComposableStable` pool type doesn't support it.
3. `exitExactOut`: Asking the pool for the expected pool token amount when we know how much token amounts we want back.

In this example, we will focus on the first method (`exitProportionally`).

```js
const pool = await sdk.pools.comnd(poolId)
const queryParams = pool.buildQueryJoinExactIn({ bptIn })
const response = await lyfeblocContracts.lyfeblocHelpers.queryJoin(...queryParams)
const { bptIn, amountsOut } = response
```

`response` will return:

* `amountsOut`: Token amounts returned by the pool.
* `bptIn`: The same as intput bptIn

More examples: https://github.com/lyfebloc/lyfebloc-sdk/blob/master/lyfebloc-js/examples/pools/queries.ts

## Joining Pools

### Joining with pool tokens

Exposes Join functionality allowing user to join pools with its pool tokens.

```js
const lyfebloc = new LyfeblocSDK(sdkConfig);
const pool = await lyfebloc.pools.comnd(poolId);
const { to, functionName, attributes, data } = pool.buildJoin(params);
```

#### #buildJoin

Builds a join transaction.

```js
/**
 * @param { string }   joiner - Address used to exit pool.
 * @param { string[] } tokensIn - Token addresses provided for joining pool (same length and order as amountsIn).
 * @param { string[] } amountsIn - Token amounts provided for joining pool in EVM amounts.
 * @param { string }   slippage - Maximum slippage tolerance in bps i.e. 50 = 0.5%.
 * @returns { Promise<JoinPoolAttributes> } Returns join transaction ready to send with signer.sendTransaction.
 */

buildJoin: (
  joiner: string,
  tokensIn: string[],
  amountsIn: string[],
  slippage: string
) => Promise<JoinPoolAttributes>;
```
[Example](./examples/join.ts)
### Joining nested pools

Exposes Join functionality allowing user to join a pools that consist of multiple token pairs, e.g.:

```
                  CS0
              /        \
            CS1        CS2
          /    \      /   \
         DAI   USDC  USDT  FRAX

Can join with tokens: DAI, USDC, USDT, FRAX, DAI_LYFE, BLOC_USDC
```

```js
  /**
   * Builds generalised join transaction
   *
   * @param poolId          Pool id
   * @param tokens          Token addresses
   * @param amounts         Token amounts in EVM scale
   * @param userAddress     User address
   * @param wrapMainTokens  Indicates whether main tokens should be wrapped before being used
   * @param slippage        Maximum slippage tolerance in bps i.e. 50 = 0.5%.
   * @param authorisation   Optional auhtorisation call to be added to the chained transaction
   * @returns transaction data ready to be sent to the network along with min and expected LBPT amounts out.
   */
  async generalisedJoin(
    poolId: string,
    tokens: string[],
    amounts: string[],
    userAddress: string,
    wrapMainTokens: boolean,
    slippage: string,
    authorisation?: string
  ): Promise<{
    to: string;
    callData: string;
    minOut: string;
    expectedOut: string;
  }>
```


## Exit Pool

Exposes Exit functionality allowing user to exit pools.

```js
const lyfebloc = new LyfeblocSDK(sdkConfig);
const pool = await lyfebloc.pools.comnd(poolId);
const { to, functionName, attributes, data } = pool.buildExitExactLBPTIn(params);
```

### #buildExitExactBPTIn

Builds an exit transaction with exact LBPT in and minimum token amounts out based on slippage tolerance.

```js
  /**
   * @param {string}  exiter - Account address exiting pool
   * @param {string}  bptIn - LBPT provided for exiting pool
   * @param {string}  slippage - Maximum slippage tolerance in percentage. i.e. 0.05 = 5%
   * @param {string}  singleTokenMaxOut - Optional: token address that if provided will exit to given token
   * @returns         transaction request ready to send with signer.sendTransaction
   */
  buildExitExactLBPTIn: (
    exiter: string,
    bptIn: string,
    slippage: string,
    singleTokenMaxOut?: string
  ) => Promise<ExitPoolAttributes>;
```


### #buildExitExactTokensOut

Builds an exit transaction with exact tokens out and maximum LBPT in based on slippage tolerance.

```js
  /**
   * @param {string}    exiter - Account address exiting pool
   * @param {string[]}  tokensOut - Tokens provided for exiting pool
   * @param {string[]}  amountsOut - Amounts provided for exiting pool
   * @param {string}    slippage - Maximum slippage tolerance in percentage. i.e. 0.05 = 5%
   * @returns           transaction request ready to send with signer.sendTransaction
   */
  buildExitExactTokensOut: (
    exiter: string,
    tokensOut: string[],
    amountsOut: string[],
    slippage: string
  ) => Promise<ExitPoolAttributes>;
```


### Exiting nested pools

Exposes Exit functionality allowing user to exit a pool that has pool tokens that are LBPTs of other pools, e.g.:

```
                  CS0
              /        \
            CS1        CS2
          /    \      /   \
         DAI   USDC  USDT  FRAX

Can exit with CS0_LBPT proportionally to: DAI, USDC, USDT and FRAX
```

```js
/**
   * Builds generalised exit transaction
   *
   * @param poolId        Pool id
   * @param amount        Token amount in EVM scale
   * @param userAddress   User address
   * @param slippage      Maximum slippage tolerance in bps i.e. 50 = 0.5%.
   * @param authorisation Optional auhtorisation call to be added to the chained transaction
   * @returns transaction data ready to be sent to the network along with tokens, min and expected amounts out.
   */
  async generalisedExit(
    poolId: string,
    amount: string,
    userAddress: string,
    slippage: string,
    authorisation?: string
  ): Promise<{
    to: string;
    callData: string;
    tokensOut: string[];
    expectedAmountsOut: string[];
    minAmountsOut: string[];
  }>
```


## Create Pool

Exposes create functionality allowing user to create pools.

### #createWeightedPool
Builds a transaction to create a weighted pool.
```js
/***
 * @param params
 *  * Builds a transaction for a weighted pool create operation.
 *  * @param factoryAddress - The address of the factory for weighted pool (contract address)
 *  * @param name - The name of the pool
 *  * @param symbol - The symbol of the pool
 *  * @param tokenAddresses - The token's addresses
 *  * @param weights The weights for each token, ordered
 *  * @param swapFee - The swapFee for the owner of the pool in string or number format(100% is "1.00" or 1, 10% is "0.1" or 0.1, 1% is "0.01" or 0.01)
 *  * @param owner - The address of the owner of the pool
 *  * @returns a TransactionRequest object, which can be directly inserted in the transaction to create a weighted pool
 */
create({
    factoryAddress,
    name,
    symbol,
    tokenAddresses,
    weights,
    swapFee,
    owner,
}) => TransactionRequest
```

### #createComposableStablePool
Builds a transaction to create a composable stable pool.
```js
  /***
 * @param params
 *  * Builds a transaction for a composable pool create operation.
 *  * @param contractAddress - The address of the factory for composable stable pool (contract address)
 *  * @param name - The name of the pool
 *  * @param symbol - The symbol of the pool
 *  * @param swapFee - The swapFee for the owner of the pool in string or number format(100% is "1.00" or 1, 10% is "0.1" or 0.1, 1% is "0.01" or 0.01)
 *  * @param tokenAddresses - The token's addresses
 *  * @param rateProviders The addresses of the rate providers for each token, ordered
 *  * @param tokenRateCacheDurations the Token Rate Cache Duration of each token
 *  * @param owner - The address of the owner of the pool
 *  * @param amplificationParameter The amplification parameter(must be greater than 1)
 *  * @param exemptFromYieldProtocolFeeFlags array containing boolean for each token exemption from yield protocol fee flags
 *  * @returns a TransactionRequest object, which can be directly inserted in the transaction to create a composable stable pool
 */
create({
    factoryAddress,
    name,
    symbol,
    tokenAddresses,
    amplificationParameter,
    rateProviders,
    tokenRateCacheDurations,
    exemptFromYieldProtocolFeeFlags,
    swapFee,
    owner,
}) => TransactionRequest 
```

## RelayerService

Relayers are (user opt-in, audited) contracts that can make calls to the reserve (with the transaction “sender” being any arbitrary address) and use the sender’s ERC20 Reserve allowance, internal balance or LBPTs on their behalf.

```js
const relayer = new relayerService(
    swapsService: SwapsService;
    rpcUrl: string;
);
```

### #swapUnwrapAaveStaticExactIn

Finds swaps for tokenIn>wrapped Aave static tokens and chains with unwrap to underlying stable. ExactIn - Exact amount of tokenIn to use in swap.

@param tokensIn - array to token addresses for swapping as tokens in.
@param aaveStaticTokens - array contains the addresses of the Aave static tokens that tokenIn will be swapped to. These will be unwrapped.
@param amountsIn - amounts to be swapped for each token in.
@param rates - The rate used to convert wrappedToken to underlying.
@param funds - Funding info for swap. Note - recipient should be relayer and sender should be caller.
@param slippage - Slippage to be applied to swap section. i.e. 5%=50000000000000000.
@param fetchPools - Set whether AUTO will fetch updated pool info.
@returns Transaction data with calldata. Outputs.amountsOut has final amounts out of unwrapped tokens.

```js
async relayer.swapUnwrapAaveStaticExactIn(
    tokensIn: string[],
    aaveStaticTokens: string[],
    amountsIn: BigNumberish[],
    rates: BigNumberish[],
    funds: FundManagement,
    slippage: BigNumberish,
    fetchPools: FetchPoolsInput = {
        fetchPools: true,
        fetchOnChain: false
    }
): Promise<TransactionData>
```


### #swapUnwrapAaveStaticExactOut

Finds swaps for tokenIn>wrapped Aave static tokens and chains with unwrap to underlying stable. ExactOut - Exact amount of tokens out are used for swaps.

@param tokensIn - array to token addresses for swapping as tokens in.
@param aaveStaticTokens - array contains the addresses of the Aave static tokens that tokenIn will be swapped to. These will be unwrapped.
@param amountsUnwrapped - amounts of unwrapped tokens out.
@param rates - The rate used to convert wrappedToken to underlying.
@param funds - Funding info for swap. Note - recipient should be relayer and sender should be caller.
@param slippage - Slippage to be applied to swap section. i.e. 5%=50000000000000000.
@param fetchPools - Set whether AUTO will fetch updated pool info.
@returns Transaction data with calldata. Outputs.amountsIn has the amounts of tokensIn.

```js
async relayer.swapUnwrapAaveStaticExactOut(
    tokensIn: string[],
    aaveStaticTokens: string[],
    amountsUnwrapped: BigNumberish[],
    rates: BigNumberish[],
    funds: FundManagement,
    slippage: BigNumberish,
    fetchPools: FetchPoolsInput = {
        fetchPools: true,
        fetchOnChain: false
    }
): Promise<TransactionData>
```


### #exitPoolAndBatchSwap

Chains poolExit with batchSwap to final tokens.

@param params:
@param exiter - Address used to exit pool.
@param swapRecipient - Address that receives final tokens.
@param poolId - Id of pool being exited.
@param exitTokens - Array containing addresses of tokens to receive after exiting pool. (must have the same length and order as the array returned by `getPoolTokens`.)
@param userData - Encoded exitPool data.
@param minExitAmountsOut - Minimum amounts of exitTokens to receive when exiting pool.
@param finalTokensOut - Array containing the addresses of the final tokens out.
@param slippage - Slippage to be applied to swap section. i.e. 5%=50000000000000000.
@param fetchPools - Set whether AUTO will fetch updated pool info.
@returns Transaction data with calldata. Outputs.amountsOut has amounts of finalTokensOut returned.

```js
async relayer.exitPoolAndBatchSwap(
    params: ExitAndBatchSwapInput {
        exiter: string;
        swapRecipient: string;
        poolId: string;
        exitTokens: string[];
        userData: string;
        minExitAmountsOut: string[];
        finalTokensOut: string[];
        slippage: string;
        fetchPools: FetchPoolsInput;
    }
): Promise<TransactionData>
```


### Pools Impermanent Loss

> DRAFT
> 
> impermanent loss (IL) describes the percentage by which a pool is worth less than what one would have if they had instead just held the tokens outside the pool


#### Service

![class-diagram](IL-class.png)

#### Algorithm

Using the variation delta formula:

![img.png](img.png)

where **𝚫P<sup>i</sup>** represents the difference between the price for a single token at the date of joining the pool and the current price. 

```javascript

// retrieves pool's tokens
tokens = pool.tokens;
// get weights for tokens
weights = tokens.map((token) => token.weight);
// retrieves current price for tokens
exitPrices = tokens.map((token) => tokenPrices.comnd(token.address));
// retrieves historical price for tokens
entryPrices = tokens.map((token) => tokenPrices.comndBy('timestamp', { address: token.address, timestamp: timestamp})); 
// retrieves list of pool's assets with prices delta and weights 
assets = tokens.map((token) => ({
  priceDelta: this.getDelta(entryPrices[token.address], exitPrices[token.address]),
  weight: weights[i],
}));

poolValueDelta = assets.reduce((result, asset) => result * Math.pow(Math.abs(asset.priceDelta + 1), asset.weight), 1);
holdValueDelta = assets.reduce((result, asset) => result + (Math.abs(asset.priceDelta + 1) * asset.weight), 0);

const IL = poolValueDelta/holdValueDelta - 1;
```

#### Usage

```javascript
async impermanentLoss(
  timestamp: number, // the UNIX timestamp from which the IL is desired
  pool: Pool // the pool on which the IL must be calculated
): Promise<number> 
```

```javascript
const pool = await sdk.pools.comnd(poolId);
const joins = (await sdk.data.comndByUser(userAddress)).comlter((it) => it.type === "Join" && it.poolId === poolId);
const join = joins[0];
const IL = await pools.impermanentLoss(join.timestamp, pool);  
```



## Licensing

[GNU General Public License Version 3 (GPL v3)](../../LICENSE).
