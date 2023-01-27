import { GraphQLArgs, GraphQLArgsFormatter } from '../types';

export class LyfeblocAPIArgsFormatter implements GraphQLArgsFormatter {
  format(args: GraphQLArgs): GraphQLArgs {
    return args;
  }
}
