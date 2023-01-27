import { GraphQLClient } from 'graphql-request';
import { getSdk, Sdk } from './generated/lyfebloc-subgraph-types';
import * as Gauges from './generated/lyfebloc-gauges';
import * as V2 from './generated/lyfebloc-subgraph-types';

export * from './generated/lyfebloc-subgraph-types';

export type SubgraphClient = Sdk;
export type GaugesClient = Gauges.Sdk;
export type SubgraphLiquidityGauge = Gauges.LiquidityGauge;
export type SubgraphPool = V2.SubgraphPoolFragment;

export function createSubgraphClient(subgraphUrl: string): SubgraphClient {
  const client = new GraphQLClient(subgraphUrl);

  return getSdk(client);
}

export function createGaugesClient(url: string): GaugesClient {
  const client = new GraphQLClient(url);

  return Gauges.getSdk(client);
}
