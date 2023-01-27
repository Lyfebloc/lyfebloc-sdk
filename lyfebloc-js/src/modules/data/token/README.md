# Tokens

Utilities that allow you to load token information.

The tokens class must have a token provider which defines where the token information
is coming from.

StaticTokenProvider - Token information comes from a pre-set array
CoingeckoTokenProvider - Token information comes from coingecko

## Token Information

```js
import { LyfeblocSDK, Tokens, StaticTokenProvider, CoingeckoTokenProvider } from '@lyfebloc/sdk';

// With full SDK
const lyfebloc = new LyfeblocSDK(...configParams);
const tokenProvider = new StaticTokenProvider()

lyfebloc.tokens.setProvider(tokenProvider)
lyfebloc.tokens.get(tokenId);

// or with tokens module directly
const tokenProvider = new CoingeckoTokenProvider()
const tokens = new Tokens();

tokens.setProvider(tokenProvider);
tokens.get(tokenId);
```
