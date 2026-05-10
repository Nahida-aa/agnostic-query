import { defineConfig } from 'rolldown'
export default defineConfig({
  input: [
    'src/index.ts',
    'src/zod.ts',
    'src/valibot.ts',
    'src/tanstack-db.ts',
    'src/sql/pg.ts',
    'src/drizzle/pg.ts',
    'src/kysely/pg.ts',
    'src/db0/pg.ts',
  ],
  output: {
    dir: 'dist',
    format: 'esm',
    entryFileNames: '[name].js',
  },
  platform: 'neutral',
  external: [
    'zod', 'valibot', 'drizzle-orm', 'kysely',
    'db0', '@tanstack/query-db-collection',
    /^drizzle-orm\//,
  ],
})