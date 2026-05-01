# Website Inspector Extension

Chrome extension that audits a page for common technical, SEO, accessibility, and markup-quality issues.

## Why this project matters

This project is a bridge between frontend development and QA thinking. It shows how browser tooling can surface practical page-quality checks directly inside a website, which is useful for handoff, support, and pre-release review.

## Features

- Manifest V3 Chrome extension
- Toggle audit mode from the extension popup
- In-page audit panel with issues and warnings
- Configurable rules stored in `data/requirements.json`
- Checks for SEO basics, image alt text, unsafe new-tab links, heading structure, forms, and forbidden markup patterns

## Tech stack

- JavaScript
- Chrome Extensions API
- Manifest V3
- DOM APIs
- HTML/CSS

## Run locally

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this repository folder.
5. Open a website and enable Website Inspector from the extension popup.

## Next improvements

- Add rule groups and severity filters
- Add accessibility checks for contrast and focus states
- Export audit results as JSON
- Add screenshots and a short demo video
- Add unit tests for rule evaluation
