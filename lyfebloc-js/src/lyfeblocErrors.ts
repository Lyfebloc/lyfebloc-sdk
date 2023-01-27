export enum LyfeblocErrorCode {
  SWAP_ZERO_RETURN_AMOUNT = 'SWAP_ZERO_RETURN_AMOUNT',
  UNWRAP_ZERO_AMOUNT = 'UNWRAP_ZERO_AMOUNT',
  WRAP_ZERO_AMOUNT = 'WRAP_ZERO_AMOUNT',
  QUERY_BATCH_SWAP = 'QUERY_BATCH_SWAP',
  POOL_DOESNT_EXIST = 'POOL_DOESNT_EXIST',
  UNSUPPORTED_POOL_TYPE = 'UNSUPPORTED_POOL_TYPE',
  UNSUPPORTED_PAIR = 'UNSUPPORTED_PAIR',
  NO_POOL_DATA = 'NO_POOL_DATA',
  INPUT_OUT_OF_BOUNDS = 'INPUT_OUT_OF_BOUNDS',
  INPUT_LENGTH_MISMATCH = 'INPUT_LENGTH_MISMATCH',
  INPUT_TOKEN_INVALID = 'INPUT_TOKEN_INVALID',
  INPUT_ZERO_NOT_ALLOWED = 'INPUT_ZERO_NOT_ALLOWED',
  INTERNAL_ERROR_INVALID_ABI = 'INTERNAL_ERROR_INVALID_ABI',
  TOKEN_MISMATCH = 'TOKEN_MISMATCH',
  MISSING_TOKENS = 'MISSING_TOKENS',
  MISSING_AMP = 'MISSING_AMP',
  MISSING_DECIMALS = 'MISSING_DECIMALS',
  MISSING_PRICE_RATE = 'MISSING_PRICE_RATE',
  MISSING_WEIGHT = 'MISSING_WEIGHT',
  RELAY_SWAP_AMOUNTS = 'RELAY_SWAP_AMOUNTS',
  NO_VALUE_PARAMETER = 'NO_VALUE_PARAMETER',
  ILLEGAL_PARAMETER = 'ILLEGAL_PARAMETER',
  TIMESTAMP_IN_THE_FUTURE = 'TIMESTAMP_IN_THE_FUTURE',
  JOIN_DELTA_AMOUNTS = 'JOIN_DELTA_AMOUNTS',
  EXIT_DELTA_AMOUNTS = 'EXIT_DELTA_AMOUNTS',
}

export class LyfeblocError extends Error {
  constructor(public code: LyfeblocErrorCode) {
    super(LyfeblocError.getMessage(code));
    this.name = 'LyfeblocError';
  }

  static getMessage(code: LyfeblocErrorCode): string {
    switch (code) {
      case LyfeblocErrorCode.SWAP_ZERO_RETURN_AMOUNT:
        return 'queryBatchSwapWithAuto returned 0 amount';
      case LyfeblocErrorCode.UNWRAP_ZERO_AMOUNT:
        return 'swapUnwrapAaveStaticExactIn unwrapped amount < 0';
      case LyfeblocErrorCode.WRAP_ZERO_AMOUNT:
        return 'swapUnwrapAaveStaticExactOut wrapped amount < 0';
      case LyfeblocErrorCode.QUERY_BATCH_SWAP:
        return 'queryBatchSwap on chain call error';
      case LyfeblocErrorCode.POOL_DOESNT_EXIST:
        return 'lyfebloc pool does not exist';
      case LyfeblocErrorCode.UNSUPPORTED_POOL_TYPE:
        return 'unsupported pool type';
      case LyfeblocErrorCode.UNSUPPORTED_PAIR:
        return 'unsupported token pair';
      case LyfeblocErrorCode.NO_POOL_DATA:
        return 'no pool data';
      case LyfeblocErrorCode.INPUT_OUT_OF_BOUNDS:
        return 'input out of bounds';
      case LyfeblocErrorCode.INPUT_LENGTH_MISMATCH:
        return 'input length mismatch';
      case LyfeblocErrorCode.INPUT_TOKEN_INVALID:
        return 'input token invalid';
      case LyfeblocErrorCode.TOKEN_MISMATCH:
        return 'token mismatch';
      case LyfeblocErrorCode.MISSING_DECIMALS:
        return 'missing decimals';
      case LyfeblocErrorCode.MISSING_TOKENS:
        return 'missing tokens';
      case LyfeblocErrorCode.MISSING_AMP:
        return 'missing amp';
      case LyfeblocErrorCode.MISSING_PRICE_RATE:
        return 'missing price rate';
      case LyfeblocErrorCode.MISSING_WEIGHT:
        return 'missing weight';
      case LyfeblocErrorCode.INPUT_ZERO_NOT_ALLOWED:
        return 'zero input not allowed';
      case LyfeblocErrorCode.RELAY_SWAP_AMOUNTS:
        return 'Error when checking swap amounts';
      case LyfeblocErrorCode.NO_VALUE_PARAMETER:
        return 'Illegal value passed as parameter';
      case LyfeblocErrorCode.TIMESTAMP_IN_THE_FUTURE:
        return 'Timestamp cannot be in the future';
      case LyfeblocErrorCode.ILLEGAL_PARAMETER:
        return 'An illegal parameter has been passed';
      case LyfeblocErrorCode.JOIN_DELTA_AMOUNTS:
        return 'Error when checking join call deltas';
      case LyfeblocErrorCode.EXIT_DELTA_AMOUNTS:
        return 'Error when checking exit call deltas';
      default:
        return 'Unknown error';
    }
  }
}
