/**
 * Smart Download Router - Popup Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  const masterToggle = document.getElementById('masterToggle');
  const openOptionsBtn = document.getElementById('openOptionsBtn');
  const currentDomainBadge = document.getElementById('currentDomainBadge');
  const currentFolderInput = document.getElementById('currentFolderInput');
  const saveFolderBtn = document.getElementById('saveFolderBtn');
  const saveFeedback = document.getElementById('saveFeedback');
  const destinationPreview = document.getElementById('destinationPreview');
  const prefRememberLocation = document.getElementById('prefRememberLocation');
  const prefAutoDomainFolder = document.getElementById('prefAutoDomainFolder');
  const recentList = document.getElementById('recentList');
  const clearRecentBtn = document.getElementById('clearRecentBtn');
  const manageRulesBtn = document.getElementById('manageRulesBtn');

  let currentDomain = '';
  let activeTabUrl = '';

  // 1. Detect active tab & domain
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      activeTabUrl = tab.url;
      currentDomain = extractHostname(tab.url);
    }
  } catch (err) {
    console.error('Failed to query active tab', err);
  }

  if (currentDomain) {
    currentDomainBadge.textContent = currentDomain;
    currentDomainBadge.title = activeTabUrl;
  } else {
    currentDomainBadge.textContent = 'Browser / System Page';
    currentFolderInput.disabled = true;
    saveFolderBtn.disabled = true;
    destinationPreview.textContent = 'Standard Downloads folder';
  }

  // 2. Load stored settings
  const settings = await chrome.storage.local.get([
    'enabled',
    'baseLocation',
    'autoDomainFolder',
    'rememberLastLocation',
    'rules',
    'rememberedLocations',
    'recentDownloads'
  ]);

  const baseLocation = settings.baseLocation || DEFAULT_SETTINGS.baseLocation;
  const enabled = settings.enabled !== undefined ? settings.enabled : DEFAULT_SETTINGS.enabled;
  const rememberLastLocation = settings.rememberLastLocation !== undefined ? settings.rememberLastLocation : DEFAULT_SETTINGS.rememberLastLocation;
  const autoDomainFolder = settings.autoDomainFolder !== undefined ? settings.autoDomainFolder : DEFAULT_SETTINGS.autoDomainFolder;
  const rememberedLocations = settings.rememberedLocations || DEFAULT_SETTINGS.rememberedLocations;
  const rules = settings.rules || DEFAULT_SETTINGS.rules;
  const recentDownloads = settings.recentDownloads || [];

  masterToggle.checked = enabled;
  prefRememberLocation.checked = rememberLastLocation;
  prefAutoDomainFolder.checked = autoDomainFolder;

  // 3. Resolve initial folder for current domain
  let initialFolder = '';
  if (currentDomain) {
    // Check remembered
    if (rememberedLocations[currentDomain]) {
      initialFolder = rememberedLocations[currentDomain];
    } else {
      // Check explicit rules
      const matchedRule = rules.find(r => r.enabled && matchGlobPattern(r.pattern, currentDomain));
      if (matchedRule) {
        initialFolder = matchedRule.folder;
      } else if (autoDomainFolder) {
        initialFolder = `Downloads/${domainToBrandName(currentDomain)}`;
      }
    }

    currentFolderInput.value = initialFolder;
    updatePreview(initialFolder);
  }

  function updatePreview(folder) {
    const cleanBase = baseLocation.replace(/[/\\]+$/, '');
    const clean = sanitizeSubfolder(folder, baseLocation);
    if (clean) {
      destinationPreview.textContent = `${cleanBase}\\${clean.replace(/\//g, '\\')}\\<filename>`;
    } else {
      destinationPreview.textContent = `${cleanBase}\\<filename>`;
    }
  }

  currentFolderInput.addEventListener('input', () => {
    updatePreview(currentFolderInput.value);
  });

  // 4. Save Folder for Current Domain
  saveFolderBtn.addEventListener('click', async () => {
    if (!currentDomain) return;

    const rawFolder = currentFolderInput.value.trim();
    const cleanFolder = sanitizeSubfolder(rawFolder, baseLocation);
    currentFolderInput.value = cleanFolder;
    updatePreview(cleanFolder);

    const data = await chrome.storage.local.get(['rememberedLocations', 'rules']);
    const updatedRemembered = { ...(data.rememberedLocations || {}) };

    if (cleanFolder) {
      updatedRemembered[currentDomain] = cleanFolder;
    } else {
      delete updatedRemembered[currentDomain];
    }

    await chrome.storage.local.set({ rememberedLocations: updatedRemembered });

    const cleanBase = baseLocation.replace(/[/\\]+$/, '');
    saveFeedback.textContent = cleanFolder 
      ? `Saved! Files will download to ${cleanBase}\\${cleanFolder.replace(/\//g, '\\')}\\`
      : `Reset to ${cleanBase}\\`;
    
    setTimeout(() => {
      saveFeedback.textContent = '';
    }, 3500);
  });

  currentFolderInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      saveFolderBtn.click();
    }
  });

  // 5. Toggles
  masterToggle.addEventListener('change', async () => {
    await chrome.storage.local.set({ enabled: masterToggle.checked });
  });

  prefRememberLocation.addEventListener('change', async () => {
    await chrome.storage.local.set({ rememberLastLocation: prefRememberLocation.checked });
  });

  prefAutoDomainFolder.addEventListener('change', async () => {
    await chrome.storage.local.set({ autoDomainFolder: prefAutoDomainFolder.checked });
  });

  // 6. Recent Downloads List
  function renderRecent(list) {
    if (!list || list.length === 0) {
      recentList.innerHTML = '<div class="empty-state">No downloads recorded yet.</div>';
      return;
    }

    recentList.innerHTML = '';
    list.slice(0, 5).forEach(item => {
      const el = document.createElement('div');
      el.className = 'recent-item';

      const info = document.createElement('div');
      info.className = 'recent-info';

      const name = document.createElement('span');
      name.className = 'recent-filename';
      name.textContent = item.filename;
      name.title = item.filename;

      const meta = document.createElement('div');
      meta.className = 'recent-meta';

      const folder = document.createElement('span');
      folder.className = 'recent-folder';
      folder.textContent = item.subfolder ? `/${item.subfolder}` : '/';

      const domain = document.createElement('span');
      domain.textContent = item.domain || '';

      meta.appendChild(folder);
      meta.appendChild(domain);

      info.appendChild(name);
      info.appendChild(meta);

      el.appendChild(info);
      recentList.appendChild(el);
    });
  }

  renderRecent(recentDownloads);

  clearRecentBtn.addEventListener('click', async () => {
    await chrome.storage.local.set({ recentDownloads: [] });
    renderRecent([]);
  });

  // 7. Navigation
  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  openOptionsBtn.addEventListener('click', openSettings);
  manageRulesBtn.addEventListener('click', openSettings);
});
