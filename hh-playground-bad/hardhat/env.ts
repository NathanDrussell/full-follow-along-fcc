import { config as dotenv } from "dotenv";
import { z } from "zod";
dotenv();
const validateEnv = z
  .object({
    ETHERSCAN_API_KEY: z.string(),
    COINMARKETCAP_API_KEY: z.string(),
    SEPOLIA_RPC_URL: z.string().url(),
    SEPOLIA_PRIVATE_KEY: z.string().length(64),
    MAINNET_RPC_URL: z.string().url().or(z.literal("")),
    MAINNET_PRIVATE_KEY: z.string().length(64).or(z.literal("")),
  })
  .safeParse(process.env);

if (!validateEnv.success) {
  console.log(validateEnv.error.flatten());
}
