import type { ArtifactCategory } from '../data/demoScenario';

let lastSuffixTime = -1;
let suffixSequence = 0;

export function slugifyArtifactTitle(title: string): string {
  return title
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function createArtifactId(category: ArtifactCategory, title: string, suffix: string): string {
  const slug = slugifyArtifactTitle(title);
  return slug ? `${category}-${slug}-${suffix}` : '';
}

export function createArtifactSuffix(now = Date.now()): string {
  if (now === lastSuffixTime) suffixSequence += 1;
  else {
    lastSuffixTime = now;
    suffixSequence = 0;
  }
  return `${now.toString(36)}-${suffixSequence.toString(36).padStart(2, '0')}`;
}
