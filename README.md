# Lumin Hub

Lumin Hub is Lumin Digital's control surface for the coding agents on your machine. It runs as a local server with a web app, an Electron desktop app, and a mobile app.

It works with your existing subscriptions on Claude Code, Codex, Cursor, Grok Build, OpenCode, and Google Antigravity. If they're set up on your computer, Lumin Hub can control them.

Lumin Hub is a fork of [T3 Code](https://github.com/pingdotgg/t3code) by T3 Tools, Inc., used under the [MIT License](./LICENSE).

## Prerequisites

> [!WARNING]
> Lumin Hub supports Codex, Claude, Cursor, Grok Build, OpenCode, and Antigravity. Install and authenticate at least one provider before use:
>
> - Codex: install [Codex CLI](https://developers.openai.com/codex/cli) and run `codex login`
> - Claude: install [Claude Code](https://claude.com/product/claude-code) and run `claude auth login`
> - Cursor: install [Cursor CLI](https://cursor.com/cli) and run `agent login`
> - Grok Build: install [Grok Build CLI](https://x.ai/cli) and run `grok login`
> - OpenCode: install [OpenCode](https://opencode.ai) and run `opencode auth login`
> - Antigravity: enable it in Settings, then use **Install Antigravity** and **Sign in with Google**. No CLI is required.

## Running from source

There are no packaged Lumin Hub releases yet, so run it from this repository.

### Install `vp`

Lumin Hub uses Vite+, so you'll need the global `vp` command-line tool.

#### macOS / Linux

```bash
curl -fsSL https://vite.plus | bash
```

#### Windows

```bash
irm https://vite.plus/ps1 | iex
```

See the [Vite+ getting started guide](https://viteplus.dev/guide/) for more information.

### Install dependencies and start

The checkout requires Node 24.

```bash
vp i
vp run dev
```

Open the pairing URL printed by the dev runner. Use `vp run dev:desktop` for the Electron desktop app. The [development runbook](./docs/operations/development.md) covers the rest.

## Documentation

Full docs live in [docs/](./docs).

- [Install and first run](./docs/user/install.md)
- [Permission modes](./docs/user/permission-modes.md)
- [Keyboard shortcuts](./docs/user/keybindings.md)
- [Project settings](./docs/user/project-settings.md)
- [Appearance preferences](./docs/user/appearance.md)
- [Remote access from a phone or another machine](./docs/user/remote-access.md)
- [Keeping app and server in sync](./docs/user/updating.md)
- [Source control integrations](./docs/user/source-control.md)
- Multiple accounts: [Codex](./docs/user/providers-codex.md) · [Claude](./docs/user/providers-claude.md)
- [Run Lumin Hub as a background service](./docs/user/background-service.md)

Building from source? Start at [docs/internals/overview.md](./docs/internals/overview.md).

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before reporting a bug or opening a PR. Report bugs and ideas in [GitHub issues](https://github.com/spencerrego-lumin/lumin-hub/issues).
