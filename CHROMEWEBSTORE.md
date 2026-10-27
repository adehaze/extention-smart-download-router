# Chrome Web Store & Edge Add-ons Listing — Smart Download Router

> Last Updated: 2026-10-27

## Store Listing

**Extension Name** [REQUIRED]
Smart Download Router - Domain & Subfolder Organizer

**Short Description** [REQUIRED]
Auto-organizes downloads into smart subfolders based on website origin, domain rules, and remembered save locations.

**Detailed Description** [REQUIRED]
Tired of every downloaded file piling up in a messy, disorganized Downloads folder?

Smart Download Router extends your browser's download manager by automatically routing downloaded files into dedicated, clean subfolders based on the website you are visiting, your custom domain rules, and your last-saved preferences.

When you download an ebook or invoice from Amazon, it automatically routes to your "Downloads/Amazon" folder. When you download a historical document or media file from archive.org, it automatically routes to "Downloads/Archive". Download from GitHub? Instantly saved in "Downloads/GitHub".

KEY FEATURES

• Domain & Website Memory: Remembers the last folder you chose for each website. Change a site's folder once in the popup, and all future downloads from that site automatically route there.
• Custom Domain Rules: Create flexible wildcard patterns (e.g. *amazon.*, *.archive.org, *.nature.com) to route downloads into custom subfolder structures.
• Subfolder Hierarchy & Templates: Organize by subdirectories (e.g. Amazon/Kindle, Invoices/2026) with built-in dynamic tokens like {brand}, {year}, {month}, and {ext}.
• Works with Native Browser Settings: Seamlessly works whether you keep "Ask where to save each file" turned ON (pre-filling the dialog's save path) or turned OFF (for instant silent auto-routing).
• 1-Click Popup Controls: Instantly see what website you are on, view or change its destination folder, and view your recent download history.
• Backup & Portability: Easily export and import your custom rules and domain folder preferences as JSON.
• 100% Private & Offline: Operates entirely on your device. Zero telemetry, zero analytics, zero data collection.

HOW TO USE IT

1. Click the Smart Download Router icon in your toolbar while visiting any website.
2. Enter the subfolder name you want downloads from this site to go into (e.g. "Amazon" or "Archive/Books").
3. Click "Set".
4. Any file you download from that site will now automatically be organized into that subfolder inside your Downloads directory!
5. Open the Options page anytime to add advanced wildcard rules or test URL routing in real-time.

PRIVACY & PERMISSIONS

Smart Download Router requires only three essential permissions:
- Downloads: To suggest destination subfolders inside your Downloads folder when files are saved.
- Storage: To save your domain rules and folder preferences locally on your computer.
- Tabs: To identify the active website domain when direct download links or CDNs do not include referrer information.

Smart Download Router does NOT track your browsing history, does NOT collect personal data, and NEVER sends information over the internet.

**Category** [REQUIRED]
Productivity

**Single Purpose** [REQUIRED]
Automatically organizes downloaded files into domain-based subfolders inside the browser's downloads directory.

**Primary Language** [REQUIRED]
English

---

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | `icons/icon-128.png` |
| Small Icon | 16×16, 32×32, 48×48 PNG | ✅ Ready | `icons/icon-16.png`, `32`, `48` |
| Screenshot 1 [REQUIRED] | 1280×800 | ⬜ Ready to capture | Options Page — Rules Manager & Live Path Tester |
| Screenshot 2 [RECOMMENDED] | 1280×800 | ⬜ Ready to capture | Popup Menu — Active Domain Folder & 1-Click Set |
| Screenshot 3 [RECOMMENDED] | 1280×800 | ⬜ Ready to capture | Remembered Locations Table & Token Templates |
| Small Promo Tile [RECOMMENDED] | 440×280 | ⬜ Optional | Promo banner |
| Marquee Promo Tile | 1400×560 | ⬜ Optional | Marquee banner |

---

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `downloads` | permissions | Required to inspect incoming downloads and suggest target subfolders inside the user's default Downloads directory via the `chrome.downloads.onDeterminingFilename` API. |
| `storage` | permissions | Required to persist user domain rules, remembered last-saved folders per website, and user preferences locally in browser storage. |
| `tabs` | permissions | Required to read the URL of the active tab at the moment a download begins, ensuring the originating domain is correctly identified when CDN links or blob downloads lack a referrer header. |

---

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No

All operations, domain parsing, and folder mappings occur 100% on-device in `chrome.storage.local`. No information is collected, transmitted, or shared.

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Personally identifiable info | No | No | N/A | No |
| Health info | No | No | N/A | No |
| Financial info | No | No | N/A | No |
| Authentication info | No | No | N/A | No |
| Personal communications | No | No | N/A | No |
| Location | No | No | N/A | No |
| Web history | No | No | N/A | No |
| User activity | No | No | N/A | No |
| Website content | No | No | N/A | No |

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

---

## Privacy Policy

Host the following text at a public URL (e.g. GitHub Pages or personal website):

```markdown
# Privacy Policy for Smart Download Router

Last updated: October 27, 2026

Smart Download Router ("the extension") is committed to protecting your privacy.

1. Data Collection and Storage
Smart Download Router does not collect, transmit, sell, or share any personal information, browsing history, or download content. All settings, custom domain rules, and remembered save locations are stored locally on your device using the browser's `chrome.storage.local` API.

2. Permissions Used
- `downloads`: Used exclusively to suggest subfolders inside your Downloads directory when you initiate a download.
- `storage`: Used to save your routing rules and preferences locally on your computer.
- `tabs`: Used solely to detect the active website origin when files are downloaded from servers or CDNs that omit HTTP referrer headers.

3. Third-Party Services
Smart Download Router does not integrate with any external APIs, analytics platforms, or third-party servers.

4. Contact
For questions or support regarding this privacy policy, please open an issue on the project's GitHub repository.
```

---

## Distribution

- **Visibility**: Public
- **Regions**: All regions
- **Store Portals**:
  - Chrome Web Store Developer Dashboard: https://chrome.google.com/webstore/devconsole
  - Microsoft Edge Partner Center (Edge Add-ons): https://partner.microsoft.com/dashboard/microsoftedge

---

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0.0 | 2026-10-27 | Initial store-ready release with domain awareness, last-saved location memory, wildcard rules, and interactive tester. | Draft |
