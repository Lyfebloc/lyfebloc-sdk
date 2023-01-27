import { ContractAddresses } from '@/types';
import { Provider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import { formatUnits } from '@ethersproject/units';
import veLyfeProxyAbi from '@/lib/abi/veDelegationProxy.json';

export class VeBalProxy {
  instance: Contract;

  constructor(addresses: ContractAddresses, provider: Provider) {
    if (!addresses.veLyfeProxy)
      throw new Error('veLyfeProxy address must be defined');
    this.instance = new Contract(addresses.veLyfeProxy, veLyfeProxyAbi, provider);
  }

  async getAdjustedBalance(account: string): Promise<string> {
    const balance = await this.instance.adjustedBalanceOf(account);
    return formatUnits(balance);
  }
}
