# Commit package-lock.json (required for deterministic CI)

The GitHub Actions `lint-build` job prefers `npm ci`. Without a lockfile it falls back to `npm install` and emits a warning.

## Generate and commit (on your machine)

```bash
cd school-management-system
git pull origin main
npm install --package-lock-only --registry=https://registry.npmjs.org/
git add package-lock.json
git commit -m "chore: add package-lock.json for deterministic npm ci"
git push origin main
```

After this lands, CI will use `npm ci` only and dependency versions stay fixed across runs.

Do **not** commit an empty or placeholder lockfile.
