import type { Unpack } from '#/lib/utils/func/types.ts';
import {
	type ExtractContext,
	type InferCollectionType,
	type InferResultType,
	type InitialQueryBuilder,
} from '@tanstack/react-db';


/**
 * 封装：直接从 Query 构造函数中提取返回的数据类型
 * Unpack: 递归展开函数返回值，直到不是函数为止, eg: ReturnType<ReturnType<T>> ...
 */
export type InferQueryResult<T extends (...args: any[]) => any> =
	InferResultType<ExtractContext<Unpack<T>>>;
