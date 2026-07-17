import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import packageJson from '../package.json';
import { officeLayout } from '../src/data/officeLayout';

const REPOSITORY_ROOT = resolve(process.cwd(), '../..');
const PNG_SIGNATURE = '89504e470d0a1a0a';
const SCENE_PATH = officeLayout.scene.path;

const collectRegisteredPaths = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap(collectRegisteredPaths);
  }

  if (value === null || typeof value !== 'object') {
    return [];
  }

  return Object.entries(value).flatMap(([key, child]) => {
    if (key !== 'path') {
      return collectRegisteredPaths(child);
    }

    if (typeof child !== 'string') {
      throw new TypeError('Every officeLayout path must be a string');
    }

    return [child];
  });
};

const registeredPaths = collectRegisteredPaths(officeLayout);

const resolveExactCase = (relativePath: string): string => {
  const segments = relativePath.split('/');

  expect(relativePath, 'asset paths must be repository-relative POSIX paths').toMatch(
    /^images\/[A-Za-z0-9._/-]+$/,
  );
  expect(segments, `${relativePath} must not traverse outside the repository`).not.toContain('..');

  let currentPath = REPOSITORY_ROOT;

  segments.forEach((segment, index) => {
    const entry = readdirSync(currentPath, { withFileTypes: true }).find(
      (candidate) => candidate.name === segment,
    );

    expect(
      entry,
      `${relativePath} does not resolve with exact case at ${join(currentPath, segment)}`,
    ).toBeDefined();

    if (!entry) {
      return;
    }

    currentPath = join(currentPath, entry.name);

    if (index < segments.length - 1) {
      expect(entry.isDirectory(), `${currentPath} must be a directory`).toBe(true);
    }
  });

  return currentPath;
};

const readPngIhdr = (relativePath: string) => {
  const absolutePath = resolveExactCase(relativePath);
  const header = readFileSync(absolutePath).subarray(0, 33);

  expect(header.byteLength, `${relativePath} must contain a complete PNG IHDR`).toBe(33);
  expect(header.subarray(0, 8).toString('hex'), `${relativePath} must have the PNG signature`).toBe(
    PNG_SIGNATURE,
  );
  expect(header.readUInt32BE(8), `${relativePath} must use the 13-byte IHDR payload`).toBe(13);
  expect(header.toString('ascii', 12, 16), `${relativePath} must place IHDR first`).toBe('IHDR');

  return {
    width: header.readUInt32BE(16),
    height: header.readUInt32BE(20),
    bitDepth: header.readUInt8(24),
    colorType: header.readUInt8(25),
  };
};

describe('officeLayout asset manifest', () => {
  test('registers exactly 81 image paths', () => {
    expect(registeredPaths).toHaveLength(81);
  });

  test('registers no duplicate image paths', () => {
    expect(new Set(registeredPaths).size).toBe(registeredPaths.length);
  });

  test('resolves every registered path with exact filesystem case', () => {
    registeredPaths.forEach(resolveExactCase);
  });

  test('registers only regular files', () => {
    registeredPaths.forEach((relativePath) => {
      expect(lstatSync(resolveExactCase(relativePath)).isFile(), `${relativePath} must be a regular file`).toBe(
        true,
      );
    });
  });

  test('uses the PNG signature and a first IHDR chunk for every asset', () => {
    registeredPaths.forEach(readPngIhdr);
  });

  test('registers the 1672x941 8-bit RGB office scene', () => {
    expect(readPngIhdr(SCENE_PATH)).toEqual({
      width: 1672,
      height: 941,
      bitDepth: 8,
      colorType: 2,
    });
  });

  test('registers 1254x1254 8-bit RGBA non-scene assets', () => {
    registeredPaths
      .filter((relativePath) => relativePath !== SCENE_PATH)
      .forEach((relativePath) => {
        expect(readPngIhdr(relativePath), relativePath).toEqual({
          width: 1254,
          height: 1254,
          bitDepth: 8,
          colorType: 6,
        });
      });
  });
});

describe('frontend asset verification scripts', () => {
  const scripts = packageJson.scripts as Record<string, string>;

  test('defines the focused asset verification command', () => {
    expect(scripts['verify:assets']).toBe('vitest run tests/asset-manifest.test.ts');
  });

  test('defines the aggregate verification command', () => {
    expect(scripts.verify).toBe('npm test && npm run verify:assets && npm run build');
  });

  test('preserves targeted test argument forwarding', () => {
    expect(scripts.test).toBe('vitest run');
  });
});
