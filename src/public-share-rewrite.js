import { loadState } from '@nextcloud/initial-state'
import { getBaseUrl } from '@nextcloud/router'

;(function() {
	let customDomain
	try {
		customDomain = loadState('custom_public_share', 'custom_domain')
	} catch (e) {
		return
	}

	if (!customDomain) {
		return
	}

	customDomain = customDomain.replace(/\/+$/, '')
	const baseUrl = getBaseUrl().replace(/\/+$/, '')

	// Match share URLs: baseUrl + optional /index.php + /s/ + token
	// Captures everything up to and including /s/TOKEN
	const sharePattern = new RegExp(
		baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
		+ '(/index\\.php)?/s/([A-Za-z0-9]+)',
		'g'
	)

	function rewriteUrl(text) {
		return typeof text !== 'string' ? text : text.replace(sharePattern, (match, indexPhp, token) => {
			return customDomain + '/s/' + token
		})
	}

	// Strategy 1: Override navigator.clipboard.writeText
	if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
		const originalWriteText = navigator.clipboard.writeText.bind(navigator.clipboard)
		try {
			navigator.clipboard.writeText = function(text) {
				return originalWriteText(rewriteUrl(text))
			}
		} catch {
			// Some browsers make this method read-only; keep the DOM and prompt hooks.
		}
	}

	// Strategy 2: Override window.prompt (fallback clipboard mechanism)
	const originalPrompt = window.prompt
	window.prompt = function(message, value) {
		if (typeof value === 'string') {
			value = rewriteUrl(value)
		}
		return originalPrompt.call(window, message, value)
	}

	// Strategy 3: MutationObserver to rewrite visible URLs in the DOM
	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			// Handle added nodes
			for (const node of mutation.addedNodes) {
				if (node.nodeType !== Node.ELEMENT_NODE) {
					continue
				}
				rewriteElement(node)
			}

			if (mutation.type === 'attributes') {
				rewriteElement(mutation.target)
			} else if (mutation.type === 'characterData') {
				const link = mutation.target.parentElement?.closest('a[href]')
				if (link) rewriteLink(link)
			}
		}
	})

	function matchesShareUrl(text) {
		sharePattern.lastIndex = 0
		return sharePattern.test(text)
	}

	function rewriteInput(input) {
		if (input.value && matchesShareUrl(input.value)) {
			input.value = rewriteUrl(input.value)
		}
	}

	function rewriteElement(el) {
		// Rewrite input values
		const inputs = el.querySelectorAll('input[type="text"], input[type="url"], input:not([type])')
		inputs.forEach(rewriteInput)
		if (el.tagName === 'INPUT') {
			rewriteInput(el)
		}

		// Include a newly inserted anchor itself, not only its descendants.
		if (el.matches('a[href]')) rewriteLink(el)
		el.querySelectorAll('a[href]').forEach(rewriteLink)
	}

	function rewriteLink(link) {
		const href = rewriteUrl(link.href)
		if (href !== link.href) link.href = href
		// Preserve Vue-owned child elements (icons and event handlers).
		const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT)
		while (walker.nextNode()) {
			const node = walker.currentNode
			const value = rewriteUrl(node.nodeValue)
			if (value !== node.nodeValue) node.nodeValue = value
		}
	}

	function start() {
		rewriteElement(document.body)
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			characterData: true,
			attributeFilter: ['value', 'href'],
		})
	}

	if (document.body) {
		start()
	} else {
		document.addEventListener('DOMContentLoaded', start, { once: true })
	}
})()
