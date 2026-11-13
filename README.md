# DECAILLION — v11 Office Ascent

An editable, static browser game. Original v10 DECAILLION source, enhanced with the user's office pixel-art elevator floors and ascending 100-point milestones. The original chatgpt.site deployment remains unchanged.

## Edit online
- Repository: https://github.com/devioustiger-coder/decaillion
- VS Code web editor: https://github.dev/devioustiger-coder/decaillion (editing only; can't run a server)
- GitHub Codespaces: https://github.com/codespaces/new?hide_repo_select=true&ref=main&repo=1457131920 (runs an editable development environment, subject to account access/usage)

## Run locally or in Codespaces
Requires Node.js 22 or newer.

```bash
npm run prepare:vendor
npm test
npm start
```

Open http://localhost:8080. Codespaces can forward port 8080. No API key is required for the optional browser-local AI judging, but downloading a browser model can be large and some devices lack GPU support.

## Game progression
- 0–99: Lobby
- 100–199: Cubicle Farm
- 200–299: Marketing Studio
- 300–399: Break Room
- 400–499: Boardroom
- 500–599: Executive Suite
- 600+: Rooftop — highest score zone

The elevator visually rises; floor backgrounds change every 100 points. The project contains 102 hospitality prompts and 50 accepted answers each, original game mechanics, sounds and browser AI modules.

## Project layout
- `dist/`: deployable static site (after `npm run prepare:vendor`)
- `dist/hospitality.js`: full hospitality answer bank
- `dist/ocean.js` and `dist/office-backgrounds.js`: elevator and pixel-art scenes
- `dist/audio.js`: audio engine
- `dist/vendor/transformers-3.8.1.min.js`: included CPU AI dependency
- `dist/vendor/webllm-parts/*.b64`: four compressed, losslessly restorable chunks of the original 6MB WebLLM dependency
- `scripts/restore-vendor.cjs`: reconstitutes `dist/vendor/webllm-0.2.80.js`, verifying SHA-256
- `tests/`: Node tests
- `assets/original-office-backgrounds.html`: original user-supplied art definitions
- `.github/workflows/pages.yml`: GitHub Pages deployment action

## Deploy GitHub Pages
The Pages workflow runs on changes to `main`, restores the vendor dependency, tests the code, and uploads `dist/`. On GitHub, enable **Settings → Pages → Build and deployment → GitHub Actions** (provided Pages is available for your private repository/plan). Monitor the **Actions** tab for deployment status. The Pages URL is **not confirmed** until a deployment succeeds.

## Notes
Do not commit `.env`, API credentials, or `node_modules`. The original ChatGPT-hosted website is not changed by these repository commits. For AI coding tools, grant access to this private repository or share a clone/ZIP with the tool; a private URL does not grant other services permission automatically.
