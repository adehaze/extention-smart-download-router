/**
 * Smart Download Router - Shared Utilities
 * Handles domain parsing, path sanitization, and routing rule resolution.
 */

const DEFAULT_SETTINGS = {
  enabled: true,
  baseLocation: 'C:\\Users\\KBSV',
  alwaysPromptSaveAs: true,
  autoDomainFolder: true,
  rememberLastLocation: true,
  conflictAction: 'uniquify', // 'uniquify' | 'prompt' | 'overwrite'
  showBadge: true,
  defaultFolder: '',
  rules: [
    { id: 'rule-amazon', pattern: '*amazon.*', folder: 'Downloads/Amazon', enabled: true },
    { id: 'rule-archive', pattern: '*archive.org*', folder: 'Downloads/Archive', enabled: true },
    { id: 'rule-costume', pattern: '*costume*', folder: 'costume', enabled: true }
  ],
  rememberedLocations: {
    'amazon.com': 'Downloads/Amazon',
    'archive.org': 'Downloads/Archive',
    'web.archive.org': 'Downloads/Archive'
  },
  recentDownloads: []
};

/**
 * Extract clean hostname from a URL string.
 * Supports standard HTTP/HTTPS, blob: URLs (used by WhatsApp, Telegram, Google Drive),
 * and strips common leading prefixes.
 */
function extractHostname(url) {
  if (!url || typeof url !== 'string') return '';
  try {
    let cleanUrl = url.trim();
    if (cleanUrl.startsWith('blob:')) {
      cleanUrl = cleanUrl.slice(5);
    }
    const parsed = new URL(cleanUrl);
    if (!['http:', 'https:', 'ftp:'].includes(parsed.protocol)) {
      return '';
    }
    let host = parsed.hostname.toLowerCase();
    // Strip common leading subdomains
    if (host.startsWith('www.')) host = host.slice(4);
    if (host.startsWith('m.')) host = host.slice(2);
    return host;
  } catch {
    return '';
  }
}

/**
 * Extract root/apex domain from hostname.
 * e.g. "codeload.github.com" -> "github.com", "web.whatsapp.com" -> "whatsapp.com"
 */
