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

	const baseUrl = getBaseUrl()

	// Match share URLs: baseUrl + optional /index.php + /s/ + token
	// Captures everything up to and including /s/TOKEN
	const sharePattern = new RegExp(
		baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
		+ '(/index\\.php)?/s/([A-Za-z0-9]+)',
		'g'
	)

	function rewriteUrl(text) {
		return text.replace(sharePattern, (match, indexPhp, token) => {
			return customDomain + '/s/' + token
		})
	}

	// Strategy 1: Override navigator.clipboard.writeText
	if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
		const originalWriteText = navigator.clipboard.writeText.bind(navigator.clipboard)
		navigator.clipboard.writeText = function(text) {
			return originalWriteText(rewriteUrl(text))
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

			// Handle attribute changes on input elements
			if (mutation.type === 'attributes'
				&& mutation.target.tagName === 'INPUT'
				&& mutation.attributeName === 'value') {
				rewriteInput(mutation.target)
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

		// Rewrite links
		const links = el.querySelectorAll('a[href]')
		links.forEach((link) => {
			if (matchesShareUrl(link.href)) {
				link.href = rewriteUrl(link.href)
			}
			if (link.textContent && matchesShareUrl(link.textContent)) {
				link.textContent = rewriteUrl(link.textContent)
			}
		})
	}

	// Start observing once the DOM is ready
	if (document.body) {
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['value'],
		})
	} else {
		document.addEventListener('DOMContentLoaded', () => {
			observer.observe(document.body, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ['value'],
			})
		})
	}
})()
