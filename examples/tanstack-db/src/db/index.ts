import { drizzle } from 'drizzle-orm/pglite';

import * as schema from './schema.ts';

export const db = drizzle(process.env.DATABASE_URL!, { schema });
