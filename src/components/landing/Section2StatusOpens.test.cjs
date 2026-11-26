const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

test('disabled reward tiles never query the rewards catalog', () => {
  const source = readFileSync(`${__dirname}/Section2StatusOpens.tsx`, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  let catalogReads = 0;
  let initialLoading;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require: (name) => {
      if (name === 'react') return {
        useEffect: (effect) => effect(),
        useState: (state) => { initialLoading = state.loading; return [state, () => {}]; },
      };
      if (name === 'react/jsx-runtime') return { jsx: () => null, jsxs: () => null };
      if (name.includes('supabase/client')) return { supabase: { from: () => { catalogReads++; throw new Error('Unexpected catalog read'); } } };
      return {};
    },
  });
  exports.Section2StatusOpens();
  assert.equal(catalogReads, 0);
  assert.equal(initialLoading, false);
});