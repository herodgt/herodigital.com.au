import { defineField, defineType } from 'sanity';

export const faq = defineType({
  name: 'faq',
  title: 'FAQ',
  type: 'document',
  fields: [
    defineField({ name: 'question', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'answer', type: 'text', validation: (R) => R.required() }),
    defineField({
      name: 'group',
      type: 'string',
      options: { list: ['home', 'websites', 'plans', 'growth'] },
      initialValue: 'home',
    }),
    defineField({ name: 'order', type: 'number' }),
  ],
  preview: { select: { title: 'question' } },
});
