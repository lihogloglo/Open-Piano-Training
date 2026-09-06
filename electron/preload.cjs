/**
 * The only thing the page learns from the shell is that it is the shell.
 * The app uses this to skip the service worker: the desktop build already
 * carries every asset, and a worker cannot register on a custom scheme.
 */
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('keysenseDesktop', {
  version: process.versions.electron,
});
