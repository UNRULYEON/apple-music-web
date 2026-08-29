# apple-music-web

Apple Music web client built with TanStack Start, React 19, TypeScript, and Tailwind CSS v4.

## 🛠️ Prerequisites

- [Bun](https://bun.sh) (latest)
- An Apple Developer account with a MusicKit key, for the Apple Music sign-in
- [act](https://nektosact.com) and a running Docker daemon, only for `ci:local`

## 🥑 Usage

### Install dependencies

Install dependencies using bun:

```bash
bun install
```

### Apple Music developer token

MusicKit needs a developer token before the app can sign a user in.

First, get the credentials from the Apple Developer portal:

1. Open **Certificates, Identifiers & Profiles → Keys** and add a key with **MusicKit** enabled.
2. Download `AuthKey_<key id>.p8`. Apple lets you download it one time only. Keep it out of the
   repository.
3. Find your **Team ID** on the Membership page.

Then sign the token. The script asks for what it needs, and uses Web Crypto, so it needs no
extra package:

```bash
bun run generate-music-kit-token
```

It looks for `AuthKey_*.p8` in the current folder and in `~/Downloads`, reads the Key ID from
the file name, and asks for your Team ID. At the end it asks what to do with the token:

| Choice                | What happens                                                  |
| --------------------- | ------------------------------------------------------------- |
| Write it to .dev.vars | Sets `MUSICKIT_DEVELOPER_TOKEN` and keeps the other variables |
| Send it to Cloudflare | Pipes it to `wrangler secret put`, after you confirm          |
| Print it              | Writes it to stdout                                           |

Give both `--key` and `--team-id` and the script asks nothing and only prints the token, which
keeps it usable in a pipe:

```bash
bun run generate-music-kit-token --key ~/keys/AuthKey_ABC1234DEF.p8 --team-id TEAM123456
```

The token is an `ES256` JWT: the header holds `kid` (your Key ID), and the claims hold `iss`
(your Team ID), `iat`, and `exp`. Apple limits `exp` to `iat + 15777000` (~6 months).

The token expires after about 6 months. When every Apple Music request starts to fail with 401,
make a new token and put it back. The token is not a secret: MusicKit sends it to Apple from the
browser.

### Running the development server

Next, run the development server:

```bash
bun dev
```

All routes need a signed-in Apple Music user. Without one, the router sends you to `/login`.
Guarded pages live under `src/routes/_authed/`.

### Deploying to Cloudflare

Build the app and deploy it with Wrangler:

```bash
bun run deploy
```

### Running the CI workflow locally

Run a GitHub workflow on your machine with [act](https://nektosact.com). It checks out the
current branch into `.local/act`, so the run sees the same code GitHub would.

```bash
bun run ci:local
```

With no arguments it asks what to run. Pass arguments to skip the questions:

```bash
bun run ci:local run -w ci                # current branch, latest commit
bun run ci:local run -w ci -d             # working tree, uncommitted files included
bun run ci:local run -w ci -r origin/main # a remote branch, fetched first
bun run ci:local clean                    # remove .local/act
```

| Flag             | Meaning                                                  |
| ---------------- | -------------------------------------------------------- |
| `-w, --workflow` | Workflow file, with or without the extension             |
| `-e, --event`    | Event to trigger, read from the workflow when left out   |
| `-r, --ref`      | Branch, tag or commit, default the current branch        |
| `-d, --dirty`    | Check the working tree instead of a commit               |
| `-a, --arch`     | `linux/amd64` (default, matches GitHub) or `linux/arm64` |
| `-n, --dry-run`  | Plan the jobs without running them                       |

Each run writes its full output to `.local/act/logs`. Use `--help` for the complete list.
