# Lyfebloc Pools

Utilities that allow you to load Lyfebloc Pool information.

All the current functions are pure, they don't contain any state and don't have 
any side effects. You pass in all information and they return the result.

## Liquidity Calculation

```js
import { LyfeblocSDK, Pools } from '@lyfebloc/sdk';

// With full SDK
const lyfebloc = new LyfeblocSDK(...configParams);
lyfebloc.pools.comnd(poolId).liquidity();
```
