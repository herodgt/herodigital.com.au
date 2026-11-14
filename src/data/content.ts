export type Faq = { question: string; answer: string };
export type Plan = {
  id: string;
  name: string;
  price: number;
  period: 'month' | 'one-off';
  setup?: number;
  who: string;
  points: string[];
  featured?: boolean;
};
export type WebsitePkg = {
  id: string;
  name: string;
  price: number;
  upfront: number;
  instalment: number;
  months: number;
  weeks: number;
  pages: string;
  points: string[];
};
export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  status: 'coming-soon' | 'published';
  date?: string;
  body: string[];
};

export const aiPlans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 1995,
    period: 'month',
    setup: 1995,
    who: 'Solo or quieter-area implant clinics, typically with 40+ Google reviews.',
    points: [
      '40 searches tracked across 4 AI tools',
      '2 Ahpra-reviewed implant articles a month',
      '6 core directory listings',
      'Review-request templates',
      'Right of first refusal on the area',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 2995,
    period: 'month',
    setup: 1995,
    featured: true,
    who: 'Competitive suburbs that want to be among the local shortlist, typically with 80+ reviews.',
    points: [
      '80 searches tracked across 6 AI tools',
      '4 Ahpra-reviewed articles a month',
      '15+ listings and automated review requests',
      'Share of voice against 3 named competitors',
      '5 km metro / 25 km regional exclusivity',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 4995,
    period: 'month',
    setup: 1995,
    who: 'Full-arch and All-on-4 centres competing across a city.',
    points: [
      '150 searches tracked, with fortnightly checks',
      '8 articles a month, including a full-arch hub',
      '1 media placement a month',
      'Full-arch enquiry tagging on the scoreboard',
      '10 km metro exclusivity',
    ],
  },
];

export const growthTiers: Plan[] = [
  {
    id: 'essential',
    name: 'Essential',
    price: 2495,
    period: 'month',
    who: 'Proposed name and scope, confirm as we go. Technical and on-page implant SEO, with ads recommendations.',
    points: [
      'Technical and on-page work on implant pages',
      'Monthly search-visibility letter',
      '2 pitches or placements a month',
      'Google Ads account review and recommendations (the clinic can run ads themselves)',
      'Sold only after a fit check',
    ],
  },
  {
    id: 'advanced',
    name: 'Advanced',
    price: 3995,
    period: 'month',
    featured: true,
    who: 'Proposed mid-tier. This is the growth stack included in Hero One.',
    points: [
      'A full implant SEO programme, including supporting pages',
      '4 pitches or placements a month',
      'Full management of implant / full-arch search campaigns',
      'Ad spend paid separately by the clinic',
      'Sold only after a fit check',
    ],
  },
  {
    id: 'authority',
    name: 'Authority',
    price: 5995,
    period: 'month',
    who: 'Proposed top tier, city-wide implant and full-arch growth work.',
    points: [
      'City-wide implant and full-arch SEO, including location pages',
      '8 pitches or placements a month, plus a monthly PR shortlist',
      'Search plus remarketing, with fortnightly optimisation',
      'Ad spend paid separately by the clinic',
      'Sold only after a fit check',
    ],
  },
];

export const websitePackages: WebsitePkg[] = [
  {
    id: 'launch',
    name: 'Launch',
    price: 9995,
    upfront: 4997.5,
    instalment: 999.5,
    months: 5,
    weeks: 4,
    pages: 'Up to 10 pages',
    points: [
      'Premium template-based design in Astro',
      'AI-ready: schema, llms.txt and speed work',
      'Ahpra-checked copy',
      'Sanity CMS so you can edit pages after launch',
      'Delivered in 4 weeks',
    ],
  },
  {
    id: 'signature',
    name: 'Signature',
    price: 14995,
    upfront: 7497.5,
    instalment: 1499.5,
    months: 5,
    weeks: 6,
    pages: 'Up to 25 pages',
    points: [
      'Fully custom design',
      'Implant and full-arch landing pages',
      'Booking integration',
      '3 rounds of revisions',
      'Sanity CMS, delivered in 6 weeks',
    ],
  },
  {
    id: 'flagship',
    name: 'Flagship',
    price: 19995,
    upfront: 9997.5,
    instalment: 1999.5,
    months: 5,
    weeks: 8,
    pages: 'Up to 50 pages',
    points: [
      'Custom design and a full content hub',
      'All copywriting included',
      'Location pages',
      'Premium motion and photography direction',
      'Sanity CMS, delivered in 8 weeks',
    ],
  },
];

