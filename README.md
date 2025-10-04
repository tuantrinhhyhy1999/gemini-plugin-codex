# Gemini Image Studio Photoshop Plugin

This repository contains a UXP-based Photoshop panel that integrates the Google Gemini 2.5 Flash API to generate AI-assisted imagery from within Adobe Photoshop.

## Features

- **Photoshop integration** – Export the full canvas or the active layer to feed Gemini, plus a quick-layer copy helper.
- **Reference management** – Drag & drop up to three reference images, persist them between sessions, and remove them with a click.
- **Prompt presets** – Five preset families (Portrait, Landscape, Product, Art, Architecture) and four quick presets with localized labels.
- **Google Gemini generation** – Send prompts and reference images to Gemini 2.5 Flash, request up to four results, and preview them in the panel.
- **Post-processing tools** – Copy, save, or place generated images back into Photoshop and inspect API usage quotas.
- **Internationalization** – Vietnamese, English, and Chinese translations with dynamic switching.
- **Responsive UI** – Spectrum-themed layout that adapts between 320×720 and 500×1600 pixels, honoring dark/light themes.

## Getting Started

1. Install dependencies for UXP development and ensure Photoshop 23.0.0 or newer is available.
2. Copy the `plugin` directory to your UXP Developer Tool workspace or link it directly.
3. In UXP Developer Tool, create a new plugin pointing to the `manifest.json` inside the `plugin` folder.
4. Launch the plugin within Photoshop. Provide your Gemini API key in the panel and optionally store it for future sessions.

## Gemini Configuration

- The plugin expects a valid Gemini 2.5 Flash API key. Enter it in the **Gemini API Key** field and press **Save**.
- Usage quotas are fetched from `https://generativelanguage.googleapis.com/v1beta/usage` and displayed at the top of the panel.
- Generated imagery is requested from `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`.

## Development Notes

- The UI uses Spectrum Web Components loaded from a CDN; additional styling lives in `plugin/styles/panel.css`.
- Core panel logic resides in `plugin/scripts/main.js`, using Photoshop’s UXP APIs (renditions, batchPlay, local storage) and browser APIs.
- The panel stores user preferences (API key, prompt text, locale, references) in `localStorage` under a dedicated namespace.

## Limitations

- The plugin assumes PNG renditions and may need adjustments for alternative formats.
- Usage endpoint responses can vary; any non-standard payload is rendered verbatim for troubleshooting.
- Network access must be enabled for `generativelanguage.googleapis.com` in the plugin permissions.

## License

MIT
