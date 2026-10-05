# Public release review

Reviewed on 2026-10-05, starting from commit `a00e853`.

## Scope and findings

- Reviewed 256 tracked files, 38 locally available commits, branches, and tags.
- Scanned historical text objects for credentials, personal paths, and personal email addresses.
- Gitleaks 8.30.1 found no credential leaks in the available history or tracked working files.
- Commit and tag metadata contained a personal email address. Commit messages contained 26 Claude session links.
- Reviewed license metadata for all 792 locked packages, including 51 entries not marked as development dependencies.
- Checked runtime license files, downloaded piano sample provenance, embedded fonts, artwork generation, and the copied writing skill.
- The curriculum contains project-specific studies and charts. No imported commercial scores or recordings were identified.

These checks cannot prove authorship or guarantee the absence of all private information.
They cover local repository content. They do not cover GitHub issues, pull requests, workflow logs, releases, or server-side cached history.

## Changes

- Added the project MIT license and package metadata.
- Shortened the README and stated that the project needs more testing and care.
- Restored the copied writing skill's upstream MIT notice.
- Added upstream licenses for the notation fonts embedded in VexFlow.
- Added automatic license and NOTICE generation for browser and desktop builds.
- Corrected the piano samples' unsupported CC-BY label to reflect the upstream public-domain declaration.
- Documented external sample requests in the README privacy section.
- Added ignore rules for common credential files and personal backups.
- Marked historical song research as unverified release guidance.
- Updated four vulnerable transitive toolchain dependencies within their existing version ranges. The resulting npm audit reports zero vulnerabilities.

See [third-party notices](../THIRD_PARTY_NOTICES.md) for source links and license exceptions.
The sample declaration relies on upstream distributors. The original AKAI permission document was not recovered.
The smplr and jazz-midi packages declare MIT but omit standalone license files. Their attribution and standard MIT terms are preserved.
No conflicting runtime license was identified, subject to these provenance limits.

## Sanitized history

A separate local repository replaces the personal email in author, committer, and tagger metadata with the maintainer's GitHub noreply address.
It also removes Claude session links from commit messages. The original working repository retains its original history.
The sanitized repository includes the release preparation changes on `main`.
The source archive and Git bundle are written under the ignored `release/` directory.
The archive contains the prepared source. The bundle contains the sanitized branches and tags, including the prepared `main` commit.

Rewriting history changes commit and annotated tag identifiers. Old tags still describe old source versions, without the new release fixes.
Use the prepared `main` source for the next release. Rebuild packages from that source.
Previously built installers and archives do not gain the new notices automatically.

No remote history, release, or repository visibility was changed during this review.
Publishing over an existing repository requires a separate remote cleanup and a review of GitHub-hosted metadata and artifacts.
Do not mirror-push all branches and tags blindly. Existing release branches and version tags trigger publication workflows.

## Verification

Lint, TypeScript, translation coverage, contrast, formatting, the production build, and the bundle budget passed.
All 289 unit tests and both Electron origin/path security tests passed.
Both license-page browser tests passed against the production preview in English and French.
The generated notice page is included in the offline cache.
A Windows directory package contains the project license, all 78 notice sections, and Chromium notices.
This packaging check used the installed Electron runtime and skipped executable signing and resource editing.
Full curriculum browser tests, physical MIDI tests, Linux packaging, and installer testing remain outside this review.
