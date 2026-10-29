// Screenshot galleries for the featured projects. `npm run build:pages` writes
// the gallery markup into projects.html; the browser script reads this same
// data when a visitor switches screenshots.

export interface Screenshot {
  /** Text on the gallery's selector button. */
  label: string;
  src: `assets/projects/${string}.png`;
  /** Intrinsic pixel size; the build checks it against the file. */
  width: number;
  height: number;
  alt: string;
  caption: string;
}

export interface Gallery {
  title: string;
  shots: [Screenshot, ...Screenshot[]];
  /** "eager" for a gallery that's on screen as the page opens (defaults to lazy). */
  loading?: 'eager' | 'lazy';
}

/** Keyed by the featured project's article id. */
export const GALLERIES = {
  'phishing-agent': {
    title: 'Phishing Investigation Agent',
    loading: 'eager', // first thing on the projects page, and the target of the home page morph
    shots: [
      {
        label: 'Investigation',
        src: 'assets/projects/phishing-terminal.png',
        width: 1192,
        height: 1039,
        alt: 'Terminal investigation showing a phishing verdict, deterministic findings, and verification warnings.',
        caption: 'Email evidence, explainable findings, and warnings when model claims are unsupported.',
      },
      {
        label: 'Analyst report',
        src: 'assets/projects/phishing-report.png',
        width: 1920,
        height: 1660,
        alt: 'Generated phishing investigation report with an executive summary and supporting email evidence.',
        caption: 'A generated analyst report ties the verdict back to the original email evidence.',
      },
    ],
  },
  'ai-scorecard': {
    title: 'AI Procurement Scorecard',
    shots: [
      {
        label: 'Overview',
        src: 'assets/projects/scorecard-overview.png',
        width: 3006,
        height: 1642,
        alt: 'AI Procurement Scorecard landing page with a guided evaluation and example readiness score.',
        caption: 'A guided workflow for evaluating AI procurement readiness.',
      },
      {
        label: 'Assessment',
        src: 'assets/projects/scorecard-assessment.png',
        width: 3006,
        height: 1536,
        alt: 'AI assessment screen showing procurement blockers and evidence review.',
        caption: 'Assessment review brings blockers, evidence, and evaluator confirmation together.',
      },
      {
        label: 'Category scores',
        src: 'assets/projects/scorecard-categories.png',
        width: 3006,
        height: 1068,
        alt: 'Readiness dashboard with a radar chart and scores by assessment category.',
        caption: 'Category scores make gaps visible through a radar chart and ranked breakdown.',
      },
      {
        label: 'Answer breakdown',
        src: 'assets/projects/scorecard-breakdown.png',
        width: 2614,
        height: 1004,
        alt: 'Answer breakdown showing readiness scores and responses across governance categories.',
        caption: 'An answer-level breakdown connects each category to its supporting responses.',
      },
    ],
  },
  'prompt-injection': {
    title: 'Prompt Injection Simulator',
    shots: [
      {
        label: 'Simulator',
        src: 'assets/projects/prompt-injection-simulator.png',
        width: 2992,
        height: 1472,
        alt: 'Prompt Injection Simulator showing six attack scenarios and a defended role-hijack attempt with the model response.',
        caption: 'A role-hijack attempt marked as defended, with the model response available for inspection.',
      },
    ],
  },
} satisfies Record<string, Gallery>;

export type GalleryId = keyof typeof GALLERIES;

export function isGalleryId(value: string | undefined): value is GalleryId {
  return value !== undefined && Object.hasOwn(GALLERIES, value);
}
