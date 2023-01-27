import { LyfeblocSDK } from '../../src/modules/sdk.module';
import { Network } from '../../src';
import dotenv from 'dotenv';

dotenv.config();

const sdk = new LyfeblocSDK(
{ 
    network: Network.GOERLI, 
    rpcUrl: `https://goerli.infura.io/v3/${process.env.INFURA}`
});
const { veLyfe: veLYFE } = sdk.contracts;

async function main() {

    if (!veLYFE) throw new Error('veLYFE address must be defined');

    const USER = "0x91F450602455564A64207414c7Fbd1F1F0EbB425";

    const lockInfo = await veLYFE.getLockInfo(USER);
    console.log("veLYFE lock info for user", lockInfo);
}

main();

// npm run examples:run -- ./examples/contracts/veLYFE.ts