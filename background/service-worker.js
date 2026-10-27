/**
 * Smart Download Router - Background Service Worker (Manifest V3)
 * Intercepts download events, routes files into domain-aware subfolders,
 * forces the native Windows "Save As" dialog in the target folder for manual renaming,
 * and automatically remembers where you save files for each website.
 */

importScripts('../shared/utils.js');

/**
 * Fetch settings from storage with defaults fallback.
 */
async function getStoredSettings() {
  const result = await chrome.storage.local.get([
    'enabled',
    'baseLocation',
    'alwaysPromptSaveAs',
    'autoDomainFolder',
    'rememberLastLocation',
    'conflictAction',
    'showBadge',
    'defaultFolder',
    'rules',
    'rememberedLocations',
    'recentDownloads'
  ]);

  return {
    enabled: result.enabled !== undefined ? result.enabled : DEFAULT_SETTINGS.enabled,
    baseLocation: result.baseLocation || DEFAULT_SETTINGS.baseLocation,
    alwaysPromptSaveAs: result.alwaysPromptSaveAs !== undefined ? result.alwaysPromptSaveAs : true,
    autoDomainFolder: result.autoDomainFolder !== undefined ? result.autoDomainFolder : DEFAULT_SETTINGS.autoDomainFolder,
    rememberLastLocation: result.rememberLastLocation !== undefined ? result.rememberLastLocation : DEFAULT_SETTINGS.rememberLastLocation,
    conflictAction: result.conflictAction || DEFAULT_SETTINGS.conflictAction,
    showBadge: result.showBadge !== undefined ? result.showBadge : DEFAULT_SETTINGS.showBadge,
    defaultFolder: result.defaultFolder || DEFAULT_SETTINGS.defaultFolder,
    rules: Array.isArray(result.rules) ? result.rules : DEFAULT_SETTINGS.rules,
    rememberedLocations: result.rememberedLocations || DEFAULT_SETTINGS.rememberedLocations,
    recentDownloads: Array.isArray(result.recentDownloads) ? result.recentDownloads : []
  };
}

/**
 * In-memory map of active downloads to domain for quick lookup
 */
const activeDownloadDomains = new Map();

/**
 * Map of download IDs initiated by the extension with saveAs: true -> targetFilename
 */
const forcedPromptMap = new Map();

/**
 * Fallback mapping of URLs to targetFilename to prevent race conditions
 * where onDeterminingFilename fires before the chrome.downloads.download() promise resolves.
 */
const pendingForcedByUrl = new Map();

/**
 * Initialize defaults upon extension install or update.
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  const existing = await chrome.storage.local.get('enabled');
  if (existing.enabled === undefined) {
    await chrome.storage.local.set(DEFAULT_SETTINGS);
  }
});

/**
 * Main Download Filename Interception Event
 */
chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  (async () => {
    try {
      // Check if this download is one forced by our extension with saveAs: true
      let forcedTarget = forcedPromptMap.get(item.id);
      if (!forcedTarget && pendingForcedByUrl.has(item.url)) {
        forcedTarget = pendingForcedByUrl.get(item.url);
        pendingForcedByUrl.delete(item.url);
      }
      if (!forcedTarget && item.byExtensionId === chrome.runtime.id) {
        forcedTarget = item.filename;
      }

      if (forcedTarget) {
        forcedPromptMap.delete(item.id);
        const settings = await getStoredSettings();
        // IMPORTANT: Must suggest the targetFilename with subfolder!
        // An empty suggest() causes Chromium to discard the filename and reset to default directory.
        suggest({
          filename: forcedTarget,
          conflictAction: settings.conflictAction || 'uniquify'
        });
        return;
      }

      const settings = await getStoredSettings();

      if (!settings.enabled) {
        suggest();
        return;
      }

      // Query active tab URL if available to resolve origin for blob/data/cdn downloads
      let activeTabUrl = '';
      try {
        const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (activeTab && activeTab.url) {
          activeTabUrl = activeTab.url;
        }
      } catch (e) {
        // Active tab query might fail if user closed tab rapidly; continue gracefully
      }

      const routing = resolveDownloadRouting(item, activeTabUrl, settings);
      const domain = routing.sourceDomain;

      // Track domain for this download ID so onChanged can remember it
      if (domain && item.id) {
        activeDownloadDomains.set(item.id, domain);
      }

      if (routing.subfolder) {
        // If remembering last location is enabled, persist this folder for the domain
        if (settings.rememberLastLocation && domain) {
          const currentRemembered = { ...(settings.rememberedLocations || {}) };
          if (currentRemembered[domain] !== routing.subfolder) {
            currentRemembered[domain] = routing.subfolder;
            await chrome.storage.local.set({ rememberedLocations: currentRemembered });
          }
        }

        // Record in recent downloads
        const recentItem = {
          id: item.id,
          filename: routing.cleanFilename,
          targetFilename: routing.targetFilename,
          subfolder: routing.subfolder,
          domain: domain || 'Direct',
          reason: routing.reason,
          timestamp: Date.now(),
          fileSize: item.fileSize || item.totalBytes || 0,
          url: item.url
        };

        const updatedRecent = [recentItem, ...(settings.recentDownloads || [])].slice(0, 30);
        await chrome.storage.local.set({ recentDownloads: updatedRecent });

        // Visual indicator on the extension badge
        if (settings.showBadge) {
          try {
            await chrome.action.setBadgeText({ text: '✓' });
            await chrome.action.setBadgeBackgroundColor({ color: '#2563eb' });
            setTimeout(async () => {
              try {
                await chrome.action.setBadgeText({ text: '' });
              } catch (_) {}
            }, 3000);
          } catch (_) {}
        }

        // If the user needs the Windows "Save As" dialog to manually rename files,
        // re-trigger the download with saveAs: true.
        // This forces Windows to open the dialog PRE-POPULATED directly inside the target folder!
        if (settings.alwaysPromptSaveAs) {
          try {
            // Register URL in pending map before starting download to prevent race condition
            pendingForcedByUrl.set(item.url, routing.targetFilename);

            const newId = await chrome.downloads.download({
              url: item.url,
              filename: routing.targetFilename,
              saveAs: true // Forces the native Windows Save As dialog pre-filled in the target folder!
            });

            if (newId) {
              forcedPromptMap.set(newId, routing.targetFilename);
              pendingForcedByUrl.delete(item.url);
              if (domain) {
                activeDownloadDomains.set(newId, domain);
              }
              // Cancel and clean up the original silent download
              try {
                await chrome.downloads.cancel(item.id);
                await chrome.downloads.erase({ id: item.id });
              } catch (_) {}
              suggest();
              return;
            }
          } catch (reErr) {
            console.warn('Smart Download Router: Fallback to suggest on re-download error:', reErr);
            pendingForcedByUrl.delete(item.url);
          }
        }

        // Silent download fallback if alwaysPromptSaveAs is false
        suggest({
          filename: routing.targetFilename,
          conflictAction: settings.conflictAction || 'uniquify'
        });
        return;
      }

      // No subfolder routing match, proceed with standard filename
      suggest({
        filename: routing.cleanFilename,
        conflictAction: settings.conflictAction || 'uniquify'
      });
    } catch (error) {
      console.error('Smart Download Router: Error during filename determination', error);
      suggest();
    }
  })();

  // Keep suggestion channel open for async execution
  return true;
});

