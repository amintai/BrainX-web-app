import { describe, it, expect } from 'vitest';
import { extractJson } from './extractJson.js';

describe('extractJson', () => {
  it('strips a fenced code block with a json language tag', () => {
    const text = 'Sure! ```json\n{"a":1}\n```';
    expect(JSON.parse(extractJson(text))).toEqual({ a: 1 });
  });

  it('strips a fenced code block without a language tag', () => {
    const text = '```\n{"a":2}\n```';
    expect(JSON.parse(extractJson(text))).toEqual({ a: 2 });
  });

  it('extracts JSON surrounded by prose with no fence', () => {
    const text = 'Here you go: {"a":3} — hope that helps!';
    expect(JSON.parse(extractJson(text))).toEqual({ a: 3 });
  });

  it('ignores a stray unmatched brace in trailing prose after the JSON value', () => {
    const text = 'Here you go: {"a":4} — note: use the { symbol carefully.';
    expect(JSON.parse(extractJson(text))).toEqual({ a: 4 });
  });

  it('stops at the first complete balanced object when multiple JSON-like blocks are present', () => {
    const text = 'First: {"a":5} Second: {"b":6}';
    expect(JSON.parse(extractJson(text))).toEqual({ a: 5 });
  });

  it('does not get confused by braces inside string literal values', () => {
    const text = 'Result: {"note":"contains a } brace and a { one too","a":7} done.';
    expect(JSON.parse(extractJson(text))).toEqual({
      note: 'contains a } brace and a { one too',
      a: 7,
    });
  });

  it('respects escaped quotes inside string literals when tracking string state', () => {
    const text = String.raw`{"note":"she said \"hi } there\""}`;
    expect(JSON.parse(extractJson(text))).toEqual({ note: 'she said "hi } there"' });
  });

  it('throws a clear error when no balanced JSON value can be found', () => {
    const text = 'Here is some prose with an unbalanced { brace and no closing one.';
    expect(() => extractJson(text)).toThrow(/no balanced JSON value/);
  });

  it('throws a clear error on a structurally unbalanced value (mismatched bracket types)', () => {
    const text = '{"a": [1, 2}';
    expect(() => extractJson(text)).toThrow(/unbalanced JSON structure/);
  });
});
