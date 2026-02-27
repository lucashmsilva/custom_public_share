# custom_public_share

A Nextcloud app that rewrites public share URLs to use a custom domain. Useful when Nextcloud runs on an internal domain that is unreachable from the internet: the app substitutes a configured external domain into every share link shown in the UI and into share notification emails, without touching Nextcloud's database or server-side URL generation.

## Problem

Nextcloud builds public share links using the server's own base URL (e.g. `https://files.internal.example.com`). When that domain is not reachable from the internet, links copied by users or sent in share-by-email notifications are broken for external recipients. This app transparently replaces the internal domain with an internet-facing one at the point where links are presented to the user or included in emails.

## How it Works

### Admin configuration

An admin enters a custom domain (e.g. `https://share.example.com`) in **Settings → Sharing → Custom Public Share Domain**. The value is stored with `IConfig::setAppValue` and validated to be a well-formed `http`/`https` URL.

### Frontend link rewriting

When a user opens the Files app, `LoadAdditionalScriptsListener` listens to `LoadAdditionalScriptsEvent` and:

1. Reads the stored custom domain from `IConfig`.
2. Injects it into the page via `IInitialState` under the key `custom_public_share/custom_domain`.
3. Loads the compiled script `custom_public_share-public-share-rewrite.js`.

The script (`src/public-share-rewrite.js`) runs in the browser and intercepts share URLs through three complementary strategies:

| Strategy | Mechanism | What it covers |
|---|---|---|
| Clipboard override | `navigator.clipboard.writeText` is wrapped to rewrite the text before it reaches the clipboard | "Copy link" button |
| Prompt override | `window.prompt` is wrapped to rewrite its `value` argument | Fallback clipboard path used by some browsers |
| MutationObserver | Watches the DOM for newly added nodes and `value` attribute changes; rewrites matching `<input>` values and `<a href>` attributes | Link displayed in the sharing panel |

All three strategies apply the same rewrite rule: any substring matching `{baseUrl}[/index.php]/s/{TOKEN}` is replaced with `{customDomain}/s/TOKEN`.

### Email link rewriting

When a user shares a file via email ("External shares" in the sharing panel), Nextcloud's `sharebymail` app sends a notification email whose body contains the internal share URL. `EmailShareRewriteListener` listens to `OCP\Mail\Events\BeforeMessageSent` and rewrites the URL in the email before it is dispatched:

1. Reads the stored custom domain.
2. Accesses the underlying Symfony `Email` object via `getSymfonyEmail()` on the `OC\Mail\Message` instance (NC 30+).
3. Applies the same `{baseUrl}[/index.php]/s/{TOKEN}` → `{customDomain}/s/{TOKEN}` substitution to both the HTML body and the plain-text body.

The listener is intentionally broad (it fires for every outgoing email) but has no effect on emails that do not contain a matching share URL.

## File Structure

```
custom_public_share/
├── appinfo/
│   ├── info.xml                                    # App metadata (NC 30–33, namespace CustomPublicShare)
│   └── routes.php                                  # GET /settings, POST /settings
├── lib/
│   ├── AppInfo/
│   │   └── Application.php                         # IBootstrap — registers both event listeners
│   ├── Controller/
│   │   └── SettingsController.php                  # get() and save() actions, URL validation
│   ├── Listener/
│   │   ├── LoadAdditionalScriptsListener.php        # Injects initial state + loads rewrite script
│   │   └── EmailShareRewriteListener.php            # Rewrites share URLs in outgoing emails
│   └── Settings/
│       └── Admin.php                               # ISettings, section "sharing", priority 90
├── templates/
│   └── admin.php                                   # Settings form (input[type=url] + Save button)
├── css/
│   └── admin.css                                   # Admin form styles
├── src/
│   ├── admin.js                                    # POSTs form data via @nextcloud/axios
│   └── public-share-rewrite.js                     # Clipboard / prompt / MutationObserver rewriting
├── js/                                             # Webpack build output (committed)
│   ├── custom_public_share-admin.js
│   └── custom_public_share-public-share-rewrite.js
├── package.json
└── webpack.config.js                               # Two entry points: admin, public-share-rewrite
```

## Installation

```bash
# Place the app in Nextcloud's apps directory
ln -s /path/to/custom_public_share /path/to/nextcloud/apps/custom_public_share

# Enable the app
sudo -u www-data php occ app:enable custom_public_share
```

## Configuration

1. Go to **Settings → Administration → Sharing**.
2. Find the **Custom Public Share Domain** section.
3. Enter the full URL of your external domain, e.g. `https://share.example.com`.
4. Click **Save**.

To revert to default behaviour, clear the field and save.

The external domain must point to a reverse proxy that forwards `/s/{TOKEN}` requests to the internal Nextcloud server. Configuring that proxy is outside the scope of this app.

## Building from Source

Node 18+ is required.

```bash
npm install
npm run build
```

Built files are written to `js/`. The two entry points are:

- `src/admin.js` → `js/custom_public_share-admin.js`
- `src/public-share-rewrite.js` → `js/custom_public_share-public-share-rewrite.js`

## Compatibility

- Nextcloud 30–33
- PHP 8.1+
- The email rewriting relies on `OC\Mail\Message::getSymfonyEmail()`, which is available in NC 30+. On older versions the email listener exits without modifying the message.
