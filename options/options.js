/**
 * Smart Download Router - Options & Rules Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.panel-section');

  // Rules Table & Modal
  const rulesTableBody = document.getElementById('rulesTableBody');
  const addRuleBtn = document.getElementById('addRuleBtn');
  const ruleModal = document.getElementById('ruleModal');
  const modalTitle = document.getElementById('modalTitle');
  const editRuleId = document.getElementById('editRuleId');
  const modalPatternInput = document.getElementById('modalPatternInput');
  const modalFolderInput = document.getElementById('modalFolderInput');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');
  const saveRuleModalBtn = document.getElementById('saveRuleModalBtn');
  const tokenChips = document.querySelectorAll('.token-chip');

  // Remembered Memory Table
  const memoryTableBody = document.getElementById('memoryTableBody');
  const clearAllMemoryBtn = document.getElementById('clearAllMemoryBtn');

  // General Settings
  const settingBaseLocation = document.getElementById('settingBaseLocation');
  const settingGlobalEnabled = document.getElementById('settingGlobalEnabled');
  const settingAlwaysPromptSaveAs = document.getElementById('settingAlwaysPromptSaveAs');
  const settingRememberLocation = document.getElementById('settingRememberLocation');
  const settingAutoDomainFolder = document.getElementById('settingAutoDomainFolder');
  const settingConflictAction = document.getElementById('settingConflictAction');
  const settingDefaultFolder = document.getElementById('settingDefaultFolder');
  const settingShowBadge = document.getElementById('settingShowBadge');
  const savePreferencesBtn = document.getElementById('savePreferencesBtn');
  const modalBasePrefix = document.getElementById('modalBasePrefix');

  // Rule Tester
  const testUrlInput = document.getElementById('testUrlInput');
  const testFilenameInput = document.getElementById('testFilenameInput');
  const runTestBtn = document.getElementById('runTestBtn');
  const testResultDomain = document.getElementById('testResultDomain');
  const testResultBrand = document.getElementById('testResultBrand');
  const testResultReason = document.getElementById('testResultReason');
  const testResultFolder = document.getElementById('testResultFolder');
  const testResultFull = document.getElementById('testResultFull');

  // Backup & Import
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFileInput = document.getElementById('importFileInput');
  const resetDefaultsBtn = document.getElementById('resetDefaultsBtn');
  const toastNotification = document.getElementById('toastNotification');

  let currentSettings = null;

  function showToast(message) {
    toastNotification.textContent = message;
    toastNotification.classList.add('show');
    setTimeout(() => {
      toastNotification.classList.remove('show');
    }, 3000);
  }

  // 1. Navigation handling
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = item.getAttribute('data-target');

      navItems.forEach(nav => nav.classList.remove('active'));
      sections.forEach(sec => sec.classList.remove('active'));

      item.classList.add('active');
      const targetSection = document.getElementById(targetId);
      if (targetSection) targetSection.classList.add('active');
    });
  });

  // 2. Load settings from storage
  async function loadSettings() {
    const data = await chrome.storage.local.get([
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

    currentSettings = {
      enabled: data.enabled !== undefined ? data.enabled : DEFAULT_SETTINGS.enabled,
      baseLocation: data.baseLocation || DEFAULT_SETTINGS.baseLocation,
      alwaysPromptSaveAs: data.alwaysPromptSaveAs !== undefined ? data.alwaysPromptSaveAs : true,
      autoDomainFolder: data.autoDomainFolder !== undefined ? data.autoDomainFolder : DEFAULT_SETTINGS.autoDomainFolder,
      rememberLastLocation: data.rememberLastLocation !== undefined ? data.rememberLastLocation : DEFAULT_SETTINGS.rememberLastLocation,
      conflictAction: data.conflictAction || DEFAULT_SETTINGS.conflictAction,
      showBadge: data.showBadge !== undefined ? data.showBadge : DEFAULT_SETTINGS.showBadge,
      defaultFolder: data.defaultFolder || DEFAULT_SETTINGS.defaultFolder,
      rules: Array.isArray(data.rules) ? data.rules : DEFAULT_SETTINGS.rules,
      rememberedLocations: data.rememberedLocations || DEFAULT_SETTINGS.rememberedLocations,
      recentDownloads: Array.isArray(data.recentDownloads) ? data.recentDownloads : []
    };

    // Populate Settings Controls
    settingBaseLocation.value = currentSettings.baseLocation;
    settingGlobalEnabled.checked = currentSettings.enabled;
    if (settingAlwaysPromptSaveAs) settingAlwaysPromptSaveAs.checked = currentSettings.alwaysPromptSaveAs;
    settingRememberLocation.checked = currentSettings.rememberLastLocation;
    settingAutoDomainFolder.checked = currentSettings.autoDomainFolder;
    settingConflictAction.value = currentSettings.conflictAction;
    settingDefaultFolder.value = currentSettings.defaultFolder;
    settingShowBadge.checked = currentSettings.showBadge;

    renderRulesTable();
    renderMemoryTable();
    runLiveTest();
  }

  // 3. Render Rules Table
  function renderRulesTable() {
    rulesTableBody.innerHTML = '';
    const rules = currentSettings.rules || [];
    const cleanBase = (currentSettings.baseLocation || 'C:\\Users\\KBSV').replace(/[/\\]+$/, '');

    if (rules.length === 0) {
      rulesTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-dim); padding: 24px;">No rules configured. Click "+ Add New Rule" to create one.</td></tr>';
      return;
    }

    rules.forEach((rule, index) => {
      const tr = document.createElement('tr');

      // Pattern cell
      const tdPattern = document.createElement('td');
      const tag = document.createElement('span');
      tag.className = 'pattern-tag';
      tag.textContent = rule.pattern;
      tdPattern.appendChild(tag);

      // Folder cell
      const tdFolder = document.createElement('td');
      const folder = document.createElement('span');
      folder.className = 'folder-path';
      folder.textContent = `${cleanBase}\\${rule.folder.replace(/\//g, '\\')}\\`;
      tdFolder.appendChild(folder);

      // Status cell
      const tdStatus = document.createElement('td');
      const switchLabel = document.createElement('label');
      switchLabel.className = 'switch';
      const switchInput = document.createElement('input');
      switchInput.type = 'checkbox';
      switchInput.checked = rule.enabled !== false;
      const sliderSpan = document.createElement('span');
      sliderSpan.className = 'slider round';

      switchInput.addEventListener('change', async () => {
        rule.enabled = switchInput.checked;
        await chrome.storage.local.set({ rules: currentSettings.rules });
        showToast(rule.enabled ? 'Rule enabled' : 'Rule disabled');
      });

      switchLabel.appendChild(switchInput);
      switchLabel.appendChild(sliderSpan);
      tdStatus.appendChild(switchLabel);

      // Actions cell
      const tdActions = document.createElement('td');
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'actions-cell';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn-icon';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => openEditRuleModal(rule));

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-icon delete';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', async () => {
        currentSettings.rules.splice(index, 1);
        await chrome.storage.local.set({ rules: currentSettings.rules });
        renderRulesTable();
        showToast('Rule deleted');
      });

      actionsDiv.appendChild(editBtn);
      actionsDiv.appendChild(delBtn);
      tdActions.appendChild(actionsDiv);

      tr.appendChild(tdPattern);
      tr.appendChild(tdFolder);
      tr.appendChild(tdStatus);
      tr.appendChild(tdActions);

      rulesTableBody.appendChild(tr);
    });
  }

  // 4. Render Remembered Memory Table
  function renderMemoryTable() {
    memoryTableBody.innerHTML = '';
    const mem = currentSettings.rememberedLocations || {};
    const domains = Object.keys(mem);
    const cleanBase = (currentSettings.baseLocation || 'C:\\Users\\KBSV').replace(/[/\\]+$/, '');

    if (domains.length === 0) {
      memoryTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-dim); padding: 24px;">No remembered domains yet. Sites you download from or set via popup will appear here.</td></tr>';
      return;
    }

    domains.forEach(domain => {
      const folderVal = mem[domain];
      const tr = document.createElement('tr');

      const tdDomain = document.createElement('td');
      const tag = document.createElement('span');
      tag.className = 'pattern-tag';
      tag.textContent = domain;
      tdDomain.appendChild(tag);

      const tdFolder = document.createElement('td');
      const folder = document.createElement('span');
      folder.className = 'folder-path';
      folder.textContent = `${cleanBase}\\${folderVal.replace(/\//g, '\\')}\\`;
      tdFolder.appendChild(folder);

      const tdAction = document.createElement('td');
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'actions-cell';

      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn-icon delete';
      removeBtn.textContent = 'Forget';
      removeBtn.addEventListener('click', async () => {
        delete currentSettings.rememberedLocations[domain];
        await chrome.storage.local.set({ rememberedLocations: currentSettings.rememberedLocations });
        renderMemoryTable();
        showToast(`Cleared memory for ${domain}`);
      });

      actionsDiv.appendChild(removeBtn);
      tdAction.appendChild(actionsDiv);

      tr.appendChild(tdDomain);
      tr.appendChild(tdFolder);
      tr.appendChild(tdAction);

      memoryTableBody.appendChild(tr);
    });
  }

  // 5. Rule Modal Actions
  function openAddRuleModal() {
    const cleanBase = (currentSettings.baseLocation || 'C:\\Users\\KBSV').replace(/[/\\]+$/, '');
    modalBasePrefix.textContent = `${cleanBase}\\`;
    modalTitle.textContent = 'Add Domain Rule';
    editRuleId.value = '';
    modalPatternInput.value = '';
    modalFolderInput.value = '';
    ruleModal.classList.add('show');
    modalPatternInput.focus();
  }

  function openEditRuleModal(rule) {
    const cleanBase = (currentSettings.baseLocation || 'C:\\Users\\KBSV').replace(/[/\\]+$/, '');
    modalBasePrefix.textContent = `${cleanBase}\\`;
    modalTitle.textContent = 'Edit Domain Rule';
    editRuleId.value = rule.id || '';
    modalPatternInput.value = rule.pattern;
    modalFolderInput.value = rule.folder;
    ruleModal.classList.add('show');
    modalFolderInput.focus();
  }

  function closeModal() {
    ruleModal.classList.remove('show');
  }

  addRuleBtn.addEventListener('click', openAddRuleModal);
  closeModalBtn.addEventListener('click', closeModal);
  cancelModalBtn.addEventListener('click', closeModal);

  ruleModal.addEventListener('click', (e) => {
    if (e.target === ruleModal) closeModal();
  });

  tokenChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const token = chip.getAttribute('data-token');
      modalFolderInput.value = modalFolderInput.value ? `${modalFolderInput.value}/${token}` : token;
      modalFolderInput.focus();
    });
  });

  saveRuleModalBtn.addEventListener('click', async () => {
    const pattern = modalPatternInput.value.trim();
    const folder = sanitizeSubfolder(modalFolderInput.value, currentSettings.baseLocation);

    if (!pattern) {
      alert('Please enter a website pattern (e.g. *amazon.*)');
      return;
    }
    if (!folder) {
      alert('Please enter a target subfolder (e.g. costume or Downloads/Amazon)');
      return;
    }

    const ruleId = editRuleId.value;
    if (ruleId) {
      // Edit existing
      const rule = currentSettings.rules.find(r => r.id === ruleId);
      if (rule) {
        rule.pattern = pattern;
        rule.folder = folder;
      }
    } else {
      // Add new
      currentSettings.rules.push({
        id: `rule-${Date.now()}`,
        pattern,
        folder,
        enabled: true
      });
    }

    await chrome.storage.local.set({ rules: currentSettings.rules });
    closeModal();
    renderRulesTable();
    showToast('Rule saved successfully');
  });

  // 6. Clear Memory
  clearAllMemoryBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to forget all remembered domain folders?')) {
      currentSettings.rememberedLocations = {};
      await chrome.storage.local.set({ rememberedLocations: {} });
      renderMemoryTable();
      showToast('All remembered locations cleared');
    }
  });

  // 7. General Preferences Save
  savePreferencesBtn.addEventListener('click', async () => {
    currentSettings.baseLocation = settingBaseLocation.value.trim() || 'C:\\Users\\KBSV';
    currentSettings.enabled = settingGlobalEnabled.checked;
    currentSettings.alwaysPromptSaveAs = settingAlwaysPromptSaveAs ? settingAlwaysPromptSaveAs.checked : true;
    currentSettings.rememberLastLocation = settingRememberLocation.checked;
    currentSettings.autoDomainFolder = settingAutoDomainFolder.checked;
    currentSettings.conflictAction = settingConflictAction.value;
    currentSettings.defaultFolder = sanitizeSubfolder(settingDefaultFolder.value, currentSettings.baseLocation);
    currentSettings.showBadge = settingShowBadge.checked;

    await chrome.storage.local.set({
      baseLocation: currentSettings.baseLocation,
      enabled: currentSettings.enabled,
      alwaysPromptSaveAs: currentSettings.alwaysPromptSaveAs,
      rememberLastLocation: currentSettings.rememberLastLocation,
      autoDomainFolder: currentSettings.autoDomainFolder,
      conflictAction: currentSettings.conflictAction,
      defaultFolder: currentSettings.defaultFolder,
      showBadge: currentSettings.showBadge
    });

    renderRulesTable();
    renderMemoryTable();
    runLiveTest();
    showToast('Settings saved successfully');
  });

  // Junction Generator Logic
  const junctionTargetInput = document.getElementById('junctionTargetInput');
  const junctionAliasInput = document.getElementById('junctionAliasInput');
  const junctionCommandOutput = document.getElementById('junctionCommandOutput');
  const copyJunctionBtn = document.getElementById('copyJunctionBtn');
  const createRuleFromAliasBtn = document.getElementById('createRuleFromAliasBtn');
  const junctionFeedback = document.getElementById('junctionFeedback');

  function updateJunctionCommand() {
    const target = junctionTargetInput.value.trim() || 'D:\\';
    const alias = sanitizeSubfolder(junctionAliasInput.value.trim()) || 'DriveD';
    junctionCommandOutput.textContent = `New-Item -ItemType Junction -Path "$HOME\\Downloads\\${alias}" -Target "${target}"`;
  }

  if (junctionTargetInput && junctionAliasInput) {
    junctionTargetInput.addEventListener('input', updateJunctionCommand);
    junctionAliasInput.addEventListener('input', updateJunctionCommand);
    
    copyJunctionBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(junctionCommandOutput.textContent.trim());
        showToast('PowerShell command copied to clipboard!');
      } catch (err) {
        showToast('Failed to copy');
      }
    });

    createRuleFromAliasBtn.addEventListener('click', () => {
      const alias = sanitizeSubfolder(junctionAliasInput.value.trim()) || 'DriveD';
      openAddRuleModal();
      modalFolderInput.value = alias;
      modalPatternInput.focus();
      junctionFeedback.textContent = `Pre-filled subfolder: ${alias}`;
      setTimeout(() => { junctionFeedback.textContent = ''; }, 3000);
    });
  }

  // 8. Rule Tester
  function runLiveTest() {
    const url = testUrlInput.value.trim();
    const filename = testFilenameInput.value.trim() || 'sample_download.pdf';

    const fakeItem = {
      url,
      referrer: url,
      filename
    };

    const routing = resolveDownloadRouting(fakeItem, url, currentSettings);

    testResultDomain.textContent = routing.sourceDomain || '(None detected)';
    testResultBrand.textContent = routing.brand || '-';
    testResultReason.textContent = routing.reason || 'Default fallback';
    testResultFolder.textContent = routing.subfolder ? `Downloads/${routing.subfolder}/` : 'Downloads/ (Root)';
    testResultFull.textContent = `Downloads/${routing.targetFilename}`;
  }

  runTestBtn.addEventListener('click', runLiveTest);
  testUrlInput.addEventListener('input', runLiveTest);
  testFilenameInput.addEventListener('input', runLiveTest);

  // 9. Export & Import
  exportBtn.addEventListener('click', () => {
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      settings: currentSettings
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-download-router-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Configuration exported');
  });

  importBtn.addEventListener('click', () => {
    importFileInput.click();
  });

  importFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const incoming = parsed.settings || parsed;

      if (!incoming || typeof incoming !== 'object') {
        throw new Error('Invalid configuration format');
      }

      await chrome.storage.local.set(incoming);
      await loadSettings();
      showToast('Configuration imported successfully!');
    } catch (err) {
      alert(`Failed to import configuration: ${err.message}`);
    } finally {
      importFileInput.value = '';
    }
  });

  // 10. Reset Defaults
  resetDefaultsBtn.addEventListener('click', async () => {
    if (confirm('Reset all rules, remembered folders, and preferences to original defaults?')) {
      await chrome.storage.local.clear();
      await chrome.storage.local.set(DEFAULT_SETTINGS);
      await loadSettings();
      showToast('Reset to default settings');
    }
  });

  // Initialize
  await loadSettings();
});
