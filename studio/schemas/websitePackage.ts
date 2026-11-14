import { defineField, defineType } from 'sanity';

export const websitePackage = defineType({
  name: 'websitePackage',
  title: 'Website package',
  type: 'document',
  fields: [
    defineField({ name: 'id', type: 'string' }),
    defineField({ name: 'name', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'price', type: 'number', validation: (R) => R.required() }),
    defineField({ name: 'upfront', type: 'number' }),
    defineField({ name: 'instalment', type: 'number' }),
    defineField({ name: 'months', type: 'number' }),
    defineField({ name: 'weeks', type: 'number' }),
    defineField({ name: 'pages', type: 'string' }),
    defineField({ name: 'points', type: 'array', of: [{ type: 'string' }] }),
  ],
});
