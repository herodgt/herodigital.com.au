import { defineField, defineType } from 'sanity';

export const growthTier = defineType({
  name: 'growthTier',
  title: 'Growth service tier',
  type: 'document',
  fields: [
    defineField({ name: 'id', type: 'string' }),
    defineField({ name: 'name', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'price', type: 'number', validation: (R) => R.required() }),
    defineField({ name: 'period', type: 'string', initialValue: 'month' }),
    defineField({ name: 'who', type: 'text' }),
    defineField({ name: 'points', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'featured', type: 'boolean' }),
  ],
});
