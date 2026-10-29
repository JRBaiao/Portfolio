// Fills the generated regions of the HTML pages (<!-- build:name --> … <!-- /build:name -->)
// from the typed data in src/data, then checks every page for broken file links,
// unknown filter tags, duplicate ids and screenshot sizes that don't match the image.
// Nothing is written if a check fails. Run with `npm run build:pages`.

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROJECTS, TAGS, isTag, type Project } from '../src/data/projects.ts';
import { GALLERIES, type Gallery, type GalleryId } from '../src/data/galleries.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const CHEVRON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Puts `lines` on their own lines between the markers, at the markers' indentation. */
function block(lines: string[], indent: string): string {
  return `\n${lines.map((line) => indent + line).join('\n')}\n${indent}`;
}

function fill(html: string, name: string, content: string): string {
  const region = new RegExp(`(<!-- build:${name} -->)[\\s\\S]*?(<!-- /build:${name} -->)`, 'g');
  const found = html.match(region)?.length ?? 0;
  if (found !== 1) throw new Error(`Expected one "build:${name}" region, found ${found}`);
  return html.replace(region, (_, start: string, end: string) => start + content + end);
}

/** First capture group of every match. */
function captures(html: string, pattern: RegExp): string[] {
  return [...html.matchAll(pattern)].map((match) => match[1] ?? '');
}

function filterButtons(): string[] {
  return [
    '<button class="filter-btn active" data-filter="all" type="button" aria-pressed="true">All</button>',
    ...Object.entries(TAGS).map(([tag, label]) =>
      `<button class="filter-btn" data-filter="${tag}" type="button" aria-pressed="false">${escape(label)}</button>`),
  ];
}

function archiveCard(project: Project): string[] {
  const title = escape(project.title);
  const id = escape(project.id);
  const detailId = `${id}-detail`;
  return [
    `<article class="project-card archive-project reveal" id="${id}" data-tags="${escape(project.tags.join(' '))}">`,
    '  <div class="project-top">',
    `    <span class="project-icon project-icon--${escape(project.accent)}" aria-hidden="true"><img src="${escape(project.icon)}" width="28" height="28" alt=""></span>`,
    ...(project.repo
      ? [`    <a class="project-code-link" href="${escape(project.repo)}" target="_blank" rel="noopener" aria-label="View ${title} on GitHub">View code <span aria-hidden="true">↗</span></a>`]
      : []),
    '  </div>',
    `  <h3>${title}</h3>`,
    `  <p class="project-desc">${escape(project.description)}</p>`,
    '  <div class="tags">',
    ...project.stack.map((item) => `    <span class="tag">${escape(item)}</span>`),
    '  </div>',
    `  <button class="project-toggle" type="button" aria-expanded="false" aria-controls="${detailId}">Technical details ${CHEVRON}</button>`,
    `  <div class="project-detail" id="${detailId}">`,
    `    <p>${escape(project.details)}</p>`,
    '  </div>',
    '</article>',
  ];
}

function galleryFigure(id: GalleryId, gallery: Gallery): string[] {
  const [first] = gallery.shots;
  const title = escape(gallery.title);
  const hasChoices = gallery.shots.length > 1;
  return [
    `<figure class="project-gallery" data-gallery="${escape(id)}" aria-label="${title} ${hasChoices ? 'screenshots' : 'screenshot'}">`,
    `  <div class="preview-toolbar"><span class="preview-dot" aria-hidden="true"></span><span>${title}</span><span class="preview-kind">Product output</span></div>`,
    `  <button class="screenshot-open" type="button" aria-label="Enlarge ${title} screenshot">`,
    `    <img src="${escape(first.src)}" alt="${escape(first.alt)}" width="${first.width}" height="${first.height}" loading="${gallery.loading ?? 'lazy'}" decoding="async">`,
    '    <span class="screenshot-hint">View full size <span aria-hidden="true">↗</span></span>',
    '  </button>',
    ...(hasChoices
      ? [
          `  <div class="gallery-controls" role="group" aria-label="Choose ${title} screenshot">`,
          ...gallery.shots.map((shot, i) =>
            `    <button type="button" class="gallery-select" aria-pressed="${i === 0}">${escape(shot.label)}</button>`),
          '  </div>',
        ]
      : []),
    `  <figcaption>${escape(first.caption)}</figcaption>`,
    '</figure>',
  ];
}

