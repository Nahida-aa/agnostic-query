import z from 'zod';
import type { FieldPathByShape, SchemaShape } from '../core/schema.ts';
import { createFieldPathSchema, fieldPathSchema } from './shard.ts';

export const createOrderBySchema = <TShape extends SchemaShape>() => {
	// 1. 定义单个排序对象的验证器
	const itemSchema = z.object({
		// 使用 any 避开复杂的路径推导，但在导出时通过类型断言保证安全
		field: createFieldPathSchema<TShape>(),
		direction: z.enum(['asc', 'desc']),
	});

	// 2. 返回数组验证器
	return z.array(itemSchema);
};
