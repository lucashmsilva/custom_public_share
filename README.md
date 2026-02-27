# App Structure
```
  custom_public_share/
  ├── appinfo/
  │   ├── info.xml                    # App metadata (NC 30-33, namespace CustomPublicShare)
  │   └── routes.php                  # GET/POST /settings routes
  ├── lib/
  │   ├── AppInfo/Application.php     # IBootstrap, registers event listener
  │   ├── Settings/Admin.php          # Admin settings under "sharing" section
  │   ├── Controller/SettingsController.php  # Save/get custom_domain with URL validation
  │   └── Listener/LoadAdditionalScriptsListener.php  # Injects initial state + loads JS
  ├── templates/admin.php             # Settings form
  ├── css/admin.css                   # Admin form styles
  ├── src/
  │   ├── admin.js                    # Settings save via @nextcloud/axios
  │   └── public-share-rewrite.js     # Core: clipboard/prompt/DOM interception
  ├── js/                             # Built output
  │   ├── custom_public_share-admin.js
  │   └── custom_public_share-public-share-rewrite.js
  ├── package.json
  └── webpack.config.js
```
# How it Works

  1. Admin configures a custom domain (e.g. https://share.example.com) in Settings → Sharing
  2. When the Files app loads, the event listener injects the custom domain via IInitialState and loads the rewrite script
  3. The rewrite script intercepts share URLs via three strategies:
    - navigator.clipboard.writeText override (catches copy-to-clipboard)
    - window.prompt override (clipboard API fallback)
    - MutationObserver (rewrites visible URLs in DOM inputs/links)
  4. All URLs matching {baseUrl}/s/{TOKEN} are rewritten to {customDomain}/s/{TOKEN}

# Installation
```
  # Symlink or copy to Nextcloud apps directory
  ln -s /path/to/custom_public_share /path/to/nextcloud/apps/custom_public_share

  # Enable the app
  sudo -u www-data php occ app:enable custom_public_share
```