# Song sourcing — where real repertoire can come from

_Researched 2026-09-02. Companion to [content-audit.md](content-audit.md) §5F, which found the
app's twelve "songs" are invented chord skeletons with no melody and no recognition value._

**Nothing here is legal advice.** Where a license could not be verified on a primary source, it is
marked ⚠ and treated as unlicensed.

---

## 1. The headline

**On 1 January 2026 the US public-domain cutoff moved to works published in 1930 or earlier.** That
just made this problem dramatically easier than it was even a year ago. Newly free, this year:

- **I Got Rhythm** (Gershwin, 1930) — rhythm changes. The second-most-important form in jazz after
  the blues, and the parent of hundreds of contrafacts.
- **Body and Soul** (1930) — the ballad; the canonical hard-changes test piece.
- **On the Sunny Side of the Street**, **Georgia on My Mind**, **Embraceable You**, **But Not for
  Me**, **Mood Indigo**, **Love for Sale**, **Memories of You** (all 1930).

Two clocks matter and only one applies to us: **compositions** are 95 years (→ 1930), **sound
recordings** are 100 years (→ 1925, per the Music Modernization Act). Since the app generates its
own audio, only the composition clock is relevant. But note the corollary: the famous _recording_ of
a PD tune is not PD, and neither is any specific published arrangement or engraving of it.

**Non-US caveat.** The EU/UK use life-of-author + 70, not a fixed date. Since we need chords and not
lyrics, the Gershwin and Fats Waller catalogs are clean worldwide (music only). Carmichael
("Georgia," "Stardust," d. 1981) and Johnny Green ("Body and Soul," d. 1989) are **US-only** until
2052 and 2060. Recommendation: tag each song `pd: {us, eu}` rather than geoblock.

---

## 2. The bad news, stated plainly

**Funk and singer-songwriter repertoire cannot be sourced from the public domain at all, ever, in
our lifetimes.** Sly, James Brown, Stevie, Carole King, Joni, Nick Drake — all 1965 or later, all
protected for decades. Two of the four stated musical priorities are unreachable by any free route.

They are reachable by **user import**, which is why that feature matters more than it looks.

---

## 3. Is a bare chord chart copyrightable?

The doctrine favours us; the industry's behaviour does not.

