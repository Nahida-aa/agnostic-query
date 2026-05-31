import { expectNotAssignable } from 'tsd';
import type { FieldPathByShape } from '../src/core/schema';

type Demo = {
  matrix: number[][];
  tags: { id: number; name: string }[];
  data: { address: { city: string } };
};

// Valid paths should be accepted (structural check, not literal matching)
type ValidDemo = FieldPathByShape<Demo>;

// Invalid paths should be rejected
expectNotAssignable<FieldPathByShape<Demo>>(['data', 'missing']);
expectNotAssignable<FieldPathByShape<Demo>>(['tags', 'name']);
expectNotAssignable<FieldPathByShape<Demo>>(['category', 0]);
