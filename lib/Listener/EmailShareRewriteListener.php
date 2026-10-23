<?php

declare(strict_types=1);

namespace OCA\CustomPublicShare\Listener;

use OCA\CustomPublicShare\AppInfo\Application;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use OCP\IConfig;
use OCP\IURLGenerator;
use OCP\Mail\Events\BeforeMessageSent;

/** @template-implements IEventListener<BeforeMessageSent> */
class EmailShareRewriteListener implements IEventListener {
	public function __construct(
		private IConfig $config,
		private IURLGenerator $urlGenerator,
	) {
	}

	public function handle(Event $event): void {
		if (!($event instanceof BeforeMessageSent)) {
			return;
		}

		$customDomain = $this->config->getAppValue(Application::APP_ID, 'custom_domain', '');
		if ($customDomain === '') {
			return;
		}

		$message = $event->getMessage();

		// Nextcloud 35 still exposes body getters only on its internal mail object.
		// IMessage does not expose body getters, so we duck-type through the concrete class.
		if (!method_exists($message, 'getSymfonyEmail')) {
			return;
		}

		$symfonyEmail = $message->getSymfonyEmail();
		$baseUrl = rtrim($this->urlGenerator->getBaseUrl(), '/');

		$html = $symfonyEmail->getHtmlBody();
		if (is_string($html) && $html !== '') {
			$rewritten = $this->rewriteUrls($html, $baseUrl, $customDomain);
			if ($rewritten !== $html) {
				$symfonyEmail->html($rewritten);
			}
		}

		$text = $symfonyEmail->getTextBody();
		if (is_string($text) && $text !== '') {
			$rewritten = $this->rewriteUrls($text, $baseUrl, $customDomain);
			if ($rewritten !== $text) {
				$symfonyEmail->text($rewritten);
			}
		}
	}

	private function rewriteUrls(string $body, string $baseUrl, string $customDomain): string {
		$quotedBase = preg_quote($baseUrl, '/');
		$pattern = '/' . $quotedBase . '(\/index\.php)?\/s\/([A-Za-z0-9]+)/';
		return preg_replace_callback($pattern, static fn (array $match): string => rtrim($customDomain, '/') . '/s/' . $match[2], $body) ?? $body;
	}
}
