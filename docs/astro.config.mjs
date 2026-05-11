// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://nahida-aa.github.io/agnostic-query',
  integrations: [
    starlight({
      title: 'Agnostic Query',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/Nahida-aa/agnostic-query' },
      ],
      sidebar: [
        {
          label: 'Guides',
          items: [
            { label: 'Getting Started', slug: 'guides/getting-started' },
            { label: 'Builder API', slug: 'guides/builder' },
            { label: 'WHERE System', slug: 'guides/where' },
            { label: 'Adapters', slug: 'guides/adapters' },
            { label: 'End-to-End Examples', slug: 'guides/e2e' },
            { label: 'Validation', slug: 'guides/validation' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'API', slug: 'reference/api' },
          ],
        },
      ],
    }),
  ],
});
