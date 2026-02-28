app_name=custom_public_share
cert_dir=$(HOME)/.nextcloud/certificates
build_dir=$(CURDIR)/build
appstore_sign_dir=$(build_dir)/artifacts/appstore

# Runtime directories included in the release archive
release_dirs=appinfo lib templates css js

.PHONY: all build appstore clean

all: build

build:
	npm ci
	npm run build

appstore:
	rm -rf $(appstore_sign_dir)
	mkdir -p $(appstore_sign_dir)/$(app_name)
	cp -r $(release_dirs) $(appstore_sign_dir)/$(app_name)/

	# Write private key and certificate from environment variables
	mkdir -p $(cert_dir)
	php ./bin/tools/file_from_env.php "app_private_key" "$(cert_dir)/$(app_name).key"
	php ./bin/tools/file_from_env.php "app_public_crt" "$(cert_dir)/$(app_name).crt"

	@if [ -f $(cert_dir)/$(app_name).key ]; then \
		echo "Signing app files…"; \
		php ../../occ integrity:sign-app \
			--privateKey=$(cert_dir)/$(app_name).key \
			--certificate=$(cert_dir)/$(app_name).crt \
			--path=$(appstore_sign_dir)/$(app_name); \
		echo "Signing app files ... done"; \
	fi

	tar -czf $(appstore_sign_dir)/$(app_name).tar.gz \
		-C $(appstore_sign_dir) $(app_name)

	rm -f $(cert_dir)/$(app_name).key $(cert_dir)/$(app_name).crt

clean:
	rm -rf $(build_dir)
	rm -rf node_modules