/**
 * Listen for user saving files in the "Save As" dialog
 * Automatically learns and remembers where the user saved the file for that domain!
 */
chrome.downloads.onChanged.addListener((delta) => {
  (async () => {
    try {
      if (!delta.filename || !delta.filename.current) return;

      const settings = await getStoredSettings();
      if (!settings.rememberLastLocation) return;

      const fullSavedPath = delta.filename.current;
      let domain = activeDownloadDomains.get(delta.id);

      if (!domain) {
        try {
          const items = await chrome.downloads.search({ id: delta.id });
          if (items && items.length > 0) {
            const item = items[0];
            domain = extractHostname(item.referrer) || extractHostname(item.url);
          }
        } catch (_) {}
      }

      if (!domain) return;

      const lastSlashIdx = Math.max(fullSavedPath.lastIndexOf('\\'), fullSavedPath.lastIndexOf('/'));
      if (lastSlashIdx <= 0) return;

      const savedDir = fullSavedPath.substring(0, lastSlashIdx);
      const cleanSubfolder = sanitizeSubfolder(savedDir, settings.baseLocation);

      if (cleanSubfolder) {
        const remembered = { ...(settings.rememberedLocations || {}) };
        if (remembered[domain] !== cleanSubfolder) {
          remembered[domain] = cleanSubfolder;
          const root = getRootDomain(domain);
          if (root && root !== domain) {
            remembered[root] = cleanSubfolder;
          }
          await chrome.storage.local.set({ rememberedLocations: remembered });
          console.log(`Auto-learned: files from ${domain} now save to ${cleanSubfolder}`);
        }
      }
    } catch (err) {
      console.error('Error in onChanged auto-learning:', err);
    }
  })();
});

/**
 * Handle runtime messages from Popup and Options pages
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      if (message.action === 'getSettings') {
        const settings = await getStoredSettings();
        sendResponse({ success: true, settings });
        return;
      }

      if (message.action === 'setDomainFolder') {
        const { domain, folder } = message;
        if (!domain) {
          sendResponse({ success: false, error: 'Domain required' });
          return;
        }

        const settings = await getStoredSettings();
        const cleanFolder = sanitizeSubfolder(folder, settings.baseLocation);
        const updatedRemembered = { ...settings.rememberedLocations };
        
        if (cleanFolder) {
          updatedRemembered[domain] = cleanFolder;
          const root = getRootDomain(domain);
          if (root && root !== domain) {
            updatedRemembered[root] = cleanFolder;
          }
        } else {
          delete updatedRemembered[domain];
        }

        await chrome.storage.local.set({ rememberedLocations: updatedRemembered });
        sendResponse({ success: true, cleanFolder });
        return;
      }

      if (message.action === 'testRouting') {
        const { testUrl, filename } = message;
        const settings = await getStoredSettings();
        const fakeItem = {
          url: testUrl,
          referrer: testUrl,
          filename: filename || 'document.pdf'
        };
        const result = resolveDownloadRouting(fakeItem, testUrl, settings);
        sendResponse({ success: true, result });
        return;
      }

      sendResponse({ success: false, error: 'Unknown action' });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  })();

  return true;
});
