// src/lib/db/schema/columnsHelpers.ts

import { serial, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { timeId } from '#/db/timeId.ts';

export const timestamps = {
	created_at: timestamp({ withTimezone: true }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true })
		.$onUpdate(() => new Date())
		.notNull(),
	// deleted_at: timestamp("deleted_at"),
};

export const timestamps_with_deleted_at = {
	...timestamps,
	deleted_at: timestamp(),
};

export const commonColumns = {
	name: varchar({ length: 255 }).notNull(),
	summary: varchar({ length: 2048 }), // 摘要
	...timestamps,
};

// export const commonColumnsWithDeletedAt = {
// }

export const autoIncrementCommon = {
	id: serial().primaryKey().notNull(),
	...commonColumns,
};

export const uuidCommon = {
	id: uuid().primaryKey().notNull().defaultRandom(),
	...commonColumns,
};

export const autoIncrementWithTimestamps = {
	id: serial().primaryKey().notNull(),
	...timestamps,
};

export const uuidWithTimestamps = {
	id: uuid().primaryKey().notNull().defaultRandom(),
	created_at: timestamp({ withTimezone: true }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true })
		.$onUpdate(() => new Date())
		.notNull(),
};
export const textUuidWithTimestamps = {
	id: text()
		.primaryKey()
		.notNull()
		.$defaultFn(() => crypto.randomUUID()),
	created_at: timestamp({ withTimezone: true }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true })
		.$onUpdate(() => new Date())
		.notNull(),
};

export const pgNanoid = () => text().primaryKey().$defaultFn(timeId);
export const pgTimeId = () => text().primaryKey().$defaultFn(timeId);
export const pgCreatedAt = () => timestamp({ withTimezone: true }).defaultNow();
export const pgUpdatedAt = () =>
	timestamp({ withTimezone: true }).$onUpdate(() => new Date());

export const nanoidWithTimestamps = {
	id: pgNanoid(), // `${nanoid()}`
	created_at: timestamp({ withTimezone: true }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true })
		.$onUpdate(() => new Date())
		.notNull(),
};
export const timeIdWithTimestamps = {
	id: pgTimeId(), // `${timeId()}`
	created_at: timestamp({ withTimezone: true }).defaultNow().notNull(),
	updated_at: timestamp({ withTimezone: true })
		.$onUpdate(() => new Date())
		.notNull(),
};

// 选全部列, 使用官方助手: getTableColumns
// 用于 drizzle-orm 的 db.select() 助手
export const pickColumns = <
	TTable extends Record<string, any>,
	// TCols extends Partial<Record<keyof TTable, boolean>>,
	TCols extends Partial<Record<keyof TTable['_']['columns'], boolean>>,
	// TCols extends { [K in keyof TTable]?: boolean },
>(
	table: TTable,
	columns: TCols,
): {
	[K in keyof TTable as TCols[K] extends true ? K : never]: TTable[K];
} => {
	const result = {} as any;
	for (const key in columns) {
		if (columns[key]) {
			result[key] = table[key];
		}
	}
	return result;
};
