# Smart Download Router

> It is straightforward and satisfying to audit and download files into their designated folders, until a client message pops up asking you to revise a PDF or edit a video. You download their file, navigate away to their folder, and finish the request. But when you return to your previous work and download the next file, your browser has completely forgotten your location, forcing you to browse folder trees all over again.
> 
> You do not need a bloated download manager or a complex configuration system. You just want a simple "Save As" that remembers where files belong based on the website you are on.

---

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-success?style=flat-square)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Compatible with Edge & Chrome](https://img.shields.io/badge/Browser-Edge%20%7C%20Chrome-blue?style=flat-square)](#quick-install-guide-load-unpacked-in-30-seconds)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Zero Telemetry](https://img.shields.io/badge/Privacy-Zero%20External%20Calls-brightgreen?style=flat-square)](#privacy--permissions)

---

## The Problem This Solves

If you regularly download files from multiple websites (auditing documents, managing client orders, archiving code repositories, saving media from WhatsApp Web, etc.), default Chromium browser behavior causes constant friction:

1. **Global "Last Used Folder" Overwrites:** Every time you download a file from a different website or client link, Windows and Edge overwrite your last-saved folder globally. When you switch back to your primary site, you have to manually browse through folder trees all over again.
2. **Missing Manual Renaming with Auto-Download:** If the browser downloads files automatically, it uses generic default filenames (such as `download (1).zip` or long hash strings), requiring you to open File Explorer later to find and rename each file.
3. **The Floating Download Bar:** Modern Edge often pops up a small `[ Open | Save as | Save ]` floating toolbar at the top right instead of immediately launching the native Windows file picker.

**Smart Download Router fixes this directly:**
- When you click download on any website, the **native Windows "Save As" dialog opens immediately**.
- It opens **already inside that domain's designated folder** (for example, `C:\Downloads\Archive\`).
- The original filename is **pre-filled and highlighted** so you can immediately type your custom name, press <kbd>Enter</kbd>, and continue working.

---

## Features

- **Domain Origin Routing:** Route downloads automatically based on the website origin (e.g., `github.com` &rarr; `Downloads/Archive`, `web.whatsapp.com` &rarr; `WhatsApp`, `amazon.com` &rarr; `Downloads/Amazon`).
- **Instant Native "Save As" Dialog:** Automatically triggers the native Windows file picker inside the target folder with the filename highlighted for manual renaming.
- **Domain Memory:** Automatically remembers the folder you last used for each website.
- **1-Click Popup:** Click the extension icon on any active tab to view the detected domain and assign a destination folder in one click.
- **Wildcard & Pattern Rules:** Create advanced rules using wildcards (e.g., `*archive.org*`, `*client-portal*`, `*.gov`).
- **Dynamic Template Tokens:** Structure paths dynamically using `{domain}`, `{brand}`, `{year}`, `{month}`, `{date}`, and `{ext}` (e.g., `Downloads/{brand}/{year}/`).
- **Cross-Drive Routing (Windows Junctions):** Save to `D:\`, `E:\`, or network drives while completely respecting Chromium's security sandbox.
- **100% Local & Private:** No analytics, no telemetry, no remote scripts, and zero external network requests. All data is stored locally via `chrome.storage.local`.

---

## Quick Install Guide (Load Unpacked in 30 Seconds)

Because this extension is for personal and open-source use, you do not need to pay any Chrome Web Store or Microsoft Edge partner developer fees. You can install it directly in developer mode:

### 1. In Microsoft Edge:
1. Open Edge and enter `edge://extensions` in the address bar.
2. Turn ON the **Developer mode** toggle at the bottom of the left sidebar.
3. Click the **Load unpacked** button at the top.
4. Select the folder containing this repository (`smart-download-router`).
5. Pin **Download Router** to your toolbar for easy access.

### 2. In Google Chrome:
1. Open Chrome and enter `chrome://extensions` in the address bar.
2. Turn ON the **Developer mode** toggle in the top-right corner.
3. Click the **Load unpacked** button in the top-left corner.
4. Select the folder containing this repository.
5. Pin **Download Router** to your toolbar.

---

## Recommended Configuration

### Step 1: Base Download Location in Edge/Chrome
Chromium extensions route subfolders relative to your browser's primary download location:

1. Open Edge Settings &rarr; **Downloads** (`edge://settings/downloads`).
2. Set **Location** to your preferred base drive or directory (for example: `C:\` or `C:\Users\<YourUser>\Downloads`).
3. Make sure **"Ask where to save each file before downloading"** is **OFF** (the extension handles opening the Save As dialog directly in the correct folder for you).

### Step 2: Set the Base Location in the Extension
1. Right-click the extension icon &rarr; **Extension options** (or click **Open Full Rules & Settings Manager** in the popup).
2. In **Global Settings**, set your **Base Download Root** to match what you configured in your browser (e.g., `C:\`).
3. Ensure **"Always open Windows 'Save As' dialog"** is checked.
4. Click **Save Settings**.

---

## How to Route to Other Drives (D:\, E:\, etc.)

Chromium extensions are sandboxed by browser security rules and cannot directly write `..` or traverse across drive letters outside the base drive. 

To route files to `D:\`, `E:\`, or custom directories like `C:\client-docs`, use native **Windows Directory Junctions**:

1. Open PowerShell and run:
   ```powershell
   # Example: Route "C:\Downloads\DriveD" to physical "D:\"
   New-Item -ItemType Junction -Path "C:\Downloads\DriveD" -Target "D:\"

   # Example: Route "C:\Downloads\Costume" to physical "C:\user\costume"
   New-Item -ItemType Junction -Path "C:\Downloads\Costume" -Target "C:\user\costume"
   ```
2. In the extension rule or popup, set the folder to `Downloads/DriveD` or `Downloads/Costume`.
3. Windows will physically save the files directly onto `D:\` or `C:\user\costume\` with zero security errors.

*(A 1-click PowerShell junction generator is also built into the **Options &rarr; D: & Custom Drives** tab).*

---

## How to Use

### 1. Setting a Folder for the Current Website
When visiting any website (e.g., `github.com`):
1. Click the **Download Router** icon in your browser toolbar.
2. Type your desired folder (e.g., `Downloads/Archive`) in the input box.
3. Click **Set**.
4. The full path preview will show the exact target directory on your computer.

### 2. Downloading & Renaming Files
1. Click **Download** on any file or link.
2. The native Windows **Save As** dialog pops open directly inside the assigned folder.
3. The filename is pre-filled and highlighted.
4. Type your desired name, press <kbd>Enter</kbd>, and the file is saved in the right folder.

---

## Privacy & Permissions

This extension requests minimal permissions required to manage file downloads:
- `downloads`: To intercept download requests and route them to target subfolders.
- `storage`: To store your rules and remembered domain folders locally.
- `tabs`: To detect the domain of the active tab for single-page applications or CDN links.

No remote analytics, no telemetry, no tracking, and zero external API calls.

---

## License

This project is licensed under the [MIT License](LICENSE).