function pngSize(file: string): { width: number; height: number } {
  const header = readFileSync(file).subarray(0, 24);
  if (header.toString('latin1', 1, 4) !== 'PNG') throw new Error(`${file} is not a PNG`);
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
}

// ---------- Generate ----------

const original = new Map(
  readdirSync(ROOT).filter((file) => file.endsWith('.html')).map((file) => [file, readFileSync(join(ROOT, file), 'utf8')]),
);
const pages = new Map(original);

let projectsPage = pages.get('projects.html') ?? '';
projectsPage = fill(projectsPage, 'filters', block(filterButtons(), '      '));
projectsPage = fill(projectsPage, 'archive', block(PROJECTS.flatMap(archiveCard), '        '));
for (const [id, gallery] of Object.entries(GALLERIES) as [GalleryId, Gallery][]) {
  projectsPage = fill(projectsPage, `gallery:${id}`, block(galleryFigure(id, gallery), '          '));
}
pages.set('projects.html', projectsPage);

const projectCount = String(captures(projectsPage, /class="(project-card) /g).length);
for (const [page, html] of pages) {
  if (html.includes('<!-- build:count -->')) pages.set(page, fill(html, 'count', projectCount));
}

// ---------- Check ----------

const errors: string[] = [];

for (const [page, html] of pages) {
  // Every page carries the Content-Security-Policy, and nothing it would block.
  if (!html.includes('http-equiv="Content-Security-Policy"')) errors.push(`${page}: missing the Content-Security-Policy <meta>`);
  if (/\sstyle="/.test(html)) errors.push(`${page}: inline style="…" attribute (blocked by the CSP; use a class)`);
  if (/<script(?![^>]*\ssrc=)[^>]*>/.test(html)) errors.push(`${page}: inline <script> (blocked by the CSP; put it in src/)`);
  if (/\son[a-z]+="/.test(html)) errors.push(`${page}: inline event handler (blocked by the CSP; use addEventListener)`);
  if (/\s(?:src|href)="http:\/\//.test(html)) errors.push(`${page}: insecure http:// link`);

  for (const ref of captures(html, /\s(?:src|href)="([^"]+)"/g)) {
    if (/^(?:[a-z][a-z+.-]*:|#|\/\/)/i.test(ref)) continue;
    const file = ref.split(/[?#]/)[0] ?? ref;
    if (!existsSync(join(ROOT, file))) errors.push(`${page}: links to missing file "${ref}"`);
  }
  for (const tag of captures(html, /data-tags="([^"]*)"/g).flatMap((tags) => tags.split(/\s+/))) {
    if (!isTag(tag)) errors.push(`${page}: unknown tag "${tag}" (known tags: ${Object.keys(TAGS).join(', ')})`);
  }
  const ids = captures(html, /\sid="([^"]+)"/g);
  for (const id of new Set(ids.filter((id, i) => ids.indexOf(id) !== i))) {
    errors.push(`${page}: duplicate id "${id}"`);
  }
  for (const id of captures(html, /aria-controls="([^"]+)"/g)) {
    if (!ids.includes(id)) errors.push(`${page}: aria-controls points to missing id "${id}"`);
  }
}

const usedTags = new Set(captures(projectsPage, /data-tags="([^"]*)"/g).flatMap((tags) => tags.split(/\s+/)));
for (const tag of Object.keys(TAGS)) {
  if (!usedTags.has(tag)) errors.push(`projects.html: the "${tag}" filter matches no project`);
}

for (const gallery of Object.values(GALLERIES)) {
  for (const shot of gallery.shots) {
    const file = join(ROOT, shot.src);
    if (!existsSync(file)) continue; // already reported as a missing file
    const actual = pngSize(file);
    if (actual.width !== shot.width || actual.height !== shot.height) {
      errors.push(`${shot.src}: data says ${shot.width}×${shot.height}, file is ${actual.width}×${actual.height}`);
    }
  }
}

if (errors.length) {
  console.error(errors.map((error) => `✗ ${error}`).join('\n'));
  console.error(`\n${errors.length} problem(s) found — no pages were written.`);
  process.exit(1);
}

for (const [page, html] of pages) {
  if (html !== original.get(page)) {
    writeFileSync(join(ROOT, page), html);
    console.log(`updated ${page}`);
  }
}
console.log(`✓ ${pages.size} pages checked, ${projectCount} projects`);
