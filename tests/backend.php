<?php
// Small isolated regression harness; a live Nextcloud smoke test is still required.
declare(strict_types=1);
namespace OCP {
 interface IRequest {}
 interface IConfig { public function getAppValue(string $app, string $key, string $default): string; public function setAppValue(string $app, string $key, string $value): void; }
 interface IURLGenerator {}
}
namespace OCP\AppFramework { class Controller { public function __construct($app, $request) {} } }
namespace OCP\AppFramework\Http { class JSONResponse { public function __construct(public array $data, public int $status = 200) {} } }
namespace OCP\EventDispatcher { class Event {} interface IEventListener { public function handle(Event $event): void; } }
namespace OCA\CustomPublicShare\AppInfo { class Application { public const APP_ID = 'custom_public_share'; } }
namespace {
 require __DIR__ . '/../lib/Controller/SettingsController.php';
 require __DIR__ . '/../lib/Listener/EmailShareRewriteListener.php';
 function check(bool $ok, string $label): void { if (!$ok) throw new \RuntimeException($label); echo "PASS: $label\n"; }
 $config = new class implements \OCP\IConfig {
  public string $value = '';
  public function getAppValue(string $app, string $key, string $default): string { return $this->value; }
  public function setAppValue(string $app, string $key, string $value): void { $this->value = $value; }
 };
 $controller = new \OCA\CustomPublicShare\Controller\SettingsController(new class implements \OCP\IRequest {}, $config);
 foreach (['ftp://example.com', 'https://user:pass@example.com', 'https://example.com?x=1', 'https://example.com#x', 'invalid'] as $url) {
  check($controller->save($url)->status === 400, "reject $url");
 }
 check($controller->save(' https://example.com:8443/public/ ')->status === 200 && $config->value === 'https://example.com:8443/public', 'normalize base URL with port and path');
 check($controller->save('')->status === 200 && $config->value === '', 'clear settings');
 $listener = new \OCA\CustomPublicShare\Listener\EmailShareRewriteListener($config, new class implements \OCP\IURLGenerator {});
 $rewrite = new \ReflectionMethod($listener, 'rewriteUrls');
 $base = 'https://internal.example/nextcloud';
 $target = 'https://share.example/$1';
 $body = '<a href="' . $base . '/index.php/s/Ab123/download?x=1&amp;y=2">' . $base . '/s/Other</a>';
 $expected = '<a href="' . $target . '/s/Ab123/download?x=1&amp;y=2">' . $target . '/s/Other</a>';
 check($rewrite->invoke($listener, $body, $base, $target) === $expected, 'email preserves HTML, suffixes and literal dollar signs');
 check($rewrite->invoke($listener, 'https://other.example/s/Ab123', $base, $target) === 'https://other.example/s/Ab123', 'unrelated email links unchanged');
}
