import { LyfeblocSDK } from '../../src/modules/sdk.module';
import { Network } from '../../src';
import dotenv from 'dotenv';

dotenv.config();

const sdk = new LyfeblocSDK(
{ 
    network: Network.GOERLI, 
    rpcUrl: `https://goerli.infura.io/v3/${process.env.INFURA}`
});
const { veLyfeProxy: veLYFEProxy } = sdk.contracts;

async function main() {

    const USER = "0x91F450602455564A64207414c7Fbd1F1F0EbB425";

    console.log("User's veLYFE adjusted balance", await veLYFEProxy?.getAdjustedBalance(USER));
}

main();

// npm run examples:run -- ./examples/contracts/veLYFE-proxy.ts