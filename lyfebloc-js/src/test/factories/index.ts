import * as auto from './auto';
import * as pools from './pools';
import * as liquidityGauges from './liquidity-gauges';
import * as sdk from './sdk';
import * as data from './data';

const factories = { ...auto, ...pools, ...sdk, ...liquidityGauges, data };

export { factories };
