import { drizzle } from 'drizzle-orm/node-postgres';

import * as settings from "@/lib/settings";

export default drizzle(settings.DATABASE_URL);
