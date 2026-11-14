export const SITE = {
  name: 'Hero Digital (Brisbane)',
  shortName: 'Hero Digital',
  legalName: 'Hero Digital',
  url: 'https://herodigital.com.au',
  email: 'jcheng@hero.tt',
  locale: 'en_AU',
  lang: 'en-AU',
  founder: 'Jeff Cheng',
  founderRole: 'Founder & Managing Director',
  city: 'Brisbane',
  country: 'Australia',
  description:
    'AI and Google visibility for Australian dental implant and full-arch clinics. Fixed public prices, written-only delivery, Ahpra-safe work. Targets are aims, not guarantees.',
  themeColor: '#f3f3f4',
  formEndpoint: import.meta.env.PUBLIC_FORM_ENDPOINT ?? '',
};

export const NAV = [
  { href: '/ai-visibility/', label: 'AI Visibility' },
  { href: '/growth/', label: 'Growth' },
  { href: '/websites/', label: 'Websites' },
  { href: '/hero-one/', label: 'Hero One' },
] as const;

export function abs(path: string): string {
  if (path.startsWith('http')) return path;
  return `${SITE.url}${path.startsWith('/') ? path : `/${path}`}`;
}

export const FINE_PRINT =
  'Prices are AUD ex GST. Targets are aims measured against each clinic’s own baseline. They are reported, not guaranteed. Nothing on this site is legal, clinical or financial advice.';
