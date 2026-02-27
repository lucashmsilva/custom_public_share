<?php

declare(strict_types=1);

namespace OCA\CustomPublicShare\AppInfo;

use OCA\CustomPublicShare\Listener\EmailShareRewriteListener;
use OCA\CustomPublicShare\Listener\LoadAdditionalScriptsListener;
use OCA\Files\Event\LoadAdditionalScriptsEvent;
use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;
use OCP\Mail\Events\BeforeMessageSent;

class Application extends App implements IBootstrap {
	public const APP_ID = 'custom_public_share';

	public function __construct() {
		parent::__construct(self::APP_ID);
	}

	public function register(IRegistrationContext $context): void {
		$context->registerEventListener(
			LoadAdditionalScriptsEvent::class,
			LoadAdditionalScriptsListener::class
		);
		$context->registerEventListener(
			BeforeMessageSent::class,
			EmailShareRewriteListener::class
		);
	}

	public function boot(IBootContext $context): void {
	}
}
