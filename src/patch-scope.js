const fs = require('fs');
const path = require('path');
const { jsdom } = require('jsdom');
const LocalStorage = require('./LocalStorage');

function patchScope({ storageFileName }) {
  const html = '<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>';
  const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36';

  const document = jsdom(html, { userAgent });
  const window = document.defaultView;

  const storage = new LocalStorage(storageFileName);

  Object.assign(window, {
    window,
    document,
    WebSocket: require('ws'),
    localStorage: storage,
    sessionStorage: storage
  });

  const keys = [
    'window',
    'document',
    'location',
    'navigator',
    'localStorage',
    'sessionStorage',

    'Blob',
    'File',
    'Event',
    'WebSocket',
    'FileReader',
    'XMLHttpRequest'
  ];

  keys.forEach((key) => {
    global[key] = window[key];
  });

  File.create = (filePathName) => {
    const content = fs.readFileSync(filePathName);
    const fileName = path.basename(filePathName);
    return new File([content], fileName);
  };

  document.dispatchEvent(new Event('DOMContentLoaded'));
}

module.exports = patchScope;