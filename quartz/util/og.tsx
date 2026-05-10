// Paste this over quartz/util/og.tsx in your Quartz fork.
//
// Only one change from upstream Quartz v4: fetchTtf() checks local disk first
// for fonts we've self-hosted, before falling back to the Google Fonts CDN.
// Everything else is verbatim from upstream so future merges stay clean.
//
// Local font lookup table is defined just above fetchTtf().

import { promises as fs } from "fs"
import { FontWeight, SatoriOptions } from "satori/wasm"
import { GlobalConfiguration } from "../cfg"
import { QuartzPluginData } from "../plugins/vfile"
import { JSXInternal } from "preact/src/jsx"
import { FontSpecification, getFontSpecificationName, ThemeKey } from "./theme"
import path from "path"
import { QUARTZ } from "./path"
import { formatDate, getDate } from "../components/Date"
import readingTime from "reading-time"
import { i18n } from "../i18n"

const defaultHeaderWeight = [700]
const defaultBodyWeight = [400]
export async function getSatoriFonts(headerFont: FontSpecification, bodyFont: FontSpecification) {
  const headerWeights: FontWeight[] = (
    typeof headerFont === "string"
      ? defaultHeaderWeight
      : (headerFont.weights ?? defaultHeaderWeight)
  ) as FontWeight[]
  const bodyWeights: FontWeight[] = (
    typeof bodyFont === "string" ? defaultBodyWeight : (bodyFont.weights ?? defaultBodyWeight)
  ) as FontWeight[]

  const headerFontName = typeof headerFont === "string" ? headerFont : headerFont.name
  const bodyFontName = typeof bodyFont === "string" ? bodyFont : bodyFont.name

  const headerFontPromises = headerWeights.map(async (weight) => {
    const data = await fetchTtf(headerFontName, weight)
    if (!data) return null
    return {
      name: headerFontName,
      data,
      weight,
      style: "normal" as const,
    }
  })

  const bodyFontPromises = bodyWeights.map(async (weight) => {
    const data = await fetchTtf(bodyFontName, weight)
    if (!data) return null
    return {
      name: bodyFontName,
      data,
      weight,
      style: "normal" as const,
    }
  })

  const [headerFonts, bodyFonts] = await Promise.all([
    Promise.all(headerFontPromises),
    Promise.all(bodyFontPromises),
  ])

  const fonts: SatoriOptions["fonts"] = [
    ...headerFonts.filter((font): font is NonNullable<typeof font> => font !== null),
    ...bodyFonts.filter((font): font is NonNullable<typeof font> => font !== null),
  ]

  return fonts
}

// ─── LOCAL FONT TABLE ─────────────────────────────────────────────────────────
// Maps "<font family name>" → { <weight>: "<filename in quartz/static/fonts/>" }.
// satori requires TTF/OTF/WOFF (NOT WOFF2). Always point at .ttf files here.
//
// Amarante is a single-weight Google Font; we reuse its regular file for any
// requested weight so satori has something to render.
const LOCAL_FONTS: Record<string, Partial<Record<FontWeight, string>>> = {
  Amarante: {
    400: "amarante-regular.ttf",
    700: "amarante-regular.ttf",
  },
  "Aptos Narrow": {
    400: "aptos-narrow-regular.ttf",
    700: "aptos-narrow-bold.ttf",
  },
  ErikasBuero: {
    400: "erikasbuero-regular.ttf",
  },
}
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Get the `.ttf` file of a font. Checks local disk first, then falls back to
 * the Google Fonts CDN.
 */
export async function fetchTtf(
  rawFontName: string,
  weight: FontWeight,
): Promise<Buffer<ArrayBufferLike> | undefined> {
  // ─── LOCAL DISK LOOKUP (added) ──────────────────────────────────────────────
  const localFile = LOCAL_FONTS[rawFontName]?.[weight]
  if (localFile) {
    const localPath = path.join(QUARTZ, "static", "fonts", localFile)
    try {
      return await fs.readFile(localPath)
    } catch {
      console.warn(
        `\nWarning: Local font ${rawFontName}@${weight} not found at ${localPath}, falling back to Google Fonts`,
      )
    }
  }
  // ────────────────────────────────────────────────────────────────────────────

  const fontName = rawFontName.replaceAll(" ", "+")
  const cacheKey = `${fontName}-${weight}`
  const cacheDir = path.join(QUARTZ, ".quartz-cache", "fonts")
  const cachePath = path.join(cacheDir, cacheKey)

  try {
    await fs.access(cachePath)
    return fs.readFile(cachePath)
  } catch (error) {
    // ignore errors and fetch font
  }

  const cssResponse = await fetch(
    `https://fonts.googleapis.com/css2?family=${fontName}:wght@${weight}`,
  )
  const css = await cssResponse.text()

  const urlRegex = /url\((https:\/\/fonts.gstatic.com\/s\/.*?.ttf)\)/g
  const match = urlRegex.exec(css)

  if (!match) {
    console.warn(
      `\nWarning: Failed to fetch font ${rawFontName} with weight ${weight}, got ${cssResponse.statusText}`,
    )
    return
  }

  const fontResponse = await fetch(match[1])
  const fontData = Buffer.from(await fontResponse.arrayBuffer())
  await fs.mkdir(cacheDir, { recursive: true })
  await fs.writeFile(cachePath, fontData)

  return fontData
}

