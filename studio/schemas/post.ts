import { defineField, defineType } from 'sanity';

export const post = defineType({
  name: 'post',
  title: 'Insight post',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' }, validation: (R) => R.required() }),
    defineField({ name: 'excerpt', type: 'text' }),
    defineField({
      name: 'status',
      type: 'string',
      options: { list: ['coming-soon', 'published'] },
      initialValue: 'coming-soon',
    }),
    defineField({ name: 'date', type: 'date' }),
    defineField({ name: 'body', type: 'array', of: [{ type: 'text' }], description: 'Plain paragraphs for now. Do not invent statistics or use patient stories.' }),
  ],
});
