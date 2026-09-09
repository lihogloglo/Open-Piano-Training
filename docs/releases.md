# Desktop releases

The release workflow builds Windows x64 and Linux x64 packages.
Each release contains four downloads:

- Windows NSIS installer
- Windows portable executable
- Linux AppImage
- Linux Debian package (`.deb`)

Linux packages are built on Ubuntu 22.04. They target desktop Linux on x86-64.
The Debian package is for compatible Debian and Ubuntu systems.
The AppImage requires a working Electron sandbox and the system libraries needed by Electron.
Some systems also need FUSE support. Prefer the Debian package on compatible systems if AppImage startup fails.
Do not disable the sandbox to make a package start.
See the [AppImage sandbox documentation](https://docs.appimage.org/user-guide/troubleshooting/electron-sandboxing.html).

## Build locally

```bash
npm ci
npm run desktop:build
```

This builds packages for the current operating system in `release/`.
Explicit commands are `npm run desktop:build:win` and `npm run desktop:build:linux`.
Build Linux packages on Linux. Both commands include piano samples and the production web build.
Package targets are configured in `electron-builder.yml`.
See the [electron-builder Linux reference](https://www.electron.build/v26/docs/linux/).

## Publish a version

Update the version in `package.json` and `package-lock.json` together.
Use one of the existing release triggers:

- Push a matching `v*` tag.
- Push a matching `release/v*` branch.
- Start the workflow manually with a matching tag and a source ref.

Both build jobs check the package version, lint, types, translation catalogs, unit tests, formatting, security tests, and bundle size.
The Linux job also starts the packaged application under Xvfb and checks French startup, MIDI API availability, and an offline piano sample.
It uses a temporary profile so the test cannot change a user's settings.

A separate publishing job requires both builds to succeed.
It checks that both platforms built the same commit and that all four downloads exist.
New releases remain drafts until the upload succeeds.
The release tag targets the recorded build commit, including manual runs with a custom source ref.
A failed Linux build therefore prevents a new Windows-only release.

## Local verification limits

The implementation was checked on Windows. Native Linux startup and Debian/AppImage installation need the Linux runner or a Linux desktop.
Physical MIDI devices still need hardware testing on each operating system.
