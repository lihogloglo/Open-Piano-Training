/**
 * Desktop shell for Keysense.
 *
 * The app is the same Vite build the web ships. This file only does the three
 * things a browser would otherwise do for us:
 *
 *   1. Serve `dist/` over a real URL scheme, so the history router and the
 *      Web Audio secure-context rules behave as they do on the web.
 *   2. Grant the MIDI permission, which Electron denies by default.
 *   3. Keep navigation inside the app and send real links to the browser.
 */
const { app, BrowserWindow, Menu, net, protocol, session, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { isAppUrl, resolveAsset } = require('./security.cjs');

const DIST = path.join(__dirname, '..', 'dist');
const SCHEME = 'keysense';
const ORIGIN = `${SCHEME}://app`;

// A privileged scheme gets treated as secure and standard. Without this the
// renderer is not a secure context, and Web MIDI and the AudioWorklet are gone.
protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
]);

/** Maps one request to a file in `dist`, with the usual single-page fallback. */
function resolve(requestUrl) {
  return resolveAsset(DIST, requestUrl);
}

function serve() {
  protocol.handle(SCHEME, async (request) => {
    const file = resolve(request.url);
    if (!file) return new Response('Forbidden', { status: 403 });
    const response = await net.fetch(pathToFileURL(file).toString());
    if (response.status === 404 && path.extname(file) !== '') {
      // A missing asset is a real 404. Only routes fall back to the shell.
      return response;
    }
    return response;
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#0b0d0e',
    icon: path.join(DIST, 'pwa-512.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once('ready-to-show', () => win.show());

  // Real links go to the user's browser. Nothing opens a second app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) void shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!isAppUrl(url)) {
      event.preventDefault();
      if (url.startsWith('http:') || url.startsWith('https:')) void shell.openExternal(url);
    }
  });

  void win.loadURL(`${ORIGIN}/`);
  return win;
}

/**
 * Electron denies MIDI until we say otherwise, and it routes every MIDI ask
 * through the `midiSysex` name even when the page asked for `sysex: false` —
 * which is what our adapter does. So both names have to pass.
 *
 * Everything else stays denied. The app has no use for a camera, a microphone
 * or a location.
 */
const ALLOWED_PERMISSIONS = new Set(['midi', 'midiSysex']);

function setPermissions(target) {
  target.setPermissionRequestHandler((wc, permission, callback) => {
    callback(ALLOWED_PERMISSIONS.has(permission) && isAppUrl(wc.getURL()));
  });
  target.setPermissionCheckHandler(
    (wc, permission, origin) => ALLOWED_PERMISSIONS.has(permission) && isAppUrl(wc?.getURL() || origin),
  );
}

// One window only. A second launch focuses the window that is already open.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  void app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    serve();
    setPermissions(session.defaultSession);
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
