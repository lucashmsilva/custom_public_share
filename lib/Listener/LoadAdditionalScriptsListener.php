<?php

declare(strict_types=1);

namespace OCA\CustomPublicShare\Listener;

use OCA\CustomPublicShare\AppInfo\Application;
use OCP\AppFramework\Services\IInitialState;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use OCP\IConfig;
use OCP\Util;

/** @template-implements IEventListener<Event> */
class LoadAdditionalScriptsListener implements IEventListener {
	public function __construct(
		private IConfig $config,
		private IInitialState $initialState,
	) {
	}

	public function handle(Event $event): void {
		$customDomain = $this->config->getAppValue(Application::APP_ID, 'custom_domain', '');
		if ($customDomain === '') {
			return;
		}

		$this->initialState->provideInitialState('custom_domain', $customDomain);
		Util::addScript(Application::APP_ID, 'custom_public_share-public-share-rewrite');
	}
}
