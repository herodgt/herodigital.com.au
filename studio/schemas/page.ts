import { defineField, defineType } from 'sanity';

export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' }, validation: (R) => R.required() }),
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'lead', type: 'text' }),
    defineField({ name: 'body', type: 'array', of: [{ type: 'block' }] }),
  ],
});
