# Contributing

## Setup

```bash
npm install
npm run dev     # playground at http://localhost:5173 (playground/App.vue)
npm run lint    # ESLint
npm run check   # type check of src/, playground/ and test/
npm test        # Vitest + @vue/test-utils (happy-dom)
npm run test:coverage  # tests with V8 coverage report in coverage/
npm run build   # library build in dist/ (ES and UMD, with .d.ts)
```

The playground imports the components from `src/`, so changes reload instantly. It is not part of the published package.

happy-dom has no layout: every rect is empty, and `direction` is computed from CSS only, not from the `dir` attribute. Check positioning, scrolling and right-to-left behaviour in a browser through the playground.

## Pull requests

PR titles follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `feat!:` for a breaking change): release-please reads them to bump the version and write the changelog.

## Coverage badges

On every push to `main`, CI runs the tests with coverage and `scripts/coverage-badge.mjs` publishes the coverage badges (lines and branches) as SVG files on the `badges` branch, which the badges of the README read. No external service is involved.
