# Languages

Keysense includes English and French. Choose a language on the welcome screen or in Settings.
The system option follows the first supported browser or operating-system language.
Regional variants such as `fr-CA` use French. Unsupported languages use English.
Changing the language reloads the current page. Progress and other preferences remain on the device.
The language preference also travels with exported backups.

## Add a language

1. Copy `src/i18n/locales/en.json` to a new file such as `es.json`.
2. Translate the values. Keep the English keys, placeholders, Markdown emphasis, and musical symbols unchanged.
3. Add the language code and native name to `languages` in `src/i18n/index.ts`.
4. Add its dynamic catalog import to `loaders` in the same file.
5. Run `npm run check:i18n`, `npm run check`, and `npm run build`.
6. Test the welcome screen, Settings, lessons, exercises, and keyboard labels at 1024 pixels wide.

The selector, preference schema, and regional-language matching use this registry.
Vite bundles catalogs locally. The PWA precaches their chunks, and desktop packages contain them.
No translation request goes to an external service.

## Add or change text

Use `tr('Continue')` for visible text, including accessibility labels and generated exercise instructions.
English messages serve as catalog keys and runtime fallbacks.
Use complete sentences with named placeholders for new messages:

```tsx
tr('Bar {bar}, beat {beat}', { bar: 2, beat: 1 });
```

Interpolated numbers use the selected locale. Known message values also use the catalog.
Text stays plain text. React escapes it, and lesson Markdown uses the existing limited renderer.
Use `getLocale()` when formatting dates through `Intl` or `toLocaleDateString`.

Use `plural` for counted messages:

```tsx
plural({ one: '{count} day streak', other: '{count} days streak' }, streak);
```

`Intl.PluralRules` selects the active language's category. Additional `zero`, `two`, `few`, or `many` forms can be supplied where needed.
Keep each form as a complete sentence so translators can change word order.

Run `npm run i18n:extract` to add literal messages to the English catalog.
This command then reports missing translations. Fill those entries in every translated catalog.
For labels selected dynamically, add their English entries explicitly.
CI checks catalog coverage and placeholder agreement.
Unit tests load every French lesson and compare generated exercise mechanics with English.

## Data boundaries

Keep route names, lesson IDs, MIDI notes, chord symbols, scale identifiers, enums, and form values independent of language.
For example, Tonal still receives `harmonic minor`, while its displayed label is translated separately.
The French lessons explain the correspondence C–B = do–si. The keyboard and charts retain letter notation.
Library names, license names, and credited traditional song titles remain recognizable.

`src/app/main.tsx` loads the catalog before importing `bootstrap.tsx`.
This order matters because curriculum modules and label tables initialize at module load.
Language changes therefore reload the page instead of changing only part of an active exercise.
The translation runtime has no React, DOM, or storage imports. Pure engine modules can use it.

Use stable IDs for new persisted content references. Existing title fields use `sourceText` before recording.
Creative session blocks retain a source prompt and an optional review skill ID for display after a language change.
Older backups without these optional fields remain accepted.
