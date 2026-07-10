# 11ty + Tailwind CSS site

Eleventy project with Tailwind CSS, YouTube embeds, and [youtube.external.subtitle](https://github.com/siloor/youtube.external.subtitle) for external subtitles loaded from Cloudinary.

## Setup

```bash
npm install
npm run css:build
npm run build
```

## Develop

```bash
npm run css:build
npm run dev
```

In another terminal, run `npm run css:watch` to rebuild CSS on change.

Or use:

```bash
npm run build:all   # css + eleventy once
npm run dev:all     # css build then watch + serve (background)
```

## Structure

- **Layout**: `_includes/layouts/base.njk` — Sticky header (logo, search, X link, Ko-fi), mobile toggle search, sidebar (nav + about), main content.
- **Home**: `src/index.njk` — Post list from `collections.posts`.
- **Tags**: `src/tag/tag.njk` — Post list per tag at `/tag/[slug]/` (Eleventy tags).
- **Artists**: `src/artist/artist.njk` — Post list per category at `/artist/[slug]/` (front matter `category`).
- **Posts**: `src/posts/*.md` — Use `layout: layouts/post.njk`, `videoID`, `tags`, `category`, `title`, `date`.

## Subtitles

Single post layout embeds YouTube with [youtube.external.subtitle](https://github.com/siloor/youtube.external.subtitle). On **first play**, it fetches subtitles from:

`{cloudinarySubtitleBase}/{videoID}.json`

Set `cloudinarySubtitleBase` in `_data/site.json` (e.g. `https://res.cloudinary.com/YOUR_CLOUD/raw/upload`).

JSON shape: `{ "subtitles": [ { "start", "end", "text" } ] }` (times in seconds). `startTime`/`endTime` are also supported.

## Design

Font and spacing follow a Tailwind-style setup: Inter for sans, IBM Plex Mono for mono (see `tailwind.config.js` and base layout).
