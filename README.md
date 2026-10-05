# Open Piano Training

**Keysense** is a piano practice app with guided lessons, music theory, ear training, and feedback on notes and timing.
Use a MIDI keyboard, your computer keyboard, or the on-screen piano. The interface supports English and French.

**Early release: this project is not thoroughly tested and needs more love.**
Expect bugs and rough edges. Hardware testing, teacher feedback, lesson improvements, translations, and code contributions are welcome.
Automated tests do not replace testing with real keyboards and learners.

## Try it

Download Windows or Linux packages from [GitHub Releases](https://github.com/lihogloglo/Open-Piano-Training/releases).
The app downloads piano sounds directly from their provider when you first enable sound. Internet access is required for that download.
Downloaded sounds are cached on your device for later use. Windows executables are not code-signed.

To run from source, install Node.js 22.13 or later and npm:

```bash
git clone https://github.com/lihogloglo/Open-Piano-Training.git
cd Open-Piano-Training
npm ci
npm run dev
```

Open `http://localhost:5173`. Chrome and Edge support MIDI keyboards.
Use a window at least 1024 pixels wide.

## Develop

```bash
npm run check          # lint, types, translations, contrast, and unit tests
npm run build          # browser build with license notices
npm run desktop:build  # desktop packages for your operating system
```

See [desktop build details](docs/releases.md), [project status](docs/STATUS.md), and [translation instructions](docs/localization.md).
Report bugs and suggest changes through [GitHub Issues](https://github.com/lihogloglo/Open-Piano-Training/issues).

## Privacy

The app has no accounts or analytics. Practice progress stays on your device.
Export a backup from Settings before clearing browser data.
The app downloads piano audio from `smpldsnds.github.io`, which receives normal web requests, including your IP address.

## License

Project code and original content use the [MIT License](LICENSE).
Dependencies, fonts, samples, and the copied writing skill keep their own terms. See [third-party notices](THIRD_PARTY_NOTICES.md).
