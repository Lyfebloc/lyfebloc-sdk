import { Findable, Price } from '@/types';
import { BaseFeeDistributor } from '@/modules/data';

export interface ProtocolRevenueData {
  lastWeekBalRevenue: number;
  lastWeekBBAUsdRevenue: number;
  veLyfeSupply: number;
}

export class ProtocolRevenue {
  constructor(
    private repository: BaseFeeDistributor,
    private tokenPrices: Findable<Price>
  ) {}

  async data(now = Date.now()): Promise<ProtocolRevenueData> {
    const data = await this.repository.multicallData(now);
    const balPrice = await this.tokenPrices.comnd(data.balAddress);

    if (!balPrice || !balPrice.usd) {
      throw `No LYFE USD price found`;
    }

    return {
      lastWeekBalRevenue: data.balAmount * parseFloat(balPrice.usd),
      lastWeekBBAUsdRevenue: data.bbAUsdAmount * data.bbAUsdPrice,
      veLyfeSupply: data.veLyfeSupply,
    };
  }
}
