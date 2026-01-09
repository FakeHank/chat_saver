# Repository Guidelines

## Project Structure & Module Organization
- Current repository contains no tracked source files or directories yet.
- Expected future layout (adjust when code is added): `src/` for application code, `tests/` for automated tests, and `assets/` for static files.
- Keep configuration files (for example, `package.json`, `pyproject.toml`, or `Makefile`) at the repo root for easy discovery.

## Build, Test, and Development Commands
- No build or test commands are defined yet.
- When tooling is added, document commands here with examples, such as:
  - `npm run dev` for local development.
  - `npm test` or `pytest` for tests.
  - `make build` for production builds.

## Coding Style & Naming Conventions
- No style guide is established yet.
- When a language is chosen, prefer a formatter/linter (for example, `prettier`, `black`, `ruff`, or `golangci-lint`) and record the standard indentation, line length, and naming patterns here.
- Use clear, descriptive names for files and modules; favor kebab-case for filenames unless the language ecosystem dictates otherwise.

## Testing Guidelines
- No testing framework is configured yet.
- Once tests exist, document:
  - Framework (for example, `pytest`, `jest`, `go test`).
  - Naming conventions (for example, `test_*.py`, `*.spec.ts`).
  - How to run unit and integration tests.

## Commit & Pull Request Guidelines
- Git history is empty; no commit message convention is available yet.
- Suggested convention to adopt: short, imperative subject lines (for example, "Add API client"), with optional scope.
- Pull requests should include a brief summary, testing notes, and any relevant screenshots or logs.

## Security & Configuration Tips
- Store secrets in environment variables or local `.env` files and avoid committing them.
- Add a `.gitignore` as soon as tooling introduces generated files or local config.

## Active Technologies
- JavaScript (ES2020+) + None (vanilla browser APIs only) (001-chat-save-extension)
- N/A (download-only; no local database) (001-chat-save-extension)

## Recent Changes
- 001-chat-save-extension: Added JavaScript (ES2020+) + None (vanilla browser APIs only)
