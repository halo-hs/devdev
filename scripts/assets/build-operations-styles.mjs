import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../trade-os/operations');
let input = await fs.readFile(path.join(base, 'styles/globals.css'), 'utf8');
input = input.replace(/@import "tailwindcss"[^;]*;/, '@import "tailwindcss" source(none);')
  .replace(/^@source[^;]*;/gm, '')
  .replace(/@import "[^"\n]*font-face\.css";/g, '');
const compiler = await compile(input, { base: path.join(base, 'styles'), onDependency() {} });
const scanner = new Scanner({ sources: [{base, pattern:'**/*.{ts,tsx}', negated:false}] });
const root = postcss.parse(compiler.build(scanner.scan()));
root.walkRules(rule => {
  let parent = rule.parent;
  while(parent) {
    if(parent.type === 'rule' || (parent.type === 'atrule' && /keyframes$/.test(parent.name))) return;
    parent = parent.parent;
  }
  rule.selector = selectorParser(selectors => {
    selectors.each(selector => {
      let rootSelector = false;
      selector.walk(node => {
        if ((node.type==='pseudo' && [':root',':host'].includes(node.value)) ||
            (node.type==='tag' && ['html','body'].includes(node.value))) {
          node.replaceWith(selectorParser.className({value:'reference-3030'}));
          rootSelector = true;
        }
      });
      if(!rootSelector) {
        selector.prepend(selectorParser.combinator({value:' '}));
        selector.prepend(selectorParser.className({value:'reference-3030'}));
      }
    });
  }).processSync(rule.selector);
});
root.walkAtRules('font-face', rule => {
  rule.walkDecls('src', decl => { decl.value = decl.value.replaceAll('/fonts/','/assets/operations/fonts/'); });
});
await fs.writeFile(path.join(base,'styles/scoped.css'), '/* Generated from the localhost:3030 source. Scoped to these five screens. */\n'+root.toString());
console.log('Built isolated reference CSS');
