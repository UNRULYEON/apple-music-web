# apple-music-web

Apple Music web client built with TanStack Start, React 19, TypeScript, and Tailwind CSS v4.

## 🛠️ Prerequisites

- [Bun](https://bun.sh) (latest)
- [act](https://nektosact.com) and a running Docker daemon, only for `ci:local`

## 🥑 Usage

### Install dependencies

Install dependencies using bun:

```bash
bun install
```

### Running the development server

Next, run the development server:

```bash
bun dev
```

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