function getRootDomain(hostname) {
  if (!hostname || typeof hostname !== 'string') return '';
  const parts = hostname.toLowerCase().split('.');
  if (parts.length <= 2) return hostname;
  const secondToLast = parts[parts.length - 2];
  if (['co', 'com', 'org', 'net', 'edu', 'gov'].includes(secondToLast) && parts.length > 2) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

/**
 * Generate a friendly human-readable brand name from a domain.
 * e.g. "amazon.com" -> "Amazon", "web.archive.org" -> "Archive", "github.com" -> "GitHub"
 */
function domainToBrandName(domain) {
  if (!domain) return 'Downloads';
  
  const knownBrands = {
    'amazon': 'Amazon',
    'archive': 'Archive',
    'github': 'GitHub',
    'gitlab': 'GitLab',
    'google': 'Google',
    'microsoft': 'Microsoft',
    'dropbox': 'Dropbox',
    'slack': 'Slack',
    'notion': 'Notion',
    'figma': 'Figma',
    'unsplash': 'Unsplash',
    'kaggle': 'Kaggle',
    'huggingface': 'HuggingFace',
    'arxiv': 'ArXiv',
    'youtube': 'YouTube',
    'reddit': 'Reddit',
    'wikipedia': 'Wikipedia',
    'whatsapp': 'WhatsApp'
  };

  const parts = domain.split('.');
  let mainName = parts[0];
  
  // Handle subdomains like web.archive.org -> archive, codeload.github.com -> github
  if (parts.length > 2 && ['web', 'api', 'cdn', 'dl', 'download', 'downloads', 'app', 'codeload', 'raw', 'static', 'media'].includes(parts[0])) {
    mainName = parts[1];
  } else if (parts.length > 2 && parts[parts.length - 2].length <= 3 && parts[parts.length - 1].length <= 3) {
    mainName = parts[parts.length - 3] || parts[0];
  }

  const key = mainName.toLowerCase();
  if (knownBrands[key]) {
    return knownBrands[key];
  }

  // Capitalize first letter
  return mainName.charAt(0).toUpperCase() + mainName.slice(1);
}

/**
 * Match a pattern against a string. Supports simple glob patterns (*).
 */
function matchGlobPattern(pattern, string) {
  if (!pattern || !string) return false;
  pattern = pattern.trim().toLowerCase();
  string = string.trim().toLowerCase();

  if (pattern === string || pattern === '*') return true;

  // Convert glob to regex
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
  const regex = new RegExp(`^${escaped}$`, 'i');
  return regex.test(string);
}

/**
 * Clean and sanitize a subfolder path relative to browser download root.
 * Accepts relative paths ('costume', 'Downloads/Amazon') or absolute paths
 * starting with baseLocation ('C:\Users\KBSV\costume') and strips the base.
 */
function sanitizeSubfolder(subfolder, baseLocation = 'C:\\Users\\KBSV') {
  if (!subfolder || typeof subfolder !== 'string') return '';

  let norm = subfolder.replace(/\\/g, '/').trim();
  const baseNorm = (baseLocation || '').replace(/\\/g, '/').replace(/\/+$/, '').trim();

  // If user pasted an absolute path that starts with their base download root, strip it
  if (baseNorm && norm.toLowerCase().startsWith(baseNorm.toLowerCase())) {
    norm = norm.slice(baseNorm.length);
  }

  // Strip leading drive letter or initial root slashes
  norm = norm.replace(/^[a-zA-Z]:/i, '');
  norm = norm.replace(/^\/+/, '');

  // Strip forbidden Windows chars (except path slash /)
  norm = norm.replace(/[<>:"|?*]/g, '');

  // Split into segments and clean up
  const segments = norm
    .split('/')
    .map(seg => seg.trim())
    .filter(seg => seg.length > 0 && seg !== '.' && seg !== '..')
    .map(seg => seg.replace(/[\.\s]+$/, ''));

  return segments.join('/');
}

/**
 * Sanitize filename to ensure Windows/browser compatibility.
 */
function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') return 'download';
  let clean = filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/[\.\s]+$/, '')
    .trim();
  return clean || 'download';
}

/**
 * Replace dynamic tokens in subfolder templates.
 */
function applyTokens(template, context) {
  if (!template) return '';
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return template
    .replace(/{domain}/gi, context.domain || '')
    .replace(/{brand}/gi, context.brand || '')
    .replace(/{ext}/gi, context.ext || '')
    .replace(/{year}/gi, year)
    .replace(/{month}/gi, month)
    .replace(/{date}/gi, `${year}-${month}-${day}`)
    .replace(/{day}/gi, day);
}

/**
 * Determine the destination subfolder and rule applied for a download.
 */
function resolveDownloadRouting(downloadItem, activeTabUrl, settings) {
  const baseLocation = settings.baseLocation || DEFAULT_SETTINGS.baseLocation;

  if (!settings.enabled) {
    return {
      subfolder: '',
      matchedRule: null,
      sourceDomain: '',
      sourceOriginUrl: '',
      reason: 'Extension disabled',
      fullPreviewPath: `${baseLocation}\\${downloadItem.filename || 'download'}`
    };
  }

  // Find origin domain with multi-tier resolution:
  let sourceOriginUrl = '';
  let domain = '';

  // 1. Try active tab first if available (gives the exact webpage where the user clicked Download)
  if (activeTabUrl) {
    const tabHost = extractHostname(activeTabUrl);
    if (tabHost) {
      domain = tabHost;
      sourceOriginUrl = activeTabUrl;
    }
  }

  // 2. Try referrer
  if (!domain && downloadItem.referrer) {
    const refHost = extractHostname(downloadItem.referrer);
    if (refHost) {
      domain = refHost;
      sourceOriginUrl = downloadItem.referrer;
    }
  }

  // 3. Try download URL (supports blob:https://web.whatsapp.com/... and direct links)
  if (!domain) {
    const dlUrl = downloadItem.finalUrl || downloadItem.url || '';
    const dlHost = extractHostname(dlUrl);
    if (dlHost) {
      domain = dlHost;
      sourceOriginUrl = dlUrl;
    }
  }

  const rootDomain = getRootDomain(domain);
  const activeTabDomain = extractHostname(activeTabUrl);
  const activeTabRoot = getRootDomain(activeTabDomain);

  const brand = domainToBrandName(domain) || domainToBrandName(activeTabDomain);
  const ext = (downloadItem.filename || '').split('.').pop() || '';

  const context = {
    domain,
    rootDomain,
    brand,
    ext,
    originalFilename: downloadItem.filename || 'download'
  };

  let chosenSubfolder = '';
  let matchedRule = null;
  let reason = '';

  // 1. Check custom rules in priority order
  if (Array.isArray(settings.rules)) {
    for (const rule of settings.rules) {
      if (!rule.enabled || !rule.pattern || !rule.folder) continue;

      const pattern = rule.pattern.trim();
      const isMatch = matchGlobPattern(pattern, domain) ||
                      (rootDomain && matchGlobPattern(pattern, rootDomain)) ||
                      (activeTabDomain && matchGlobPattern(pattern, activeTabDomain)) ||
                      (activeTabRoot && matchGlobPattern(pattern, activeTabRoot)) ||
                      (domain && pattern && domain.endsWith('.' + pattern)) ||
                      (pattern.includes('/') && matchGlobPattern(pattern, sourceOriginUrl)) ||
                      matchGlobPattern(pattern, downloadItem.filename);

      if (isMatch) {
        matchedRule = rule;
        chosenSubfolder = applyTokens(rule.folder, context);
        reason = `Rule match: "${rule.pattern}"`;
        break;
      }
    }
  }

  // 2. Check remembered last location for this domain (or root domain)
  if (!chosenSubfolder && settings.rememberLastLocation && settings.rememberedLocations) {
    const remembered = settings.rememberedLocations[domain] ||
                       (rootDomain && settings.rememberedLocations[rootDomain]) ||
                       (activeTabDomain && settings.rememberedLocations[activeTabDomain]) ||
                       (activeTabRoot && settings.rememberedLocations[activeTabRoot]);

    if (remembered) {
      chosenSubfolder = applyTokens(remembered, context);
      reason = `Remembered location for ${domain || rootDomain || activeTabDomain}`;
    }
  }

  // 3. Fallback: Smart auto-folder based on domain / brand name
  if (!chosenSubfolder && settings.autoDomainFolder && domain) {
    chosenSubfolder = `Downloads/${brand}`;
    reason = `Auto-brand folder for ${domain}`;
  }

  // 4. Fallback: Default subfolder
  if (!chosenSubfolder && settings.defaultFolder) {
    chosenSubfolder = applyTokens(settings.defaultFolder, context);
    reason = 'Default folder fallback';
  }

  const cleanSubfolder = sanitizeSubfolder(chosenSubfolder, baseLocation);
  const cleanFilename = sanitizeFilename(downloadItem.filename);

  const targetFilename = cleanSubfolder
    ? `${cleanSubfolder}/${cleanFilename}`
    : cleanFilename;

  const cleanBase = baseLocation.replace(/[/\\]+$/, '');
  const fullPreviewPath = cleanSubfolder
    ? `${cleanBase}\\${cleanSubfolder.replace(/\//g, '\\')}\\${cleanFilename}`
    : `${cleanBase}\\${cleanFilename}`;

  return {
    subfolder: cleanSubfolder,
    targetFilename,
    cleanFilename,
    fullPreviewPath,
    matchedRule,
    sourceDomain: domain,
    brand,
    sourceOriginUrl,
    reason
  };
}

// Export for service worker, popup, options, and node tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_SETTINGS,
    extractHostname,
    domainToBrandName,
    matchGlobPattern,
    sanitizeSubfolder,
    sanitizeFilename,
    applyTokens,
    resolveDownloadRouting
  };
}
