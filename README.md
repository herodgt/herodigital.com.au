# herodigital.com.au

Astro (static) site for Hero Digital (Brisbane). Local fallback content is used whenever `SANITY_PROJECT_ID` is not set, so the site builds without a Sanity account.

**This repository has not been deployed.** Nothing is published until Jeff connects Cloudflare Pages and a Sanity project.

- Framework: [Astro 7](https://astro.build)
- CMS: [Sanity](https://www.sanity.io) (Studio in `/studio`)
- Hosting target: Cloudflare Pages
- Design: ported from `/workspace/herodigital-site-mockups`

## Local preview

```bash
cd /workspace/herodigital-site
npm install
npm run build
npm run preview -- --host 127.0.0.1 --port 4321
```

Or `npm run dev` for the development server. Leave `SANITY_PROJECT_ID` unset to render from `src/data/content.ts`.

## Environment

Copy `.env.example` to `.env`. Variables:

| Variable | Required? | Purpose |
|---|---|---|
| `SANITY_PROJECT_ID` or `PUBLIC_SANITY_PROJECT_ID` | No | When set, pages try to load content from Sanity and fall back to local data if the request fails |
| `SANITY_DATASET` | No | Defaults to `production` |
| `PUBLIC_FORM_ENDPOINT` | No | Forms POST JSON here. Leave blank for local preview (the form explains that it does not send) |

A Cloudflare Worker or Formspree URL can be added later as the form endpoint. Until then, people can also write to jcheng@hero.tt.

## Sanity Studio

```bash
cd studio
npm install sanity @sanity/vision styled-components
# Create a project at https://www.sanity.io (Jeff needs to log in)
# Then set SANITY_STUDIO_PROJECT_ID and SANITY_STUDIO_DATASET
echo 'SANITY_STUDIO_PROJECT_ID=xxxxxxxx' > .env
echo 'SANITY_STUDIO_DATASET=production' >> .env
npm run dev
```

Schemas live in `studio/schemas/` and cover:

- `siteSettings`
- `page`
- `faq`
- `post` (insights)
- `caseStudy` (keep unpublished until real 90-day pilots exist; no patient stories)
- `aiVisibilityPlan`, `growthTier`, `websitePackage`

The Studio can be hosted later at `studio.herodigital.com.au` (a second Cloudflare Pages project, or Sanity’s hosted Studio). It is a subproject so `npm run build` in the site root does not need a Sanity login.

## Deploy to Cloudflare Pages (when Jeff is ready)

1. Put this folder in a GitHub repository.
2. In Cloudflare Pages, create a project from that repo.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Root directory: this folder (or the monorepo path that contains `package.json`).
6. Environment variables: `SANITY_PROJECT_ID`, `SANITY_DATASET`, `PUBLIC_FORM_ENDPOINT`.
7. Attach the custom domain `herodigital.com.au` (and redirect `herodigital.au`, `hero.tt` website records only — do not touch MX).
8. In Sanity, add a webhook (on publish/update) that triggers a Cloudflare Pages deploy hook. That is what rebuilds the static site when content changes.

Static output is enough. Do not add `@astrojs/cloudflare` unless you later need a Worker for the form or other server code.

`public/_redirects` already maps a few older prototype paths. `public/_headers` sets basic security headers. `public/robots.txt` allows AI crawlers and points at the sitemap. `public/llms.txt` describes the offer for language models.

## What’s in the site

Every route from the 14 November 2026 site structure is implemented, with real copy, public prices in AUD ex GST, and Ahpra/ACL-safe wording (targets are aims, not guarantees; no fabricated stats, testimonials or client logos). `/results/` is clearly labelled “case studies coming”. Insights marked “coming soon” are placeholder outlines.

## Scripts

- `npm run dev` — development server
- `npm run build` — production static build
- `npm run preview` — serve `dist`
