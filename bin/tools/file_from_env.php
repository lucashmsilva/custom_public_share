#!/usr/bin/env php
<?php
/**
 * Writes the value of an environment variable to a file.
 * Used by the Makefile appstore target to materialise secrets
 * passed as env vars (APP_PRIVATE_KEY, APP_PUBLIC_CRT) into the
 * certificate directory before code signing.
 *
 * Usage: php file_from_env.php ENV_VAR_NAME /path/to/output/file
 */

if ($argc < 3) {
	echo "Usage: ./file_from_env.php ENV_VAR PATH_TO_FILE\n";
	exit(1);
}

$content = getenv($argv[1]);

if (!$content) {
	echo "Variable {$argv[1]} was empty\n";
	exit(1);
}

file_put_contents($argv[2], $content);

echo "Done...\n";
