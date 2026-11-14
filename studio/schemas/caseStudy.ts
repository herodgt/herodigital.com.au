import { defineField, defineType } from 'sanity';

export const caseStudy = defineType({
  name: 'caseStudy',
  title: 'Case study',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' } }),
    defineField({ name: 'anonymised', type: 'boolean', initialValue: true }),
    defineField({ name: 'clinicLabel', type: 'string', description: 'e.g. “A Brisbane implant clinic”. No patient names.' }),
    defineField({ name: 'summary', type: 'text', description: 'Marketing work and measured enquiries only. No clinical claims or patient testimonials.' }),
    defineField({ name: 'published', type: 'boolean', initialValue: false }),
  ],
});
