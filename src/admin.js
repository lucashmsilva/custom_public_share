import axios from '@nextcloud/axios'
import { generateUrl } from '@nextcloud/router'

document.addEventListener('DOMContentLoaded', () => {
	const form = document.getElementById('custom-public-share-form')
	if (!form) {
		return
	}

	form.addEventListener('submit', async (e) => {
		e.preventDefault()

		const input = document.getElementById('custom-public-share-domain')
		const msgEl = document.getElementById('custom-public-share-msg')
		const customDomain = input.value.trim()

		msgEl.textContent = ''
		msgEl.className = 'msg'

		try {
			const url = generateUrl('/apps/custom_public_share/settings')
			await axios.post(url, { custom_domain: customDomain })

			msgEl.textContent = 'Saved'
			msgEl.className = 'msg success'
		} catch (err) {
			const message = err.response?.data?.error || 'Failed to save settings.'
			msgEl.textContent = message
			msgEl.className = 'msg error'
		}
	})
})
