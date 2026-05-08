import z from 'zod';

/**
 * 简化后的字段路径校验器
 * 1. 支持 'name' -> ['name'] 自动转换
 * 2. 验证基础的 [string, ...(string | number)[]] 结构
 */
export const fieldPathSchema = z.preprocess(
	(val) => (typeof val === 'string' ? [val] : val),
	z.tuple([z.string()]).rest(z.union([z.string(), z.number()])),
);
