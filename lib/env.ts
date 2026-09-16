import { config } from "dotenv";

// Load environment variables from .env.local and .env for CLI / external scripts
config({ path: [".env.local", ".env"] });

function LoadEnvVariable(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} not found`);
    }
    return value;
}

export const env = {
    DATABASE_URL: LoadEnvVariable("DATABASE_URL")
};