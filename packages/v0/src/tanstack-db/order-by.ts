import {
	// FieldPath,
	type ParsedOrderBy,
	parseLoadSubsetOptions,
	parseOrderByExpression,
	parseWhereExpression,
	queryCollectionOptions,
	type SimpleComparison,
} from '@tanstack/query-db-collection';
import type { QueryOrderBy } from '../core/order-by';
import type { SchemaShape } from '../core/schema';

export type FromTanDbOrderByParam = Parameters<
	typeof parseOrderByExpression
>[0];
export const fromTanDbOrderBy = <TShape extends SchemaShape>(
	orderBy: FromTanDbOrderByParam,
) => parseOrderByExpression(orderBy) as unknown as QueryOrderBy<TShape>[];
