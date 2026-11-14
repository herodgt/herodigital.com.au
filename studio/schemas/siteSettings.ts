import { defineField, defineType } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', title: 'Site name', validation: (R) => R.required() }),
    defineField({ name: 'email', type: 'string', title: 'Email' }),
    defineField({ name: 'description', type: 'text', title: 'Default description' }),
  ],
  preview: { select: { title: 'name' } },
});
