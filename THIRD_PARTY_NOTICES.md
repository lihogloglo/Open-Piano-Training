# Third-party notices

The project MIT license covers project code and original content. It does not replace these third-party terms.

| Material                 | Terms and source                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| JavaScript dependencies  | MIT, Apache-2.0, or ISC, as recorded in `package-lock.json`                                                                                                                                      |
| Geist and Geist Mono     | SIL Open Font License 1.1, supplied by the installed Fontsource packages                                                                                                                         |
| VexFlow notation fonts   | Academico, Bravura, Petaluma, and Petaluma Script use OFL-1.1. Gonville permits unrestricted use of output font files. See `third-party/`.                                                       |
| Splendid Grand Piano     | AKAI samples declared public domain by [sfzinstruments](https://github.com/sfzinstruments/SplendidGrandPiano) and [smpldsnds](https://github.com/smpldsnds/sfzinstruments-splendid-grand-piano). |
| Electron                 | MIT, with additional Chromium and component licenses in the desktop distribution                                                                                                                 |
| ASD-STE100 writing skill | MIT, copyright Dustin Yuchen Teng. See [.claude/skills/asd-ste100/LICENSE](.claude/skills/asd-ste100/LICENSE).                                                                                   |

Piano sample preparation and SFZ mapping are credited to kinwie. The smpldsnds project converts samples for web playback.
Keysense downloads its Ogg files without further changes. This attribution follows the distributors' declarations, not an independently recovered AKAI license document.
The sample mirror contains an inconsistent introductory link to a Rhodes instrument. Its piano description and the original piano repository agree on public-domain status.
The app does not include other sample collections offered by smplr.

VexFlow embeds font data inside JavaScript. Its MIT code license does not cover those fonts.
We retain the font licenses in `third-party/`. [sources.json](third-party/sources.json) records their exact upstream revisions.
We do not modify these fonts.

Run `npm run licenses` after installing dependencies. Each production build also runs this command.
It creates `public/THIRD-PARTY-NOTICES.html` from installed licenses, copyright notices, and Apache NOTICE files.
The app links to this page from **Settings → Licenses & credits**. Browser and desktop builds include the page.
Keep Electron's `LICENSES.chromium.html` beside the desktop executable when redistributing its runtime.

Two installed packages, `smplr@1.0.0` and `jazz-midi@1.7.9`, declare MIT but omit standalone license files.
The generated notices preserve their package attribution and provide standard MIT terms. No copyright date is invented.
The two Tonal packages that omit license files use the shared Tonal license.
Review these exceptions and all dependency changes before later releases.

Development tools have additional licenses, including MPL-2.0 for axe-core and Lightning CSS.
Using these tools does not relicense the app. Distributing their source or binaries requires preserving their own terms.