export type SocialImageOptions = {
  colorScheme: ThemeKey
  height: number
  width: number
  excludeRoot: boolean
  imageStructure: (
    cfg: GlobalConfiguration,
    userOpts: UserOpts,
    title: string,
    description: string,
    fonts: SatoriOptions["fonts"],
    fileData: QuartzPluginData,
  ) => JSXInternal.Element
}

export type UserOpts = Omit<SocialImageOptions, "imageStructure">

export type ImageOptions = {
  title: string
  description: string
  fonts: SatoriOptions["fonts"]
  cfg: GlobalConfiguration
  fileData: QuartzPluginData
}

export const defaultImage: SocialImageOptions["imageStructure"] = (
  cfg: GlobalConfiguration,
  userOpts: UserOpts | undefined,
  title: string,
  description: string,
  _fonts: SatoriOptions["fonts"],
  fileData: QuartzPluginData,
) => {
  // Quartz 4.5.x calls imageStructure with userOpts sometimes undefined.
  // Default to darkMode so the function survives that path.
  const colorScheme: ThemeKey = userOpts?.colorScheme ?? "darkMode"

  const fontBreakPoint = 32
  const useSmallerFont = title.length > fontBreakPoint
  const iconPath = `https://${cfg.baseUrl}/static/icon.png`

  const rawDate = getDate(cfg, fileData)
  const date = rawDate ? formatDate(rawDate, cfg.locale) : null

  const { minutes } = readingTime(fileData.text ?? "")
  const readingTimeText = i18n(cfg.locale).components.contentMeta.readingTime({
    minutes: Math.ceil(minutes),
  })

  const tags = fileData.frontmatter?.tags ?? []
  const bodyFont = getFontSpecificationName(cfg.theme.typography.body)
  const headerFont = getFontSpecificationName(cfg.theme.typography.header)

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        backgroundColor: cfg.theme.colors[colorScheme].light,
        padding: "2.5rem",
        fontFamily: bodyFont,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "0.5rem",
        }}
      >
        <img src={iconPath} width={56} height={56} style={{ borderRadius: "50%" }} />
        <div
          style={{
            display: "flex",
            fontSize: 32,
            color: cfg.theme.colors[colorScheme].gray,
            fontFamily: bodyFont,
          }}
        >
          {cfg.baseUrl}
        </div>
      </div>

      {/* Title */}
      <div style={{ display: "flex", marginTop: "1rem", marginBottom: "1.5rem" }}>
        <h1
          style={{
            margin: 0,
            fontSize: useSmallerFont ? 64 : 72,
            fontFamily: headerFont,
            fontWeight: 700,
            color: cfg.theme.colors[colorScheme].dark,
            lineHeight: 1.2,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </h1>
      </div>

      {/* Description */}
      <div
        style={{
          display: "flex",
          flex: 1,
          fontSize: 36,
          color: cfg.theme.colors[colorScheme].darkgray,
          lineHeight: 1.4,
        }}
      >
        <p
          style={{
            margin: 0,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 5,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {description}
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "2rem",
          paddingTop: "2rem",
          borderTop: `1px solid ${cfg.theme.colors[colorScheme].lightgray}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2rem",
            color: cfg.theme.colors[colorScheme].gray,
            fontSize: 28,
          }}
        >
          {date && (
            <div style={{ display: "flex", alignItems: "center" }}>
              <svg
                style={{ marginRight: "0.5rem" }}
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              {date}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center" }}>
            <svg
              style={{ marginRight: "0.5rem" }}
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            {readingTimeText}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            justifyContent: "flex-end",
            maxWidth: "60%",
          }}
        >
          {tags.slice(0, 3).map((tag: string) => (
            <div
              style={{
                display: "flex",
                padding: "0.5rem 1rem",
                backgroundColor: cfg.theme.colors[colorScheme].highlight,
                color: cfg.theme.colors[colorScheme].secondary,
                borderRadius: "10px",
                fontSize: 24,
              }}
            >
              #{tag}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