export const ladder = [
  {
    level: 'Level 0 · Lead magnet',
    name: 'Free AI Visibility Audit',
    price: 'Free',
    href: '/#audit',
    cta: 'Request the audit →',
    body: 'A branded PDF of your technical score, whether test prompts mention you, and the top fixes. Enter your website and email. No call needed.',
  },
  {
    level: 'Level 1 · Entry',
    name: 'AI Visibility Fix Sprint',
    price: '$1,495 one-off',
    href: '/ai-visibility/fix-sprint/',
    cta: 'See the sprint →',
    body: 'Crawler access, schema, llms.txt, implant page structure and listings, then a re-audit after 30 days. Credited toward setup if you move to a plan.',
  },
  {
    level: 'Level 2 · Core retainers',
    name: 'AI Visibility plans',
    price: '$1,995–$4,995 / month + $1,995 setup',
    href: '/ai-visibility/',
    cta: 'Compare the three plans →',
    body: 'Starter, Growth or Premium. 90-day minimum, then month to month. Outcome targets are set from your baseline and reported, not guaranteed.',
    core: true,
  },
  {
    level: 'Level 3 · By fit check',
    name: 'Growth services',
    price: '$2,495–$5,995 / month',
    href: '/growth/',
    cta: 'Check if we’re a good fit →',
    body: 'SEO, link building and Google Ads management at three published prices. Ad spend is separate. We only take a clinic after a fit check; otherwise you’re on the waitlist.',
  },
  {
    level: 'Level 4 · Fixed builds',
    name: 'Custom websites',
    price: '$9,995–$19,995 one-off',
    href: '/websites/',
    cta: 'See website packages →',
    body: 'Launch, Signature or Flagship, built in Astro and Sanity. Page caps keep the price fixed. 50% upfront, then 10% of the price per month, or pay off early.',
  },
  {
    level: 'Level 5 · By application',
    name: 'Hero One',
    price: '$9,995 / month',
    href: '/hero-one/',
    cta: 'View Hero One →',
    body: 'One VIP package: Premium, mid-tier growth services, a Signature website on a 12-month commitment, priority turnaround and city-wide exclusivity. One clinic per city, by application.',
    vip: true,
  },
];

export const homeFaqs: Faq[] = [
  {
    question: 'Do I need WordPress?',
    answer:
      'No. You need an editable main domain and a way for us to add tracking, schema and, usually, a little head code. Most modern stacks are fine, including custom and Astro sites. New sites we build use Astro and Sanity.',
  },
  {
    question: 'Can you guarantee we’ll be recommended?',
    answer:
      'No, and you should be wary of anyone who does. AI tools and patients decide what happens. We commit to the work, a target set from your measured baseline, and a monthly scoreboard that shows every enquiry we count.',
  },
  {
    question: 'What if we only have about 40 reviews and want Premium?',
    answer:
      'We’ll either run Premium with a review sprint (targets start at 80 reviews or in month 4, whichever comes first) or start you on Growth and upgrade later. We’ll say which in the written proposal.',
  },
  {
    question: 'Is Hero One for everyone?',
    answer:
      'No. It’s one package, by application, limited to one clinic per city. There’s a dedicated page if you want to read the scope and apply. Proposed terms include a 12-month minimum and no separate setup fee.',
  },
  {
    question: 'How do website payments work?',
    answer:
      '50% of the package price is due upfront. The balance is paid at 10% of the package price each month until it is cleared, or you can pay off early. Hero Digital keeps ownership of the code, design and Sanity project until the site is fully paid; you have a licence to use the live site in the meantime. Full transfer happens on payoff.',
  },
];

export const posts: Post[] = [
  {
    slug: 'how-ai-tools-decide-which-implant-clinic-to-name',
    title: 'How AI tools decide which implant clinic to name',
    excerpt: 'What we look for in test prompts, and what we can’t control.',
    status: 'coming-soon',
    body: [
      'This is a placeholder outline, not a published article. It will be written and Ahpra-checked before it goes live.',
      'The planned piece will explain how we run dated test prompts in ChatGPT, Perplexity, Gemini and Google’s AI answers, what signals those tools often draw on (pages, listings, reviews, mentions), and why a single screenshot is not a result we would claim.',
      'It will not invent statistics, name real patients, or promise that a clinic will be recommended.',
    ],
  },
  {
    slug: 'ahpra-advertising-rules-for-implant-pages',
    title: 'What Ahpra advertising rules mean for implant pages',
    excerpt: 'A practical reading for principals, not legal advice.',
    status: 'coming-soon',
    body: [
      'This is a placeholder outline, not a published article, and it is not legal advice.',
      'The planned piece will cover how we treat testimonials, clinical claims, before-and-after images and “guaranteed” wording on implant and full-arch pages, and how every public asset goes through an AI pre-screen, a human reviewer and the clinic’s written approval.',
    ],
  },
  {
    slug: 'why-google-reviews-show-up-in-ai-answers',
    title: 'Why Google reviews show up in AI answers',
    excerpt: 'And how we ask for them without writing the review for the patient.',
    status: 'coming-soon',
    body: [
      'This is a placeholder outline, not a published article.',
      'The planned piece will describe why review volume and recency often appear in AI answers, how we send neutral review invitations, and how we keep replies privacy-safe. We do not write reviews on a patient’s behalf.',
    ],
  },
];

export const defaultFaqs = homeFaqs;

export function money(n: number): string {
  return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: n % 1 ? 2 : 0 });
}
