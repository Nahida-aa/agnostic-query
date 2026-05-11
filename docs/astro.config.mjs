// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightCatppuccin from '@catppuccin/starlight'
import starlightUiTweaks from 'starlight-ui-tweaks'
import starlightGitHubAlerts from 'starlight-github-alerts';
import astroMermaid from 'astro-mermaid';

export default defineConfig({
  site: 'https://nahida-aa.github.io',
  base: '/agnostic-query',
  integrations: [
    starlight({
      plugins: [
        starlightGitHubAlerts(),
        starlightUiTweaks(),
        starlightCatppuccin({
				  dark: { flavor: "macchiato", accent: "lavender" },
          light: { flavor: "latte", accent: "lavender" },
			  })
      ],
      title: 'Agnostic Query',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/Nahida-aa/agnostic-query' },
      ],
      sidebar: [
        {
          label: 'Guides',
          items: [
            { label: 'Why Agnostic Query?', slug: 'guides/why' },
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
    astroMermaid(),
  ],
});
