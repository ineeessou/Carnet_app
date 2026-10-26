#!/usr/bin/env node
/*
 * Construit public/ à partir de src/ :
 *  - compile le JavaScript pour les vieux Safari (iOS 9 et plus) avec Babel
 *  - assemble index.html (styles intégrés)
 * Usage : cd tools && npm install && node build.js
 */
const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const SRC = path.join(__dirname, '..', 'src');
const OUT = path.join(__dirname, '..', 'public');
fs.mkdirSync(OUT, { recursive: true });

const read = f => fs.readFileSync(path.join(SRC, f), 'utf8');
const compile = code => babel.transformSync(code, {
  babelrc: false, configFile: false, compact: false, comments: false,
  presets: [[require.resolve('@babel/preset-env'), { targets: { safari: '8', ios: '8' }, modules: false }]]
}).code;

const regen = fs.readFileSync(require.resolve('regenerator-runtime/runtime.js'), 'utf8');
const js = [
  '/* Carnet de repas — fichier généré par tools/build.js, ne pas modifier à la main. */',
  read('polyfills.js'),
  regen,
  compile(read('api.js')),
  compile(read('app.js'))
].join('\n;\n');
fs.writeFileSync(path.join(OUT, 'app.js'), js);

const css = read('style.css') + '\n' + read('extra.css');
const html = '<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' +
  '<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n' +
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n<meta name="apple-mobile-web-app-title" content="Carnet">\n' +
  '<meta name="theme-color" content="#16297A">\n<link rel="apple-touch-icon" href="icon.png">\n<link rel="manifest" href="manifest.webmanifest">\n' +
  read('head.html').trim() + '\n<style>\n' + css + '\n</style>\n</head>\n<body>\n' + read('body.html').trim() +
  '\n<script src="app.js"></script>\n</body>\n</html>\n';
fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log('public/ construit :', (js.length / 1024).toFixed(0) + ' Ko de JS,', (html.length / 1024).toFixed(0) + ' Ko de HTML');
