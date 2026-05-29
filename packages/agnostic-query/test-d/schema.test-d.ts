import { expectType } from 'tsd';
import type { FieldPath, FieldPathByShape } from '../src/core/schema';

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

// Generic record should be permissive as well
expectType<FieldPathByShape<Record<string, any>>>(['any', 0, 1]);
