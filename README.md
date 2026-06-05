<div align="center">

# SnapFetch

**Paste a link. We detect the source. You download.**

A clean, single-input web app to download media from **TikTok, Twitter/X, Instagram, and YouTube** — with automatic platform detection, instant preview, and HD / standard download.

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%E2%89%A520.12-43853d.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg)
![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

</div>

---

## ✨ Features

- **One input, zero friction** — paste any supported link; the source is detected from the URL, no menus.
- **Multi-platform** — TikTok, Twitter/X, Instagram, YouTube (extensible to more via a simple adapter).
- **Instant preview** — thumbnail, title, author, and duration before you commit.
- **HD or standard** — pick the quality; YouTube HD is capped at 1080p H.264 + AAC for a real, universally playable MP4.
- **Live download feedback** — a two-phase indicator: _Preparing…_ while the server fetches & muxes, then a real progress bar.
- **Internationalized** — English by default, French included; one switcher, persisted preference.
- **Privacy-friendly** — nothing is stored: media is streamed to you and the temporary file is deleted.

## 🧱 Tech stack

| Layer    | Stack                                                          |
| -------- | ------------------------------------------------------------- |
| Frontend | React + TypeScript, Vite                                      |
| Backend  | Node.js + Express + TypeScript (object-oriented), Zod         |
| Media    | [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) + `ffmpeg`       |

## 📦 Requirements

- **Node.js ≥ 20.12** (uses the native `.env` loader)
- **[`yt-dlp`](https://github.com/yt-dlp/yt-dlp)** available on your `PATH`
- **[`ffmpeg`](https://ffmpeg.org/)** — required to merge separate video/audio tracks (e.g. YouTube HD)

```bash
# Quick check
node -v && yt-dlp --version && ffmpeg -version | head -n1
```

## 🚀 Getting started

```bash
# 1. Install dependencies (root tooling, then client + server)
npm install
npm run install:all

# 2. Configure the backend
cp server/.env.example server/.env

# 3. Run everything (server on :3001, client on :5173)
npm run dev
```

Open **http://localhost:5173**. In development, the client proxies lightweight API
calls to the backend; downloads talk to the backend directly (configurable, see below).

### Production build

```bash
npm run build              # builds server (dist/) and client (dist/)
npm --prefix server start  # serve the API
```

Serve the client's `dist/` with any static host and put both behind a reverse
proxy (e.g. Caddy/Nginx) on a single origin.

## ⚙️ Configuration

### Server — `server/.env`

| Variable                     | Default                  | Description                                          |
| ---------------------------- | ------------------------ | ---------------------------------------------------- |
| `PORT`                       | `3001`                   | HTTP port                                            |
| `CLIENT_ORIGIN`              | `http://localhost:5173`  | Allowed CORS origin                                  |
| `YTDLP_PATH`                 | `yt-dlp`                 | Path to the `yt-dlp` binary                          |
| `RESOLVE_TIMEOUT_MS`         | `20000`                  | Max time to fetch metadata                           |
| `DOWNLOAD_TIMEOUT_MS`        | `600000`                 | Max time for a full download                         |
| `RATE_LIMIT_WINDOW_MS`       | `60000`                  | Rate-limit window per IP                             |
| `RATE_LIMIT_MAX`             | `30`                     | Max requests per window per IP                       |
| `YTDLP_COOKIES_FROM_BROWSER` | _(empty)_                | Read cookies from a browser (`firefox`, `chrome`, …) |
| `YTDLP_COOKIES_FILE`         | _(empty)_                | Path to a Netscape `cookies.txt` (takes precedence)  |

### Client — `client/.env.development`

| Variable           | Description                                                                 |
| ------------------ | -------------------------------------------------------------------------- |
| `VITE_API_ORIGIN`  | Backend origin used for downloads (bypasses the dev proxy for large files) |
| `VITE_GITHUB_REPO` | `owner/repo` for the "star" button + live star counter (optional)          |

## 🔐 Authenticated platforms (Instagram, private X posts)

Some platforms require a logged-in session. Provide cookies from a **dedicated
account** via `YTDLP_COOKIES_FILE`:

1. Create a dedicated account and log in (ideally in a separate browser profile).
2. Export cookies in **Netscape format** (e.g. the "Get cookies.txt LOCALLY" extension) from `instagram.com`.
3. Save the file to `server/secrets/` and point `YTDLP_COOKIES_FILE` at it.

See [`server/secrets/README.md`](./server/secrets/README.md) for the full guide.
Cookie files are git-ignored and must never be committed.

## 🔌 API

| Method     | Endpoint        | Params                              | Response                       |
| ---------- | --------------- | ----------------------------------- | ------------------------------ |
| `POST`     | `/api/resolve`  | `{ url }`                           | `MediaInfo` (JSON)             |
| `GET`/`POST` | `/api/download` | `url`, `formatId`, `filename`     | Binary file stream (attachment) |
| `GET`      | `/api/health`   | —                                   | `{ status: "ok" }`             |

`GET /api/download` is used by the browser for native, progress-tracked downloads.
Errors are returned as JSON: `{ code, message }`.

## 🗂️ Project structure

```
snap-fetch/
├── client/                  # React + TypeScript (Vite)
│   └── src/
│       ├── components/      # UrlForm, MediaPreview, GitHubStarButton, …
│       ├── i18n/            # translations + provider
│       └── lib/             # API client, platform hint, formatting
└── server/                  # Node + Express + TypeScript (OOP)
    └── src/
        ├── adapters/        # one class per platform (MediaAdapter base + registry)
        ├── controllers/     # request validation → service → response
        ├── services/        # ResolveService, DownloadService
        ├── lib/             # detectPlatform, YtDlp wrapper
        ├── schemas/         # Zod input validation
        └── app.ts           # composition root (dependency injection)
```

Adding a platform = one adapter class + one line in the registry; nothing else changes.

## 🛡️ Security & design notes

- All external input (URL, format id) is **validated with Zod** before use.
- `yt-dlp` runs **server-side only**, with arguments passed as an **array** (never a shell string) — no argument injection.
- **Per-IP rate limiting** on the API.
- **No durable storage**: downloads are streamed to the client and temporary files are cleaned up.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork and create a feature branch.
2. Keep TypeScript strict — no implicit `any`.
3. Run `npm run lint` (typecheck) and `npm run build` before opening a PR.

## ⚠️ Disclaimer

SnapFetch is intended for downloading content you own the rights to, or that you
are otherwise authorized to download. You are responsible for complying with the
terms of service of each platform and with applicable copyright law.

## 📄 License

Released under the **MIT License**. See [`LICENSE`](./LICENSE).
