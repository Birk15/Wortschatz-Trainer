import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAnswers } from './quiz.js';

test('ignores case, surrounding whitespace and Unicode composition', () => {
  assert.deepEqual(evaluateAnswers(['  PRÄZISE  ', 'scho\u0308n'], ['präzise', 'schön']), [true, true]);
});

test('synonyms are order independent and duplicates count only once', () => {
  assert.deepEqual(evaluateAnswers(['flink', ' FLINK ', 'rasch', 'falsch', ''], ['rasch', 'flink']), [true, false, true, false, false]);
});
