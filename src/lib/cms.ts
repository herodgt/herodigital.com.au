import { createClient, type SanityClient } from '@sanity/client';
import {
  aiPlans,
  growthTiers,
  websitePackages,
  homeFaqs,
  posts,
  type Faq,
  type Plan,
  type Post,
  type WebsitePkg,
} from '../data/content';

function projectId(): string | undefined {
  return import.meta.env.SANITY_PROJECT_ID || import.meta.env.PUBLIC_SANITY_PROJECT_ID;
}

function client(): SanityClient | null {
  const id = projectId();
  if (!id) return null;
  return createClient({
    projectId: id,
    dataset: import.meta.env.SANITY_DATASET || import.meta.env.PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2026-11-14',
    useCdn: true,
  });
}

export const usingSanity = Boolean(projectId());

export type SiteSettings = {
  name: string;
  email: string;
  description: string;
};

const fallbackSettings: SiteSettings = {
  name: 'Hero Digital (Brisbane)',
  email: 'jcheng@hero.tt',
  description:
    'AI and Google visibility for Australian dental implant clinics. Targets are aims, not guarantees.',
};

export async function getSettings(): Promise<SiteSettings> {
  const c = client();
  if (!c) return fallbackSettings;
  try {
    const data = await c.fetch<SiteSettings | null>(`*[_type == "siteSettings"][0]{name,email,description}`);
    return data ?? fallbackSettings;
  } catch {
    return fallbackSettings;
  }
}

export async function getFaqs(group = 'home'): Promise<Faq[]> {
  const c = client();
  if (!c) return homeFaqs;
  try {
    const data = await c.fetch<Faq[]>(
      `*[_type == "faq" && group == $group] | order(order asc){question,answer}`,
      { group }
    );
    return data?.length ? data : homeFaqs;
  } catch {
    return homeFaqs;
  }
}

export async function getAiPlans(): Promise<Plan[]> {
  return fetchPlans('aiVisibilityPlan', aiPlans);
}
export async function getGrowthTiers(): Promise<Plan[]> {
  return fetchPlans('growthTier', growthTiers);
}
export async function getWebsitePackages(): Promise<WebsitePkg[]> {
  const c = client();
  if (!c) return websitePackages;
  try {
    const data = await c.fetch<WebsitePkg[]>(
      `*[_type == "websitePackage"] | order(price asc){id,name,price,upfront,instalment,months,weeks,pages,points}`
    );
    return data?.length ? data : websitePackages;
  } catch {
    return websitePackages;
  }
}

async function fetchPlans(type: string, fallback: Plan[]): Promise<Plan[]> {
  const c = client();
  if (!c) return fallback;
  try {
    const data = await c.fetch<Plan[]>(
      `*[_type == $type] | order(price asc){id,name,price,period,setup,who,points,featured}`,
      { type }
    );
    return data?.length ? data : fallback;
  } catch {
    return fallback;
  }
}

export async function getPosts(): Promise<Post[]> {
  const c = client();
  if (!c) return posts;
  try {
    const data = await c.fetch<Post[]>(
      `*[_type == "post"] | order(_createdAt desc){slug,title,excerpt,status,date,body}`
    );
    return data?.length ? data : posts;
  } catch {
    return posts;
  }
}

export async function getPost(slug: string): Promise<Post | undefined> {
  const all = await getPosts();
  return all.find((p) => p.slug === slug);
}

export async function getCaseStudies(): Promise<never[]> {
  const c = client();
  if (!c) return [];
  try {
    const data = await c.fetch<never[]>(`*[_type == "caseStudy" && defined(title)]`);
    return data ?? [];
  } catch {
    return [];
  }
}
