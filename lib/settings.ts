import assert from "assert";

assert(process.env.BASE_URL);
export const BASE_URL = process.env.BASE_URL;

assert(process.env.DATABASE_URL);
export const DATABASE_URL = process.env.DATABASE_URL;

assert(process.env.RAGIE_API_KEY);
export const RAGIE_API_KEY = process.env.RAGIE_API_KEY;

assert(process.env.RAGIE_WEBHOOK_SECRET);
export const RAGIE_WEBHOOK_SECRET = process.env.RAGIE_WEBHOOK_SECRET;
