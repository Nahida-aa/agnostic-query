import z from 'zod';

import type { SchemaShape } from '../core/schema';
import { createOrderBySchema } from './order-by';
import { createWhereSchema } from './where';

export const createQuerySchema = <TShape extends SchemaShape>() => {
	return z.object({
		// 这里的 createWhereSchema 内部已经锁定了 TShape
		where: createWhereSchema<TShape>().optional(),
		// 这里的 createOrderBySchema 内部也锁定了 TShape
		orderBy: createOrderBySchema<TShape>().optional(),
		limit: z.number().optional(),
		offset: z.number().default(0).optional(),
		cursor: z.object({
			// whereFrom // 定位下一页起始点 // 获取游标之后的行的条件表达式。对于多列 ORDER BY，用 OR + AND 组合成复合条件。示例在对 col1 ASC, col2 DESC 且游标值为 [v1, v2] 时生成：
			// (col1 > v1) OR (col1 = v1 AND col2 < v2)
			// 这样能正确处理多列排序的边界。
			// whereCurrent // 定位到等于当前游标值的行（仅用第一排序列）。用于处理边界上的重复值。对普通值就是 eq(col1, v1)，对 Date 等连续类型则用 AND(gte(...), lt(...)) 范围匹配防止精度问题
			lastKey: z.string().or(z.number()).optional(),
		}),
	});
};
