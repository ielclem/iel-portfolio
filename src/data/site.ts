// Site content for the store prototype. Edit names, links and placeholders here.

export const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');

export const STORE_NAME = "iel's market"; // placeholder until the real name is picked

export const LINKS = {
  linkedin: 'https://www.linkedin.com/in/iel-seth-clemente-ba0793295/',
  email: 'ielsethclemente@gmail.com',
  resume: null as string | null, // e.g. `${base}resume.pdf` once the file is in /public
};

export type Figure = { src: string; alt: string; caption: string };

export type Project = {
  aisle: number;
  slug?: string;          // page lives at /store/<slug>/
  title: string;
  section: string;        // the department name on the back wall
  tagline: string;
  type?: string;          // what it is, shown first on the facts label
  role: string;
  timeline?: string;
  team?: string;
  tools?: string;
  problem: string;        // one line, used in the express lane
  outcome: string;        // one line, used on the facts label and express lane
  cover?: string;
  coverSmall?: string;
  figures?: { background?: Figure[]; problem?: Figure[]; process?: Figure[]; solution?: Figure[] };
  video?: { href: string; label: string };
  restocking?: boolean;
};

// Placeholder copy until the real writing exists.
export const LOREM = {
  short: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  para: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  para2: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
};

const img = (slug: string, page: number) => `${base}projects/${slug}/p${page}.webp`;

export const PROJECTS: Project[] = [
  {
    aisle: 1, slug: 'calico-critters', title: 'Calico Critters Redesign', section: 'toys',
    tagline: LOREM.short, type: 'Website redesign', role: 'Lorem ipsum', timeline: 'Lorem ipsum', team: 'Lorem ipsum', tools: 'Lorem, ipsum, dolor',
    problem: LOREM.short, outcome: LOREM.short,
    cover: img('calico-critters', 1), coverSmall: `${base}projects/calico-critters/cover-sm.webp`,
    figures: {
      background: [{ src: img('calico-critters', 2), alt: 'Initial sketches, user flow, inspiration and a review of the existing Calico Critters website', caption: 'Sketches, first user flow, inspiration and the existing site.' }],
      process: [{ src: img('calico-critters', 3), alt: 'Initial concept art of the characters for the redesign', caption: 'Initial concept art.' }],
      solution: [{ src: img('calico-critters', 4), alt: 'Lo-fidelity and hi-fidelity concepts for the main, character, store and cart pages', caption: 'Lo-fi to hi-fi: main, character, store and cart pages.' }],
    },
  },
  {
    aisle: 2, slug: 'lumify', title: 'Lumify', section: 'health & beauty',
    tagline: LOREM.short, type: 'Skincare app + device', role: 'Lorem ipsum', timeline: 'Lorem ipsum', team: 'Lorem ipsum', tools: 'Lorem, ipsum, dolor',
    problem: LOREM.short, outcome: LOREM.short,
    cover: img('lumify', 1), coverSmall: `${base}projects/lumify/cover-sm.webp`,
    figures: {
      background: [{ src: img('lumify', 2), alt: 'Initial ideas, how-might-we questions, concept user flows and product sketches', caption: 'Initial ideas, how-might-we questions and first concepts.' }],
      problem: [{ src: img('lumify', 3), alt: 'User persona with values, goals and frustrations around skincare routines', caption: 'Who we designed for.' }],
      process: [{ src: img('lumify', 4), alt: 'Sketches for the routine flow, the device remote and the profile', caption: 'Routine, remote and profile sketches.' }],
      solution: [
        { src: img('lumify', 5), alt: 'Final Lumify app screens: onboarding, routines, shelf, AI skin analysis and product pages', caption: 'The final concept, app and Lumi pad.' },
        { src: img('lumify', 6), alt: 'Lumify asset sheet with illustrations, buttons, cards, navigation and icons', caption: 'Lumify assets.' },
      ],
    },
  },
  {
    aisle: 3, slug: 'keepsake', title: 'Keepsake', section: 'cards & gifts',
    tagline: LOREM.short, type: 'AR mobile app', role: 'Lorem ipsum', timeline: 'Lorem ipsum', team: 'Lorem ipsum', tools: 'Lorem, ipsum, dolor',
    problem: LOREM.short, outcome: LOREM.short,
    cover: img('keepsake', 1), coverSmall: `${base}projects/keepsake/cover-sm.webp`,
    figures: {
      background: [{ src: img('keepsake', 2), alt: 'Brainstorming, inspiration and the initial concept', caption: 'Brainstorming and the initial concept.' }],
      problem: [{ src: img('keepsake', 3), alt: 'Competitive review of similar apps and first concept drafts', caption: 'Competitors and first drafts.' }],
      solution: [{ src: img('keepsake', 4), alt: 'Final Keepsake screens: object postcard, AR scanner, AR 3D letter and captures', caption: 'Final app: object postcards, AR scanner and 3D letters.' }],
    },
    video: { href: 'https://www.youtube.com/watch?v=KI7FPoy9BLs', label: 'Watch the prototype guide' },
  },
  { aisle: 4, title: 'In Progress', section: 'frozen', tagline: 'Something new is being stocked.', role: 'Product designer', problem: 'Coming soon.', outcome: 'Coming soon.', restocking: true },
];

export const projectHref = (p: Project) => (p.slug ? `${base}store/${p.slug}/` : null);

// Receipt line items for the checkout / about section.
export const RECEIPT = [
  { item: 'user research', qty: '1', price: '4.99' },
  { item: 'interaction design', qty: '1', price: '6.50' },
  { item: 'prototyping', qty: '2', price: '3.25' },
  { item: 'design systems', qty: '1', price: '5.75' },
  { item: 'figma', qty: '∞', price: '0.00' },
  { item: 'illustration', qty: 'daily', price: '2.00' },
  { item: 'love', qty: '1', price: 'free' },
];
