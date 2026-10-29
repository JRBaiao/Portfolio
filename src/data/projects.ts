// The "More projects" grid on projects.html is generated from this list by
// `npm run build:pages`. Featured projects are hand-written in the HTML.

/** Filter categories, in the order the filter buttons appear. */
export const TAGS = {
  ai: 'AI',
  security: 'Security',
  automation: 'Automation',
  vision: 'Computer Vision',
  data: 'Data',
  app: 'App',
} as const;

export type Tag = keyof typeof TAGS;

export function isTag(value: string | undefined): value is Tag {
  return value !== undefined && Object.hasOwn(TAGS, value);
}

/** Icon tile tints, matching the .project-icon--* modifiers in style.css. */
export type Accent = 'cyan' | 'violet' | 'coral' | 'amber' | 'green';

export interface Project {
  /** Used for the card's id and its details panel id, so it must be unique per page. */
  id: string;
  title: string;
  description: string;
  details: string;
  icon: `assets/projects/icons/${string}.png`;
  accent: Accent;
  tags: Tag[];
  stack: string[];
  repo?: `https://github.com/${string}`;
}

export const PROJECTS: Project[] = [
  {
    id: 'llm-capture',
    title: 'AI Agent — LLM Output Capture Tool',
    description: 'An AI-powered agent to capture, store, and organise outputs from LLM interactions, integrating prompt engineering and REST API integration.',
    details: 'Built to systematically capture and structure outputs generated during LLM interactions, this tool integrates directly with REST APIs to persist responses for later analysis, auditing, or downstream automation — reducing the manual effort of tracking prompt/response pairs across sessions.',
    icon: 'assets/projects/icons/capture.png',
    accent: 'cyan',
    tags: ['ai', 'automation'],
    stack: ['AI Agents', 'REST API', 'Prompt Engineering'],
  },
  {
    id: 'pretexting-generator',
    title: 'Pretexting Script Generator & Red-Team Evaluator',
    description: 'A security training tool using a dual-LLM architecture: one model generates pretexting scripts, a second scores them as a red-team analyst.',
    details: 'One model generates realistic pretexting scripts targeting corporate personas (IT helpdesk, HR, executives), while a second model acts as a red-team analyst, scoring each script on plausibility, psychological tactic, risk level, and detection likelihood. Outputs are scoped exclusively to security training scenarios through a responsible AI framework enforced at the system prompt level.',
    icon: 'assets/projects/icons/pretexting.png',
    accent: 'amber',
    tags: ['ai', 'security'],
    stack: ['Dual-LLM', 'Red-Team', 'Responsible AI'],
  },
  {
    id: 'spam-detection',
    title: 'Email Spam Detection',
    description: 'A machine-learning spam detection system using NLP and a Random Forest classifier to accurately identify spam emails.',
    details: 'Preprocesses raw email text with NLP techniques (tokenization, vectorization) and trains a Random Forest classifier to separate spam from legitimate messages, evaluated on classification accuracy and precision/recall.',
    icon: 'assets/projects/icons/spam.png',
    accent: 'amber',
    tags: ['ai', 'security'],
    stack: ['NLP', 'Random Forest', 'Python'],
    repo: 'https://github.com/JRBaiao/Email-Spam-Detection',
  },
  {
    id: 'intrusion-detection',
    title: 'Real-Time Intrusion Detection System',
    description: 'Monitors network traffic in real time and uses anomaly-detection machine learning to flag suspicious activity and raise alerts.',
    details: 'Analyzes network packets as they arrive, applying anomaly-detection algorithms to distinguish normal traffic patterns from behavior indicative of a potential cyber-attack, and surfaces alerts in real time.',
    icon: 'assets/projects/icons/intrusion.png',
    accent: 'green',
    tags: ['ai', 'security'],
    stack: ['Anomaly Detection', 'Network Security', 'Python'],
    repo: 'https://github.com/JRBaiao/Real-Time-IDS',
  },
  {
    id: 'gesture-recognition',
    title: 'Hand Gesture Recognition',
    description: 'A computer vision system that processes hand landmarks in real time and recognizes custom gestures.',
    details: 'Tracks hand landmarks from webcam input and matches them against predefined gesture models, enabling gesture-based interaction without any physical controller.',
    icon: 'assets/projects/icons/gesture.png',
    accent: 'violet',
    tags: ['ai', 'vision'],
    stack: ['Computer Vision', 'OpenCV', 'Python'],
    repo: 'https://github.com/JRBaiao/Hand-Gesture-Recognition',
  },
  {
    id: 'facial-detection',
    title: 'Facial Detection System',
    description: 'A real-time facial detection application built with Python and OpenCV that detects and highlights human faces via webcam or image input.',
    details: "Uses OpenCV's detection pipeline to locate and highlight faces in a live webcam feed or static images, serving as a foundation for further face-recognition or access-control work.",
    icon: 'assets/projects/icons/face.png',
    accent: 'cyan',
    tags: ['ai', 'vision', 'security'],
    stack: ['Computer Vision', 'OpenCV', 'Python'],
    repo: 'https://github.com/JRBaiao/Facial-Detection-System-',
  },
  {
    id: 'database-project',
    title: 'Database Management Project',
    description: 'A relational database design built for a Brazilian e-commerce company, modeled from its historical order and customer datasets.',
    details: 'Designed the schema, relationships, and normalization for an e-commerce dataset — covering orders, customers, products, and payments — as part of a database management module.',
    icon: 'assets/projects/icons/database.png',
    accent: 'violet',
    tags: ['data'],
    stack: ['Database Design', 'SQL'],
    repo: 'https://github.com/JRBaiao/Database-Management-Project',
  },
  {
    id: 'currency-converter',
    title: 'Currency Converter',
    description: 'A currency conversion app — my first project built in Java, applying core object-oriented programming fundamentals.',
    details: 'An early learning project converting between currencies using live or fixed exchange rates — built to practice Java fundamentals: classes, methods, and basic I/O.',
    icon: 'assets/projects/icons/currency.png',
    accent: 'green',
    tags: ['app'],
    stack: ['Java', 'OOP'],
    repo: 'https://github.com/JRBaiao/Currency-Converter',
  },
];
