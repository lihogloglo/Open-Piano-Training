/** Extract literal messages and validate every installed translation catalog. */
import ts from 'typescript';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const directory = 'src/i18n/locales';
const englishPath = join(directory, 'en.json');
const english = JSON.parse(readFileSync(englishPath, 'utf8'));
const messages = new Set();
for (const file of readdirSync('src', { recursive: true }).filter(
  (f) => /\.(ts|tsx)$/.test(f) && !/\.test\./.test(f),
)) {
  const source = ts.createSourceFile(
    file,
    readFileSync(join('src', file), 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      node.expression.getText(source) === 'tr' &&
      node.arguments[0] &&
      ts.isStringLiteralLike(node.arguments[0])
    )
      messages.add(node.arguments[0].text);
    if (
      ts.isCallExpression(node) &&
      node.expression.getText(source) === 'plural' &&
      node.arguments[0] &&
      ts.isObjectLiteralExpression(node.arguments[0])
    ) {
      for (const property of node.arguments[0].properties)
        if (ts.isPropertyAssignment(property) && ts.isStringLiteralLike(property.initializer))
          messages.add(property.initializer.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
if (process.argv.includes('--write')) {
  for (const message of messages) english[message] = message;
  writeFileSync(englishPath, JSON.stringify(english, null, 2) + '\n');
}
const errors = [];
for (const message of messages) if (!(message in english)) errors.push(`Missing English entry: ${message}`);
const placeholders = (text) => JSON.stringify((text.match(/\{\w+\}/g) ?? []).sort());
for (const file of readdirSync(directory).filter((f) => f.endsWith('.json'))) {
  const catalog = JSON.parse(readFileSync(join(directory, file), 'utf8'));
  for (const [key, source] of Object.entries(english)) {
    const value = catalog[key];
    if (typeof value !== 'string' || !value.trim()) errors.push(`${file}: missing ${key}`);
    else if (placeholders(source) !== placeholders(value))
      errors.push(`${file}: placeholders differ for ${key}`);
  }
  for (const key of Object.keys(catalog)) if (!(key in english)) errors.push(`${file}: unknown key ${key}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else console.log(`Translation catalogs complete: ${Object.keys(english).length} messages.`);
