import { Contract } from '@ethersproject/contracts';
import { Provider } from '@ethersproject/providers';
import { Signer } from '@ethersproject/abstract-signer';
import { ContractAddresses } from '@/types';
import { Network } from '@/lib/constants/network';
import { LYFEBLOC_NETWORK_CONFIG } from '@/lib/constants/config';
import {
  Reserve__factory,
  Reserve,
  LidoRelayer__factory,
  LidoRelayer,
  LyfeblocHelpers,
  LyfeblocHelpers__factory,
} from '@lyfebloc/typechain';
import { Multicall } from './implementations/multicall';
import { ERC20 } from './implementations/ERC20';
import { VeBal } from './implementations/veLYFE';
import { VeBalProxy } from './implementations/veLYFE-proxy';
import { Relayer } from './implementations/relayer';
import { LiquidityGauge } from './implementations/liquidity-gauge';

type ContractFactory = (
  address: string,
  signerOrProvider: Signer | Provider
) => Contract;

export interface ContractInstances {
  Reserve: Reserve;
  lyfeblocHelpers: LyfeblocHelpers;
  lidoRelayer?: LidoRelayer;
  multicall: Contract;
  relayerV3?: Contract;
  relayerV4?: Contract;
  veLyfe?: VeBal;
  veLyfeProxy?: VeBalProxy;
  ERC20: ContractFactory;
  liquidityGauge: ContractFactory;
}

export class Contracts {
  contractAddresses: ContractAddresses;
  Reserve: Reserve;
  lyfeblocHelpers: LyfeblocHelpers;
  lidoRelayer?: LidoRelayer;
  multicall: Contract;
  relayerV3?: Contract;
  relayerV4?: Contract;
  veLyfe?: VeBal;
  veLyfeProxy?: VeBalProxy;

  /**
   * Create instances of Lyfebloc contracts connected to passed provider.
   * @param { Network | ContractAddresses } networkOrAddresses
   * @param { Provider } provider
   */
  constructor(
    networkOrAddresses: Network | ContractAddresses,
    provider: Provider
  ) {
    // Access addresses using passed network if available
    if (typeof networkOrAddresses === 'number') {
      this.contractAddresses =
        LYFEBLOC_NETWORK_CONFIG[networkOrAddresses].addresses.contracts;
    } else {
      this.contractAddresses = networkOrAddresses;
    }

    this.Reserve = Reserve__factory.connect(this.contractAddresses.Reserve, provider);
    this.lyfeblocHelpers = LyfeblocHelpers__factory.connect(
      this.contractAddresses.lyfeblocHelpers,
      provider
    );

    if (this.contractAddresses.lidoRelayer)
      this.lidoRelayer = LidoRelayer__factory.connect(
        this.contractAddresses.lidoRelayer,
        provider
      );

    // These contracts aren't included in Lyfebloc Typechain but are still useful.
    // TO DO - Possibly create via Typechain but seems unnecessary?
    this.multicall = Multicall(this.contractAddresses.multicall, provider);
    if (this.contractAddresses.relayerV3)
      this.relayerV3 = Relayer(this.contractAddresses.relayerV3, provider, 3);
    if (this.contractAddresses.relayerV4)
      this.relayerV4 = Relayer(this.contractAddresses.relayerV4, provider, 4);

    if (this.contractAddresses.veLyfe) {
      this.veLyfe = new VeBal(this.contractAddresses, provider);
    }

    if (this.contractAddresses.veLyfeProxy) {
      this.veLyfeProxy = new VeBalProxy(this.contractAddresses, provider);
    }
  }

  /**
   * Expose contract instances.
   */
  get contracts(): ContractInstances {
    return {
      Reserve: this.Reserve,
      lyfeblocHelpers: this.lyfeblocHelpers,
      lidoRelayer: this.lidoRelayer,
      multicall: this.multicall,
      relayerV3: this.relayerV3,
      relayerV4: this.relayerV4,
      veLyfe: this.veLyfe,
      veLyfeProxy: this.veLyfeProxy,
      ERC20: this.getErc20,
      liquidityGauge: this.getLiquidityGauge,
    };
  }

  /**
   * Helper to create ERC20 contract.
   * @param { string } address ERC20 address.
   * @param { Signer | Provider } signerOrProvider Signer or Provider.
   * @returns Contract.
   */
  getErc20(address: string, signerOrProvider: Signer | Provider): Contract {
    return ERC20(address, signerOrProvider);
  }

  /**
   * Helper to create LiquidityGauge contract.
   * @param { string } address Gauge address.
   * @param { Signer | Provider} signerOrProvider Signer or Provider.
   * @returns Contract.
   */
  getLiquidityGauge(
    address: string,
    signerOrProvider: Signer | Provider
  ): Contract {
    return LiquidityGauge(address, signerOrProvider);
  }
}
