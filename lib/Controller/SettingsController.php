<?php

declare(strict_types=1);

namespace OCA\CustomPublicShare\Controller;

use OCA\CustomPublicShare\AppInfo\Application;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IConfig;
use OCP\IRequest;

class SettingsController extends Controller {
	public function __construct(
		IRequest $request,
		private IConfig $config,
	) {
		parent::__construct(Application::APP_ID, $request);
	}

	public function get(): JSONResponse {
		return new JSONResponse([
			'custom_domain' => $this->config->getAppValue(Application::APP_ID, 'custom_domain', ''),
		]);
	}

	public function save(string $custom_domain = ''): JSONResponse {
		$custom_domain = trim($custom_domain);

		if ($custom_domain !== '') {
			// Validate URL format
			if (!filter_var($custom_domain, FILTER_VALIDATE_URL)) {
				return new JSONResponse(['error' => 'Invalid URL format. Please enter a valid URL (e.g., https://share.example.com).'], 400);
			}

			$scheme = parse_url($custom_domain, PHP_URL_SCHEME);
			if (!in_array($scheme, ['http', 'https'], true)) {
				return new JSONResponse(['error' => 'URL must use http or https scheme.'], 400);
			}

			// Strip trailing slash
			$custom_domain = rtrim($custom_domain, '/');
		}

		$this->config->setAppValue(Application::APP_ID, 'custom_domain', $custom_domain);

		return new JSONResponse(['custom_domain' => $custom_domain]);
	}
}
