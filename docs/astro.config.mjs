// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightCatppuccin from '@catppuccin/starlight'
import starlightUiTweaks from 'starlight-ui-tweaks'
import starlightGitHubAlerts from 'starlight-github-alerts';
// bun add  starlight-ui-tweaks @catppuccin/starlight starlight-github-alerts

export default defineConfig({
  site: 'https://nahida-aa.github.io/agnostic-query',
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
