# Privacy Release Review

Use this checklist before publishing, after large documentation updates, and after any incident where private content may have reached a public branch.

## What Must Not Be Published

- Real credentials, tokens, API keys, passwords, cookies, session IDs, or private certificates.
- Local absolute paths that identify a maintainer or workstation.
- Private emails, phone numbers, personal addresses, customer names, customer domains, or internal-only organization details.
- Private repository URLs, internal infrastructure URLs, private IPs, VPN hostnames, or deployment credentials.
- Runtime state files, logs, generated local data, screenshots with private data, or downloaded customer files.
- Internal notes that mention confidential strategy, customer issues, or non-public commercial details.

## Public Examples That Are Allowed

These are acceptable when clearly used as examples or test fixtures:

- `localhost`, `127.0.0.1`, and `0.0.0.0` in local development docs or tests.
- `example.com`, `example.invalid`, or obvious fake emails.
- Fake test keys such as `demo-secret-key`, when tests assert that they are redacted.
- Security terms such as `private network`, `private vulnerability reporting`, or `link-local`.
- Mock user names, mock IDs, and static preview data that contain no real person or customer.

## Tracked File Scan

Run scans against tracked files only:

```bash
git grep -n -I -E '/Users/|/private/|/var/folders|agent桌面|Desktop|aidideMac|aidi@'
git grep -n -I -E 'AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]+|xox[baprs]-[A-Za-z0-9-]+'
git grep -n -I -E '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
git grep -n -I -E 'password|secret|token|api[_-]?key|credentials' -- '*.md' '*.mjs' '*.js' '*.json'
```

Review every hit. Do not assume a match is safe just because it is in a test.

## Local State Check

Confirm ignored local files are not tracked:

```bash
git status --short --ignored
git ls-files data .env .DS_Store node_modules
```

Expected:

- `data/`, `.env*`, `.DS_Store`, and `node_modules/` should not appear in `git ls-files`.
- `git status --short` should be clean before publishing.

## Cleaning Rules

- Replace local absolute paths with generic text such as `local project directory`.
- Replace private repo paths with `path/to/repo` or current working directory behavior.
- Replace real emails with GitHub noreply addresses or `example.com` fixtures.
- Remove real logs and runtime state instead of masking them.
- Keep test fixture secrets fake and obvious; never reuse real values in tests.

## If Private Content Was Already Pushed

If private content appears in public Git history, do not only add a cleanup commit. The old content remains reachable in branch history.

Preferred response for a newly published repository:

1. Clean the working tree.
2. Run the privacy scans above.
3. Run `npm run check`.
4. Create a privacy-reviewed single-commit history from the cleaned tree.
5. Force-push with lease to replace the public branch.
6. Confirm the public branch points to the privacy-reviewed commit.
7. Record the action in the maintenance notes or changelog if it affects maintainers.

Command outline:

```bash
git checkout --orphan privacy-reviewed-main
git commit -m "chore: publish privacy-reviewed GPLv3 release"
git branch -M main
git push --force-with-lease origin main
```

Only use this for early release history or when maintainers agree that rewriting public history is acceptable. For established repositories with outside contributors, coordinate first and document the recovery plan.

## Verification Record

After review, record:

- Scan commands run.
- Any findings and whether they were true positives or acceptable examples.
- Verification command and result.
- Commit hash pushed to `main`.
- Whether history was rewritten.
