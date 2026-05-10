// Paste this over the default quartz.config.ts in your Quartz fork's root.
// Quartz v4. Docs: https://quartz.jzhao.xyz/configuration

import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

const config: QuartzConfig = {
  configuration: {
    pageTitle: "Horror on the Orient Express",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: null, // swap in plausible/umami later if you want
    locale: "en-GB",
    baseUrl: "hotoe.arrowed.games",
    ignorePatterns: ["private", "templates", ".obsidian", "transcripts"],
    defaultDateType: "modified",
    theme: {
      // All three fonts are self-hosted. @font-face rules live in quartz/styles/custom.scss.
      // fontOrigin "local" tells Quartz not to inject Google Fonts <link> tags.
      fontOrigin: "local",
      cdnCaching: false,
      typography: {
        header: "Amarante",
        body: "Aptos Narrow",
        code: "ErikasBuero",
      },
      // Palette pulled from Fancy-a-Story → Art Deco skin in your vault.
      // Dark mode is the primary mode you use; light mode mirrors the Art Deco light variant.
      colors: {
        lightMode: {
          light: "#d8d7cb",       // --color-base-00 (Art Deco light bg)
          lightgray: "#cecdc2",   // --color-base-10
          gray: "#8f8f89",        // --color-base-60 (muted)
          darkgray: "#060a24",    // --color-base-100 (body text)
          dark: "#060a24",        // strongest text
          secondary: "#f07605",   // accent (orange, from app.json)
          tertiary: "#ad941f",    // gold complement
          highlight: "rgba(240, 118, 5, 0.15)",
          textHighlight: "rgba(173, 148, 31, 0.4)",
        },
        darkMode: {
          light: "#070918",       // --color-base-00 (Art Deco dark bg, deep midnight)
          lightgray: "#1d1e26",   // --color-base-10
          gray: "#83817a",        // --color-base-60 (muted)
          darkgray: "#e2dec5",    // --color-base-100 (body text, warm cream)
          dark: "#ffffff",        // strongest text / headings emphasis
          secondary: "#f07605",   // accent (orange)
          tertiary: "#e0c952",    // gold (middle-color)
          highlight: "rgba(240, 118, 5, 0.18)",
          textHighlight: "rgba(224, 201, 82, 0.35)",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({ priority: ["frontmatter", "filesystem"] }),
      Plugin.SyntaxHighlighting({ theme: { light: "github-light", dark: "github-dark" }, keepBackground: false }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts(), Plugin.ExplicitPublish()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({ enableSiteMap: true, enableRSS: true }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // CustomOgImages works because quartz/util/og.tsx is patched to read
      // self-hosted fonts from quartz/static/fonts/ before falling back to
      // Google Fonts. Amarante uses weight 700 (header), Aptos Narrow uses
      // weight 400 (body). Both must exist as .ttf (satori does not read woff2).
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
