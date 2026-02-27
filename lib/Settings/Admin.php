<?php

declare(strict_types=1);

namespace OCA\CustomPublicShare\Settings;

use OCA\CustomPublicShare\AppInfo\Application;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\IConfig;
use OCP\Settings\ISettings;
use OCP\Util;

class Admin implements ISettings {
	public function __construct(
		private IConfig $config,
	) {
	}

	public function getForm(): TemplateResponse {
		Util::addScript(Application::APP_ID, 'custom_public_share-admin');
		Util::addStyle(Application::APP_ID, 'admin');

		$params = [
			'custom_domain' => $this->config->getAppValue(Application::APP_ID, 'custom_domain', ''),
		];
		return new TemplateResponse(Application::APP_ID, 'admin', $params);
	}

	public function getSection(): string {
		return 'sharing';
	}

	public function getPriority(): int {
		return 90;
	}
}
