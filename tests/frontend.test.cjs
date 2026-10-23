const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { JSDOM } = require('jsdom')
const source = readFileSync('src/public-share-rewrite.js', 'utf8').replace(/^import .*$/gm, '')
const base = 'https://internal.example/nextcloud'
const external = 'https://share.example/public'
function setup(t, html = '', domain = external) {
 const dom = new JSDOM(html, { url: base + '/apps/files', runScripts: 'outside-only' })
 t.after(() => dom.window.close())
 const w = dom.window
 w.loadState = () => domain
 w.getBaseUrl = () => base
 w.navigator.clipboard = { writeText: async text => text }
 w.prompt = (message, value) => value
 w.eval(source)
 return w
}
const flush = w => new Promise(resolve => w.setTimeout(resolve, 0))
test('clipboard preserves download paths, query strings and multiple links', async t => {
 const w = setup(t)
 assert.equal(await w.navigator.clipboard.writeText(`${base}/index.php/s/Ab123/download?path=%2F#x ${base}/s/Other`), `${external}/s/Ab123/download?path=%2F#x ${external}/s/Other`)
 assert.equal(await w.navigator.clipboard.writeText('https://unrelated.example/s/Ab123'), 'https://unrelated.example/s/Ab123')
 assert.equal(w.prompt('copy', `${base}/s/Ab123`), `${external}/s/Ab123`)
})
test('initial DOM is rewritten without removing icons or child handlers', t => {
 const w = setup(t, `<a href="${base}/s/Ab123"><span>icon</span>${base}/s/Ab123</a><input type="url" value="${base}/s/Ab123">`)
 assert.equal(w.document.querySelector('a').href, `${external}/s/Ab123`)
 assert.equal(w.document.querySelector('span').textContent, 'icon')
 assert.equal(w.document.querySelector('input').value, `${external}/s/Ab123`)
})
test('new anchors and Vue href/text updates are rewritten', async t => {
 const w = setup(t)
 const a = w.document.createElement('a')
 a.href = `${base}/s/First`
 a.textContent = a.href
 w.document.body.append(a)
 await flush(w)
 assert.equal(a.href, `${external}/s/First`)
 a.href = `${base}/index.php/s/Second`
 a.firstChild.nodeValue = `${base}/s/Second`
 await flush(w)
 assert.equal(a.href, `${external}/s/Second`)
 assert.equal(a.textContent, `${external}/s/Second`)
})
test('empty configuration leaves clipboard unchanged', async t => {
 const w = setup(t, '', '')
 assert.equal(await w.navigator.clipboard.writeText(`${base}/s/Ab123`), `${base}/s/Ab123`)
})
