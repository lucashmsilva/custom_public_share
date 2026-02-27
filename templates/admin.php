<?php

declare(strict_types=1);

/** @var array $_ */
?>

<div id="custom-public-share-settings" class="section">
	<h2><?php p($l->t('Custom Public Share Domain')); ?></h2>
	<p class="settings-hint">
		<?php p($l->t('Replace the domain in public share links with a custom domain. Leave empty to use the default Nextcloud domain.')); ?>
	</p>
	<form id="custom-public-share-form">
		<label for="custom-public-share-domain"><?php p($l->t('Custom domain')); ?></label>
		<input type="url"
			   id="custom-public-share-domain"
			   name="custom_domain"
			   placeholder="https://share.example.com"
			   value="<?php p($_['custom_domain']); ?>"
		/>
		<button type="submit" class="primary"><?php p($l->t('Save')); ?></button>
		<span id="custom-public-share-msg" class="msg"></span>
	</form>
</div>
