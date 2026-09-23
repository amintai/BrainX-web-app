import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { walkJsxFiles, findBannedTokens, isBannedToken } from './tailwindLegacyClasses.js';

const SRC_ROOT = path.resolve(import.meta.dirname, '..');

describe('isBannedToken', () => {
  it('bans known Tailwind v3-only tokens', () => {
    expect(isBannedToken('font-body-md')).toBe(true);
    expect(isBannedToken('font-label-lg')).toBe(true);
    expect(isBannedToken('font-headline-sm')).toBe(true);
    expect(isBannedToken('font-display-lg')).toBe(true);
    expect(isBannedToken('font-code-md')).toBe(true);
    expect(isBannedToken('flex-shrink-0')).toBe(true);
    expect(isBannedToken('flex-grow-0')).toBe(true);
    expect(isBannedToken('rounded')).toBe(true);
    expect(isBannedToken('rounded-sm')).toBe(true);
  });

  it('does not ban valid v4 tokens', () => {
    expect(isBannedToken('rounded-xs')).toBe(false);
    expect(isBannedToken('rounded-lg')).toBe(false);
    expect(isBannedToken('rounded-xl')).toBe(false);
    expect(isBannedToken('rounded-full')).toBe(false);
    expect(isBannedToken('font-display')).toBe(false);
    expect(isBannedToken('font-mono')).toBe(false);
    expect(isBannedToken('font-sans')).toBe(false);
    expect(isBannedToken('shrink-0')).toBe(false);
  });
});

describe('findBannedTokens', () => {
  it('flags a banned token inside a className string', () => {
    const matches = findBannedTokens('<div className="flex font-body-md text-sm">');
    expect(matches.some((m) => m.token === 'font-body-md')).toBe(true);
  });

  it('strips variant prefixes before checking', () => {
    const matches = findBannedTokens('<div className="hover:rounded-sm sm:rounded-lg">');
    expect(matches.some((m) => m.token === 'rounded-sm')).toBe(true);
    expect(matches.some((m) => m.token === 'rounded-lg')).toBe(false);
  });

  it('does not flag rounded-lg/xl/full/xs', () => {
    const matches = findBannedTokens(
      '<div className="rounded-lg rounded-xl rounded-full rounded-xs">',
    );
    expect(matches).toHaveLength(0);
  });
});

describe('tailwindLegacyClasses guard over src/**/*.jsx', () => {
  it('exits clean against the current src tree', () => {
    const files = walkJsxFiles(SRC_ROOT);
    const offenders = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const matches = findBannedTokens(content);
      if (matches.length > 0) {
        offenders.push({
          file: path.relative(SRC_ROOT, file),
          tokens: matches.map((m) => m.token),
        });
      }
    }
    if (offenders.length > 0) {
      throw new Error(
        `Banned Tailwind v3-only class tokens found:\n${offenders
          .map((o) => `  ${o.file}: ${o.tokens.join(', ')}`)
          .join('\n')}`,
      );
    }
    expect(offenders).toHaveLength(0);
  });

  it('fails when a temporary fixture file contains a banned token', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tw-guard-'));
    const tmpFile = path.join(tmpDir, 'Fixture.jsx');
    fs.writeFileSync(tmpFile, 'export const Fixture = () => <div className="font-body-md" />;');

    const files = walkJsxFiles(tmpDir);
    const matches = findBannedTokens(fs.readFileSync(files[0], 'utf8'));
    expect(matches.some((m) => m.token === 'font-body-md')).toBe(true);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
