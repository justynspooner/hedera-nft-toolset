import dotenv from "dotenv";

const environment = process.env.NODE_ENV || "development";

console.log(`Loading environment variables from .env.${environment}`);

dotenv.config({ path: `.env.${environment}` });
