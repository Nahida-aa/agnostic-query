import { expectNotAssignable, expectType } from 'tsd';
import type { FieldPath, FieldPathByShape, GetPathType } from '../src/core/schema';

type Demo = {
  matrix: number[][];
  tags: { id: number; name: string }[];
  data: { address: { city: string } };
};

// Default permissive FieldPath should accept consecutive numbers
expectType<FieldPath>(['matrix', 0, 1]);
expectType<FieldPath>(['tags', 0, 'name']);

// Strictly-typed shape should accept corresponding paths
expectType<FieldPathByShape<Demo>>(['matrix', 0, 1]);
expectType<FieldPathByShape<Demo>>(['tags', 0, 'name']);
expectType<FieldPathByShape<Demo>>(['data', 'address', 'city']);

// `category` is a string[] field, so only the array index path is valid here.
// @ts-expect-error - string[] cannot descend into a string property path
expectType<FieldPathByShape<Demo>>(['category', 0, 'name']);

// @ts-expect-error - object paths cannot skip intermediate keys
expectType<FieldPathByShape<Demo>>(['data', 'city']);

// @ts-expect-error - array indexes must be numeric, not string literals
expectType<FieldPathByShape<Demo>>(['matrix', '0']);

// @ts-expect-error - leaf properties cannot be extended past the resolved scalar
expectType<FieldPathByShape<Demo>>(['tags', 0, 'name', 'extra']);

// Invalid paths should be rejected
expectNotAssignable<FieldPathByShape<Demo>>(['data', 'missing']);
expectNotAssignable<FieldPathByShape<Demo>>(['tags', 'name']);
expectNotAssignable<FieldPathByShape<Demo>>(['category', 0]);

// Generic record should be permissive as well
expectType<FieldPathByShape<Record<string, any>>>(['any', 0, 1]);

// GetPathType should resolve concrete nested values
expectType<GetPathType<Demo, ['data', 'address', 'city']>>('center');
expectType<GetPathType<Demo, ['tags', 0, 'name']>>('alice');
expectType<GetPathType<Demo, ['matrix', 0, 1]>>(123);

// @ts-expect-error - GetPathType should reject invalid deep paths
const _invalidPathValue: GetPathType<Demo, ['tags', 0, 'name', 'extra']> = 'x';
