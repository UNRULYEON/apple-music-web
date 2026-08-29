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

The whole app sits behind an Apple Music sign in. Until a user signs in, `MusicKitGate` covers
it with a dialog.

### Apple Authentication devtools

The devtools panel in the corner has an **Apple Authentication** tab. It is added only when
`import.meta.env.DEV` is true, so it never reaches a build.

Apple gives MusicKit two different tokens. The **developer token** identifies the app, and the
section above makes it. The **Music User Token** identifies the person, and Apple only gives it
after the sign-in window accepts an Apple Account and an Apple Music subscription. This tab
keeps a copy of that second token, so you do not have to open that window again.

Sign in one time. The panel sees the new token and writes it to `localStorage`. After that the
two badges show the authorization status and whether a copy is there.

| Button                                   | What happens                                                         |
| ---------------------------------------- | -------------------------------------------------------------------- |
| `Sign in`                                | Gives the kept Music User Token back to MusicKit. Apple is not asked |
| `Sign out`                               | Takes the Music User Token out of MusicKit. The copy stays           |
| `Sign out and remove from local storage` | Also removes the copy, so the next sign in opens the Apple window    |

#### How it works

`MusicKitGate` and the panel read one store, `useAuthStatus` in `src/lib/music-kit/auth.ts`. The
status is `checking`, `signed-out` or `signed-in`. Each button moves that store, and the gate
reacts immediately. Nothing here reloads the page.

`music.musicUserToken` is a setter, and one assignment does three things: it changes the token in
memory, it writes or removes the storage key, and it sets the authorization status. An empty
string is therefore a full sign out for this browser.

| Key                                | Who writes it | What is in it                       |
| ---------------------------------- | ------------- | ----------------------------------- |
| `music.<team id>.media-user-token` | MusicKit      | The live Music User Token           |
| `music-kit-devtools.saved-token`   | This panel    | The copy, with the date it was made |

MusicKit builds its own key from your Apple Team ID, in lower case. It also keeps
`music.<team id>.itua` for the storefront country.

#### Limits

`Sign out` does not call `unauthorize()`. That call sends a logout request to Apple, which ends
the session there and makes the copy useless. The panel only changes this browser.

The copy holds the Music User Token as clear text, the same as MusicKit does. Keep it to a
development machine.

A Music User Token does not live forever, and it stops working when the developer token that
made it expires. If Apple starts to answer 401, use `Sign out and remove from local storage` and
sign in again.

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