**In our favour:** courts repeatedly treat chord progressions as unprotectable building blocks
(_Intersong-USA v. CBS_; _Jarvis v. A&M Records_ — "easily arrived at phrases and chord progressions
are usually non-copyrightable"). Song titles are categorically not copyrightable subject matter.
Key, tempo and form are facts.

**Against:** the **selection-and-arrangement** doctrine — a collection of individually unprotectable
elements can be protected when the specific selection is original. Post-_Skidmore v. Led Zeppelin_
(9th Cir. en banc, 2020) this is the live theory in music litigation, and a full 32-bar chart with
its exact bar-by-bar placement and substitutions is a far stronger candidate than "ii–V–I."

**What the industry actually does — the decisive evidence:**

- **Ultimate Guitar licenses.** It signed with the **Harry Fox Agency** in April 2010 (lyrics
  display, title search, tab display with download and print; opt-in for HFA's 44,000+ publishers)
  and holds direct deals with Sony, EMI, Peermusic, Alfred, Hal Leonard, Faber and Music Sales. Its
  early survival was owed to Russian hosting during the 2004–06 DMCA campaign that killed MXtabs and
  Taborama — not to a legal theory. It then converted to paying.
- **iReal Pro distributes no charts at all.** It sells software; the chart library is user-generated
  and traded on their forums via a documented URL protocol. That is a deliberate §512 posture.
- **Hooktheory** takes rights _from its users_ by ToS, then prohibits third-party scraping, bulk
  download, redistribution and TDM — explicitly including for model training.

**Read:** we would probably win a suit over bar-level chord symbols. The relevant risk for a hobby
project isn't a judgment, it's a takedown and an app-store removal. The party with the most at stake
and the best lawyers pays publishers anyway.

**Melody is the bright line.** A transcribed melody of a copyrighted song reproduces the most
protected element of the composition, and "it's educational" fails fair-use factor four because
licensed lead sheets are a real market. → **Make melody a per-song capability flag in the schema
from day one.** That keeps the chord tier defensible independently.

---

## 4. Research corpora — do not ship any of them

| Corpus                     | License                             | Bar positions?          | Ship it?                                                                                |
| -------------------------- | ----------------------------------- | ----------------------- | --------------------------------------------------------------------------------------- |
| McGill Billboard           | **CC0**                             | yes                     | Annotations yes; the 1958–91 songs are all in copyright                                 |
| Isophonics                 | ⚠ **none stated**                   | yes                     | No — unverifiable, and the most-litigated repertoire alive                              |
| Weimar Jazz DB             | **ODbL 1.0**                        | yes                     | Transcribed solos over protected standards; ODbL doesn't fix that                       |
| iRb corpus (Zenodo)        | **CC BY 4.0**                       | yes                     | ⚠ 1,186 charts scraped from an iReal Pro forum by a depositor who never held the rights |
| **ChoCo**                  | CC BY 4.0 (some NC-SA)              | **yes**, `measure:beat` | Best-engineered, exactly our format — but aggregates Real Book / iReal Pro / Wikifonia  |
| Chordonomicon              | CC BY-**NC**                        | **no**                  | No on both counts                                                                       |
| Impro-Visor leadsheets     | ⚠ unlicensed                        | yes                     | The project deliberately excludes them from its OSS distribution — that's a tell        |
| mikeoliphant/JazzStandards | ⚠ no license                        | yes                     | No — but **the best schema design found**; read it as a format reference                |
| Mutopia                    | PD / CC BY / CC BY-SA, per piece    | notation                | **Yes** — genuinely clean, classical/PD                                                 |
| The Session                | ODbL + custom ⚠ **forbids LLM use** | no chords               | Melody-only Irish trad                                                                  |
| MuseScore.com              | per-score, uploader-selected        | varies                  | ⚠ their publisher blanket license **does not travel with the file**                     |

**The one sentence that disposes of this whole section: a CC-BY license on a chord corpus grants you
the compiler's rights, not the composers'.** Every corpus containing the repertoire we want traces
back to the same scraped user sources; the permissive stamp covers the annotation layer only.

These are excellent for engine development, parser testing and difficulty tuning. Keep them behind a
gitignored dev directory so shipping them is structurally impossible.

## 5. CC-licensed real songs — thin, and mostly non-commercial

Jonathan Coulton's whole catalog is **CC BY-NC 3.0** (verified on his FAQ) — the best pick, with real
recognition in a developer-adjacent audience. Nine Inch Nails' _Ghosts I–IV_ and _The Slip_ are CC
BY-NC-SA but harmonically sparse and poor teaching material. FMA's ~8,880 CC-BY tracks and ccMixter
are commercially usable but carry zero recognition, which defeats the point.

**Assessment: a bonus tier, not a strategy.** NC knocks out everything recognisable the moment
monetisation is considered.

---

## 6. The public-domain candidate list

Years verified against year-indexed jazz-standard references except where marked ⚠.

**The best teaching tunes, ranked by what they unlock:**

| Title                               | Year         | Teaches                                                                         |
| ----------------------------------- | ------------ | ------------------------------------------------------------------------------- |
| **I Got Rhythm**                    | 1930         | Rhythm changes; AABA; I–vi–ii–V turnarounds; a pure circle-of-fifths bridge     |
| **Sweet Georgia Brown**             | 1925         | **Pure circle of fifths** — III7–VI7–II7–V7–I across the whole first half       |
| **Honeysuckle Rose**                | 1929         | Two bars of ii–V repeated — the most efficient ii–V drill that exists           |
| **Avalon**                          | 1920         | Almost entirely circle-of-fifths; second-best circle drill                      |
| **On the Sunny Side of the Street** | 1930         | Clean AABA + secondary dominants; the ideal _first_ standard after the blues    |
| **But Not for Me**                  | 1930         | Textbook ii–V–I in E♭ with a relative-minor detour                              |
| **Blue Skies**                      | 1927         | Minor→parallel-major AABA; the definitive "same tune, two modes" lesson         |
| **Softly, As in a Morning Sunrise** | 1928         | Minor modal vamp + minor ii–V; the best PD minor tune                           |
| **What Is This Thing Called Love?** | 1929         | Minor ii–V (ø7–V7alt–i); gateway to minor-key jazz                              |
| **Mack the Knife**                  | 1928 ⚠EU     | Endlessly repeating I–vi–ii–V — the most efficient turnaround drill             |
| **Ain't Misbehavin'**               | 1929         | Stride comping, chromatic descending bass                                       |
| **Body and Soul**                   | 1930 US-only | The ballad; bridge modulates D♭→D and back                                      |
| **Oh, Lady Be Good!**               | 1924         | The most-played jam tune in jazz after the blues                                |
| **Bye Bye Blackbird**               | 1926         | I–VI–ii–V spine; Miles made it modal — teaches reinterpretation                 |
| **Basin Street Blues**              | 1928         | _Not_ a 12-bar despite the name — teaches that "blues" in a title means nothing |

**More jazz standards, all PD:** Stardust (1929, US-only) · Mean to Me (1929) · More Than You Know
(1929) · Just You, Just Me (1929) · Black and Blue (1929) · Liza (1929) · Rockin' Chair (1929,
US-only) · Sweet Lorraine (1928) · I Can't Give You Anything but Love (1928) · Lover, Come Back to
Me (1928) · Crazy Rhythm (1928) · If I Had You (1928) · Nagasaki (1928) · Creole Love Call (1928) ·
'S Wonderful (1927) · Someone to Watch Over Me (1926) · If I Could Be with You (1926) · Muskrat
Ramble (1926) · I Can't Believe That You're in Love with Me (1926) · I've Found a New Baby (1926) ·
Sugar (1926) · 'Deed I Do (1926) · Big Butter and Egg Man (1926) · Tea for Two (1925) · Dinah
(1925) · Squeeze Me (1925) · I Want to Be Happy (1925) · The Man I Love (1924) · Fascinating Rhythm
(1924) · Somebody Loves Me (1924) · King Porter Stomp (1924) · I'll See You in My Dreams (1924) ·
Riverboat Shuffle (1924) · Hard Hearted Hannah (1924) · Charleston (1923) · Tin Roof Blues (1923) ·
Exactly Like You (1930) · Confessin' (1930) · After You've Gone (1918) · Indiana (1917) · Rose Room
(1917) · Limehouse Blues (1922) · Tiger Rag (1917) · Darktown Strutters' Ball (1917) · China Boy
(1922) · Bugle Call Rag (1922) · Farewell Blues (1922) · Margie (1920) · The Sheik of Araby (1921)

**Blues** ⚠ (years from general reference; all safely pre-1931): St. Louis Blues (Handy, 1914 — 12-bar
_plus a habanera minor strain_; teaches that the blues has a tango in it) · Memphis Blues (1912) ·
Beale Street Blues (1917) · Nobody Knows You When You're Down and Out (1923 — 16-bar with descending
chromatic bass, the best PD "sophisticated blues") · Trouble in Mind (1924 — **8-bar**, teaches that
blues isn't always 12) · How Long Blues (1928 — 8-bar, piano idiom) · Careless Love · Frankie and
Johnny · St. James Infirmary (minor 8-bar).

**Ragtime / stride** — the direct ancestor of the left-hand technique the app doesn't teach, and the
best PD source of genuinely _pianistic_ material: Maple Leaf Rag (1899) · The Entertainer (1902) ·
Solace (1909, a habanera) · Weeping Willow · Pine Apple Rag · Gladiolus Rag.

**Gospel / spirituals — directly on-mission for the funk/soul priority, and completely free:** Swing
Low Sweet Chariot · Wade in the Water · Nobody Knows the Trouble I've Seen · Sometimes I Feel Like a
Motherless Child · Deep River · Go Down Moses · Down by the Riverside · Amazing Grace · When the
Saints. Pentatonic melodies, IV–I plagal cadences, call-and-response. **This is the harmonic
vocabulary of soul and gospel piano.**

**Folk / songwriter-adjacent, good for by-ear work:** Shenandoah · Aura Lee · Danny Boy · Scarborough
Fair.

---

## 7. Recommendation

| Strategy                  | Legal risk              | Content                                                              | Cost                                                              | Ceiling                        |
| ------------------------- | ----------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------ |
| **A. PD + CC only**       | very low                | strong jazz/blues/ragtime/gospel; **zero** funk/songwriter           | ~5–8 days for 40 charts                                           | hard stop at 1930              |
| **B. Import only**        | lowest                  | unlimited, but empty on first launch — near-fatal for a learning app | ~6–10 days                                                        | unlimited                      |
| C. Link out to Hooktheory | low                     | breaks the practice flow mid-lesson                                  | ~1 day                                                            | poor                           |
| D. Licensed API           | lowest _after_ the deal | excellent                                                            | a **business** cost, not a dev one — minimums, reporting, lawyers | inaccessible to a solo project |

### Do A, then B.

**Phase 1 — hand-author a PD catalog (~5–8 days).** 30–40 charts from §6. At bar-level chord symbols
a standard is 5–10 minutes of typing for someone who knows the tune. Sequence them as actual
curriculum: blues → rhythm changes → ii–V ballads → circle-of-fifths tunes → minor keys →
ragtime/stride technique.

Opening twelve: _I Got Rhythm_ · _Sweet Georgia Brown_ · _Honeysuckle Rose_ · _On the Sunny Side of
the Street_ · _But Not for Me_ · _Bye Bye Blackbird_ · _Oh Lady Be Good_ · _Softly As in a Morning
Sunrise_ · _St. Louis Blues_ · _Nobody Knows You When You're Down and Out_ · _Trouble in Mind_ ·
_Maple Leaf Rag_.

Hand-authoring means **we own the charts outright** — our specific selection and arrangement over a
PD tune is our original work, licensable however we like, with no provenance question ever. Worth
more than the week it costs.

Schema: `title, year, composer, form, key, tempo, bars[], sections[], pd: {us, eu}, melodyAllowed,
source`. (Current `Song` has no `year`, `composer`, `form`, `pd` or `melody` field — all needed.)

**Phase 2 — import (~3–4 days).** Build the **iReal Pro URL importer first** — highest-leverage
single feature in this report. The format is publicly documented by Technimo
(`irealbook://Title=Composer=Style=Key=n=Progression`), there's a reference implementation to check
against (`daumling/ireal-renderer`), and it is _the_ format our target user already has hundreds of
charts in. Then **ChordPro** (~1 day, trivial, huge in the worship/songwriter world — precisely the
missing repertoire). Skip MusicXML initially.

Import is client-side in a local-first app: **the chart never touches a server, so we distribute
nothing.** Same posture as iReal Pro itself, and the sturdiest position available.

**Phase 3 — optional.** A few Jonathan Coulton tunes under CC BY-NC, if the app stays
non-commercial. Drop it the moment charging is considered.

### Do not

- Ship ChoCo / iRb / Chordonomicon despite permissive-looking licenses — the compilers licensed
  their annotation layer, not the compositions. Dev-only, gitignored.
- Scrape Hooktheory. Their ToS prohibits it explicitly, including for model training. That's a
  contract claim, which is much easier for them to win than a copyright one.
- Ship melody for anything post-1930 unless user-imported or CC.
- Rely on "chord progressions aren't copyrightable" as a shipping strategy. Ultimate Guitar has the
  most at stake and the best information, and it pays publishers anyway.

---

## 8. Unverified — check before shipping

- **Isophonics**: the reference-annotations page contains no license text at all. Every "free for
  research" claim traces to convention, not a written grant. Treat as unlicensed.
- **iRealPro developer docs**: `irealpro.com/developer-docs` returned HTTP 403 to the researcher's
  fetch. Read it directly before building the importer, in case the documented format carries a
  restriction not visible from the public protocol page.
- **HFA/Ultimate Guitar 2010 press release**: not rendered (no PDF tooling); date, scope and the
  44,000-publisher figure corroborated via secondary sources. Primary PDF:
  `scoringnotes.com/wp-content/uploads/2023/12/HFAUltimateGuitar_20100406_Final.pdf`
- **Publication years in the blues/ragtime/spiritual/folk lists** are from general reference. All are
  comfortably pre-1931 so PD status isn't in doubt, but verify individual years if displayed in-app.

**Key sources:** Duke CSPD Public Domain Day 2026 · Hooktheory ToS + API docs · Wikipedia: Ultimate
Guitar · McGill Billboard/DDMAL · Weimar Jazz DB · Zenodo 3546040 (iRb) · smashub/choco + Nature Sci
Data · Chordonomicon (HuggingFace) · Mutopia legal page · MuseScore license policy · Jonathan Coulton
FAQ · FMA License Guide · iReal Pro chart protocol · ChordPro spec.
