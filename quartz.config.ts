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
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Cormorant Garamond",
        body: "EB Garamond",
        code: "JetBrains Mono",
      },
      colors: {
        lightMode: {
          light: "#faf4eb",
          lightgray: "#e5d8c2",
          gray: "#8a7d6a",
          darkgray: "#3a2f25",
          dark: "#1f1810",
          secondary: "#7a1f1f",
          tertiary: "#b8860b",
          highlight: "rgba(184, 134, 11, 0.18)",
          textHighlight: "#f5d97799",
        },
        darkMode: {
          light: "#1a140e",
          lightgray: "#2e2419",
          gray: "#6b5d4c",
          darkgray: "#d3c5ad",
          dark: "#f0e6d2",
          secondary: "#c97a3a",
          tertiary: "#e8c067",
          highlight: "rgba(232, 192, 103, 0.15)",
          textHighlight: "#b8860b66",
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
      Plugin.CustomOgImages(),
    ],
  },
}

export default config