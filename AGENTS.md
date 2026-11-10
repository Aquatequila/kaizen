# Repository Guidelines

## Project Structure & Module Organization

This repository is currently a product-definition and planning project. `definition/main.md` is the source product brief; `definition/work-packages.md`, `definition/tech-stack.md`, and `definition/exercise-library.md` elaborate the delivery plan, technical decisions, and starter exercise catalogue. Keep related material in `definition/` and use descriptive, lowercase filenames. There is no app source, test suite, or bundled asset directory yet; create those when implementation begins and document their purpose here.

## Build, Test, and Development Commands

No build system, package manifest, or automated test runner is currently configured. For documentation changes, edit the relevant Markdown file and review the rendered result in your Markdown viewer. Check links and whitespace manually before submitting. Do not introduce a toolchain solely for a small text change.

## Coding Style & Naming Conventions

Write documentation in concise, direct Markdown. Use descriptive headings, short paragraphs, and lists for steps or enumerations. Use fenced code blocks for commands and examples. Keep filenames lowercase and use hyphens between words (for example, `design-notes.md`). There are no language formatters or linters configured.

## Testing Guidelines

There is no test suite or coverage requirement yet. For documentation-only changes, verify that headings are properly nested, links resolve, examples are accurate, and the Markdown reads clearly. If code and tests are added later, document the relevant test command and naming convention in this guide.

## Commit & Pull Request Guidelines

The repository history is small and does not establish a detailed commit convention. Use a short imperative subject that describes the change (for example, `Add product definition and delivery plan`). Pull requests should explain the purpose and scope, list notable files changed, link any related issue, and include screenshots only when a visual change needs them.

## Security & Configuration

Do not commit credentials, local configuration, or generated output. There are no environment variables or application secrets documented for this project.
