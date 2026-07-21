const PLACEHOLDER_ICON = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
    <rect width="96" height="96" rx="18" fill="#202736"/>
    <path d="M48 20 60 40 48 76 36 40Z" fill="#9fb4ff" opacity="0.92"/>
    <circle cx="48" cy="24" r="6" fill="#ffffff" opacity="0.9"/>
  </svg>
`)}`;

const avatarCache = new Map();

const state = {
  achievements: [],
  filteredAchievements: [],
  filteredAdepts: [],
  activeModule: 'browser',
  adeptBrowserRole: 'killer',
  randomRole: 'killer',
  currentProfile: null,
};

const elements = {
  profileForm: document.getElementById('profile-form'),
  profileInput: document.getElementById('profile-input'),
  loadButton: document.getElementById('load-button'),
  refreshButton: document.getElementById('refresh-button'),
  aboutButton: document.getElementById('about-button'),
  aboutModal: document.getElementById('about-modal'),
  aboutCloseButton: document.getElementById('about-close-button'),
  message: document.getElementById('message'),
  workspace: document.getElementById('workspace'),
  profileName: document.getElementById('profile-name'),
  profileLink: document.getElementById('profile-link'),
  summaryTotal: document.getElementById('summary-total'),
  summaryUnlocked: document.getElementById('summary-unlocked'),
  summaryLocked: document.getElementById('summary-locked'),
  summaryPercent: document.getElementById('summary-percent'),
  overallProgressText: document.getElementById('overall-progress-text'),
  overallProgressFill: document.getElementById('overall-progress-fill'),
  killerUnlocked: document.getElementById('killer-unlocked'),
  killerTotal: document.getElementById('killer-total'),
  killerProgressText: document.getElementById('killer-progress-text'),
  killerProgressFill: document.getElementById('killer-progress-fill'),
  survivorUnlocked: document.getElementById('survivor-unlocked'),
  survivorTotal: document.getElementById('survivor-total'),
  survivorProgressText: document.getElementById('survivor-progress-text'),
  survivorProgressFill: document.getElementById('survivor-progress-fill'),
  generalUnlocked: document.getElementById('general-unlocked'),
  generalTotal: document.getElementById('general-total'),
  generalProgressText: document.getElementById('general-progress-text'),
  generalProgressFill: document.getElementById('general-progress-fill'),
  adeptUnlocked: document.getElementById('adept-unlocked'),
  adeptTotal: document.getElementById('adept-total'),
  adeptProgressText: document.getElementById('adept-progress-text'),
  adeptProgressFill: document.getElementById('adept-progress-fill'),
  moduleTabs: [...document.querySelectorAll('[data-module-target]')],
  modulePanels: {
    browser: document.getElementById('module-browser'),
    'adept-browser': document.getElementById('module-adept-browser'),
    'random-adept': document.getElementById('module-random-adept'),
  },
  resultsCount: document.getElementById('results-count'),
  browserVisibleTotal: document.getElementById('browser-visible-total'),
  browserVisibleUnlocked: document.getElementById('browser-visible-unlocked'),
  browserVisibleLocked: document.getElementById('browser-visible-locked'),
  browserVisibleAdepts: document.getElementById('browser-visible-adepts'),
  browserProgressText: document.getElementById('browser-progress-text'),
  browserProgressFill: document.getElementById('browser-progress-fill'),
  searchInput: document.getElementById('search-input'),
  sortSelect: document.getElementById('sort-select'),
  statusFilter: document.getElementById('status-filter'),
  roleFilter: document.getElementById('role-filter'),
  excludeAdepts: document.getElementById('exclude-adepts'),
  quickRoleButtons: [...document.querySelectorAll('[data-role-quick]')],
  achievementTableBody: document.getElementById('achievement-table-body'),
  exportBrowserCsv: document.getElementById('export-browser-csv'),
  exportBrowserJson: document.getElementById('export-browser-json'),
  adeptResultsCount: document.getElementById('adept-results-count'),
  adeptSearchInput: document.getElementById('adept-search-input'),
  adeptSortSelect: document.getElementById('adept-sort-select'),
  adeptStatusFilter: document.getElementById('adept-status-filter'),
  adeptBrowserRoleButtons: [...document.querySelectorAll('[data-adept-browser-role]')],
  adeptTableBody: document.getElementById('adept-table-body'),
  adeptBrowserRoleLabel: document.getElementById('adept-browser-role-label'),
  adeptBrowserUnlocked: document.getElementById('adept-browser-unlocked'),
  adeptBrowserLocked: document.getElementById('adept-browser-locked'),
  adeptBrowserTotal: document.getElementById('adept-browser-total'),
  adeptBrowserProgressText: document.getElementById('adept-browser-progress-text'),
  adeptBrowserProgressFill: document.getElementById('adept-browser-progress-fill'),
  exportAdeptCsv: document.getElementById('export-adept-csv'),
  exportAdeptJson: document.getElementById('export-adept-json'),
  randomRoleButtons: [...document.querySelectorAll('[data-random-role]')],
  randomRoleLabel: document.getElementById('random-role-label'),
  randomLockedCount: document.getElementById('random-locked-count'),
  randomUnlockedCount: document.getElementById('random-unlocked-count'),
  randomTotalCount: document.getElementById('random-total-count'),
  randomProgressText: document.getElementById('random-progress-text'),
  randomProgressFill: document.getElementById('random-progress-fill'),
  randomAdeptButton: document.getElementById('random-adept-button'),
  randomAdeptCard: document.getElementById('random-adept-card'),
  randomPoolCaption: document.getElementById('random-pool-caption'),
  randomPoolList: document.getElementById('random-pool-list'),
};

function showMessage(text, type = 'success') {
  elements.message.textContent = text;
  elements.message.classList.remove('hidden', 'error', 'success');
  elements.message.classList.add(type);
}

function hideMessage() {
  elements.message.classList.add('hidden');
  elements.message.textContent = '';
  elements.message.classList.remove('error', 'success');
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function titleCase(value = '') {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
}

function roleLabel(role) {
  if (role === 'all') return 'Both';
  return titleCase(role);
}

function statusBadge(unlocked) {
  return `<span class="badge ${unlocked ? 'unlocked' : 'locked'}">${unlocked ? 'Unlocked' : 'Locked'}</span>`;
}

function roleBadge(role) {
  return `<span class="badge ${escapeHtml(role)}">${escapeHtml(role)}</span>`;
}

function adeptBadge(isAdept) {
  return isAdept ? '<span class="badge adept">Adept</span>' : '';
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `${Number(value).toFixed(1)}%`;
}

function getIconSrc(icon) {
  return icon || PLACEHOLDER_ICON;
}

function progressText(achievement) {
  return achievement.unlockDisplay || achievement.progressDisplay || '—';
}

function safePercent(numerator, denominator) {
  if (!denominator) return 0;
  return Math.max(0, Math.min(100, (numerator / denominator) * 100));
}

function setProgress(fillElement, textElement, numerator, denominator, emptyText = '0%') {
  const percent = safePercent(numerator, denominator);
  fillElement.style.width = `${percent}%`;
  textElement.textContent = denominator ? `${percent.toFixed(1)}%` : emptyText;
}

function initialsFromCharacter(character) {
  if (!character) return '—';
  return character
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function avatarTheme(role) {
  switch (role) {
    case 'killer': return { a: '#ff7d7d', b: '#ffb27a' };
    case 'survivor': return { a: '#59dfb4', b: '#77f2d0' };
    default: return { a: '#84a6ff', b: '#bdd0ff' };
  }
}

function getCharacterAvatar(character, role) {
  const key = `${role}:${character || 'none'}`;
  if (avatarCache.has(key)) return avatarCache.get(key);

  const initials = initialsFromCharacter(character);
  const theme = avatarTheme(role);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${theme.a}" />
          <stop offset="100%" stop-color="${theme.b}" />
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="20" fill="#18202d"/>
      <rect x="8" y="8" width="80" height="80" rx="18" fill="url(#g)" opacity="0.95"/>
      <text x="48" y="57" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="700" fill="#10141d">${initials}</text>
    </svg>
  `;
  const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  avatarCache.set(key, uri);
  return uri;
}

function renderCharacterCell(achievement) {
  const character = achievement.character || 'No linked character';
  const chapter = achievement.chapter || 'No chapter tag';
  return `
    <div class="character-cell">
      <img src="${escapeHtml(getCharacterAvatar(achievement.character, achievement.role))}" alt="${escapeHtml(character)} portrait">
      <div>
        <strong>${escapeHtml(character)}</strong>
        <small>${escapeHtml(chapter)}</small>
      </div>
    </div>
  `;
}

function sortAchievements(list, mode) {
  const items = [...list];
  const alpha = (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  const dateValue = (item) => {
    if (!item.unlockDate) return null;
    const parsed = new Date(item.unlockDate);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
  };

  switch (mode) {
    case 'name_desc': return items.sort((a, b) => alpha(b, a));
    case 'unlocked_first': return items.sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || alpha(a, b));
    case 'locked_first': return items.sort((a, b) => Number(a.unlocked) - Number(b.unlocked) || alpha(a, b));
    case 'date_newest': return items.sort((a, b) => (dateValue(b) ?? -1) - (dateValue(a) ?? -1) || alpha(a, b));
    case 'date_oldest': return items.sort((a, b) => (dateValue(a) ?? Number.MAX_SAFE_INTEGER) - (dateValue(b) ?? Number.MAX_SAFE_INTEGER) || alpha(a, b));
    case 'role': return items.sort((a, b) => (a.sortRoleOrder ?? 99) - (b.sortRoleOrder ?? 99) || alpha(a, b));
    case 'character':
      return items.sort((a, b) => {
        const aChar = a.character || 'zzzz';
        const bChar = b.character || 'zzzz';
        return aChar.localeCompare(bChar, undefined, { sensitivity: 'base' }) || alpha(a, b);
      });
    case 'release_order': return items.sort((a, b) => (a.releaseOrder ?? Number.MAX_SAFE_INTEGER) - (b.releaseOrder ?? Number.MAX_SAFE_INTEGER) || alpha(a, b));
    case 'chapter_asc': return items.sort((a, b) => (a.chapter || 'zzzz').localeCompare(b.chapter || 'zzzz', undefined, { sensitivity: 'base' }) || alpha(a, b));
    case 'adept_first': return items.sort((a, b) => Number(b.isAdept) - Number(a.isAdept) || alpha(a, b));
    case 'rarest': return items.sort((a, b) => (a.globalPercent ?? Number.MAX_SAFE_INTEGER) - (b.globalPercent ?? Number.MAX_SAFE_INTEGER) || alpha(a, b));
    case 'commonest': return items.sort((a, b) => (b.globalPercent ?? -1) - (a.globalPercent ?? -1) || alpha(a, b));
    case 'name_asc':
    default: return items.sort(alpha);
  }
}

function renderGlobalRateCell(value) {
  const percent = value === null || value === undefined || Number.isNaN(Number(value)) ? null : Number(value);
  const width = percent === null ? 0 : Math.max(0, Math.min(100, percent));
  return `
    <div class="global-rate-cell">
      <strong>${escapeHtml(formatPercent(percent))}</strong>
      <div class="mini-progress">
        <span style="width: ${width}%"></span>
      </div>
    </div>
  `;
}

function buildAchievementRows(items, emptyText) {
  if (!items.length) {
    return `<tr><td colspan="6">${escapeHtml(emptyText)}</td></tr>`;
  }

  return items.map((achievement) => `
    <tr>
      <td>
        <div class="achievement-name">
          <img src="${escapeHtml(getIconSrc(achievement.icon))}" alt="${escapeHtml(achievement.name)} icon">
          <div>
            <strong>${escapeHtml(achievement.name)}</strong>
            <small>${escapeHtml(achievement.description || 'No description available.')}</small>
            <div class="meta-row">${adeptBadge(achievement.isAdept)}</div>
          </div>
        </div>
      </td>
      <td>${roleBadge(achievement.role)}</td>
      <td>${renderCharacterCell(achievement)}</td>
      <td>${statusBadge(achievement.unlocked)}</td>
      <td>${escapeHtml(progressText(achievement))}</td>
      <td>${renderGlobalRateCell(achievement.globalPercent)}</td>
    </tr>
  `).join('');
}

function syncQuickRoleButtons(role) {
  elements.quickRoleButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.roleQuick === role);
  });
}

function syncSwitchButtons(buttons, activeValue, attribute) {
  buttons.forEach((button) => {
    button.classList.toggle('active', button.dataset[attribute] === activeValue);
  });
}

function setActiveModule(moduleName) {
  state.activeModule = moduleName;
  elements.moduleTabs.forEach((button) => {
    button.classList.toggle('active', button.dataset.moduleTarget === moduleName);
  });
  Object.entries(elements.modulePanels).forEach(([name, panel]) => {
    panel.classList.toggle('hidden', name !== moduleName);
  });
}

function updateBrowserVisibleStats(items) {
  const unlocked = items.filter((item) => item.unlocked).length;
  const locked = items.length - unlocked;
  const adepts = items.filter((item) => item.isAdept).length;
  elements.browserVisibleTotal.textContent = items.length;
  elements.browserVisibleUnlocked.textContent = unlocked;
  elements.browserVisibleLocked.textContent = locked;
  elements.browserVisibleAdepts.textContent = adepts;
  setProgress(elements.browserProgressFill, elements.browserProgressText, unlocked, items.length);
}

function filterAchievements() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const sortMode = elements.sortSelect.value;
  const statusMode = elements.statusFilter.value;
  const roleMode = elements.roleFilter.value;
  const excludeAdepts = elements.excludeAdepts.checked;

  syncQuickRoleButtons(roleMode);

  const filtered = state.achievements.filter((achievement) => {
    if (statusMode === 'unlocked' && !achievement.unlocked) return false;
    if (statusMode === 'locked' && achievement.unlocked) return false;
    if (roleMode !== 'all' && achievement.role !== roleMode) return false;
    if (excludeAdepts && achievement.isAdept) return false;
    if (!query) return true;

    const haystack = [achievement.name, achievement.description, achievement.role, achievement.character, achievement.chapter, achievement.unlocked ? 'unlocked' : 'locked']
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });

  state.filteredAchievements = sortAchievements(filtered, sortMode);
  elements.achievementTableBody.innerHTML = buildAchievementRows(state.filteredAchievements, 'No achievements match your current search and filter settings.');
  elements.resultsCount.textContent = `${state.filteredAchievements.length} result${state.filteredAchievements.length === 1 ? '' : 's'}`;
  updateBrowserVisibleStats(state.filteredAchievements);
}

function getAdeptsForRole(role) {
  const adepts = state.achievements.filter((achievement) => achievement.isAdept);
  return role === 'all' ? adepts : adepts.filter((achievement) => achievement.role === role);
}

function updateAdeptBrowserStats(items) {
  const unlocked = items.filter((item) => item.unlocked).length;
  const locked = items.length - unlocked;
  elements.adeptBrowserRoleLabel.textContent = roleLabel(state.adeptBrowserRole);
  elements.adeptBrowserUnlocked.textContent = unlocked;
  elements.adeptBrowserLocked.textContent = locked;
  elements.adeptBrowserTotal.textContent = items.length;
  setProgress(elements.adeptBrowserProgressFill, elements.adeptBrowserProgressText, unlocked, items.length);
}

function filterAdeptBrowser() {
  const roleAdepts = getAdeptsForRole(state.adeptBrowserRole);
  const query = elements.adeptSearchInput.value.trim().toLowerCase();
  const statusMode = elements.adeptStatusFilter.value;
  const sortMode = elements.adeptSortSelect.value;

  updateAdeptBrowserStats(roleAdepts);

  const filtered = roleAdepts.filter((achievement) => {
    if (statusMode === 'locked' && achievement.unlocked) return false;
    if (statusMode === 'unlocked' && !achievement.unlocked) return false;
    if (!query) return true;

    const haystack = [achievement.name, achievement.description, achievement.character, achievement.role, achievement.chapter]
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });

  state.filteredAdepts = sortAchievements(filtered, sortMode);
  elements.adeptTableBody.innerHTML = buildAchievementRows(state.filteredAdepts, 'No adepts match the current role, search, and filter settings.');
  elements.adeptResultsCount.textContent = `${state.filteredAdepts.length} adept${state.filteredAdepts.length === 1 ? '' : 's'}`;
}

function setRandomProgressTheme(role) {
  elements.randomProgressFill.className = 'progress-fill';
  if (role === 'killer') elements.randomProgressFill.classList.add('killer-fill');
  else if (role === 'survivor') elements.randomProgressFill.classList.add('survivor-fill');
  else elements.randomProgressFill.classList.add('adept-fill');
}

function renderRandomPool(roleAdepts, lockedAdepts) {
  elements.randomRoleLabel.textContent = roleLabel(state.randomRole);
  elements.randomTotalCount.textContent = roleAdepts.length;
  elements.randomUnlockedCount.textContent = roleAdepts.filter((item) => item.unlocked).length;
  elements.randomLockedCount.textContent = lockedAdepts.length;
  elements.randomPoolCaption.textContent = `${lockedAdepts.length} in pool`;
  setRandomProgressTheme(state.randomRole);
  setProgress(elements.randomProgressFill, elements.randomProgressText, lockedAdepts.length, roleAdepts.length);

  if (!lockedAdepts.length) {
    elements.randomPoolList.innerHTML = '<p class="empty-pool">No locked adepts remain for this selection.</p>';
    return;
  }

  elements.randomPoolList.innerHTML = sortAchievements(lockedAdepts, 'release_order')
    .map((achievement) => `<span class="pool-chip">${escapeHtml(achievement.name)}</span>`)
    .join('');
}

function resetRandomCard() {
  elements.randomAdeptCard.classList.add('empty');
  elements.randomAdeptCard.innerHTML = '<p>Pick a role and press <strong>Random locked adept</strong>.</p>';
}

function updateRandomModule(resetCard = false) {
  const roleAdepts = getAdeptsForRole(state.randomRole);
  const lockedAdepts = roleAdepts.filter((item) => !item.unlocked);
  renderRandomPool(roleAdepts, lockedAdepts);
  if (resetCard) resetRandomCard();
}

function pickRandomLockedAdept() {
  const lockedAdepts = getAdeptsForRole(state.randomRole).filter((achievement) => !achievement.unlocked);
  if (!lockedAdepts.length) {
    elements.randomAdeptCard.classList.remove('empty');
    elements.randomAdeptCard.innerHTML = `<p>You do not have any locked adepts for <strong>${escapeHtml(roleLabel(state.randomRole))}</strong>.</p>`;
    return;
  }

  const randomAchievement = lockedAdepts[Math.floor(Math.random() * lockedAdepts.length)];
  elements.randomAdeptCard.classList.remove('empty');
  elements.randomAdeptCard.innerHTML = `
    <div class="random-card-header">
      <div>
        <p class="eyebrow">Random pick</p>
        <h3>${escapeHtml(randomAchievement.name)}</h3>
      </div>
      <img class="random-icon" src="${escapeHtml(getIconSrc(randomAchievement.icon))}" alt="${escapeHtml(randomAchievement.name)} icon">
    </div>
    <div class="meta-row">
      ${roleBadge(randomAchievement.role)}
      ${statusBadge(randomAchievement.unlocked)}
      <span class="badge adept">${escapeHtml(randomAchievement.character || 'Adept')}</span>
    </div>
    <div class="character-spotlight">
      <img src="${escapeHtml(getCharacterAvatar(randomAchievement.character, randomAchievement.role))}" alt="${escapeHtml(randomAchievement.character || 'Character')} portrait">
      <div>
        <strong>${escapeHtml(randomAchievement.character || 'No linked character')}</strong>
        <small>${escapeHtml(randomAchievement.chapter || 'No chapter tag')}</small>
      </div>
    </div>
    <p>${escapeHtml(randomAchievement.description || '')}</p>
    <p><strong>Global unlock rate:</strong> ${escapeHtml(formatPercent(randomAchievement.globalPercent))}</p>
  `;
}

function updateSummary(summary) {
  elements.summaryTotal.textContent = summary.total;
  elements.summaryUnlocked.textContent = summary.unlocked;
  elements.summaryLocked.textContent = summary.locked;
  elements.summaryPercent.textContent = `${summary.completionPercent}%`;
  setProgress(elements.overallProgressFill, elements.overallProgressText, summary.unlocked, summary.total);
  elements.killerUnlocked.textContent = summary.roles.killer.unlocked;
  elements.killerTotal.textContent = summary.roles.killer.total;
  setProgress(elements.killerProgressFill, elements.killerProgressText, summary.roles.killer.unlocked, summary.roles.killer.total);
  elements.survivorUnlocked.textContent = summary.roles.survivor.unlocked;
  elements.survivorTotal.textContent = summary.roles.survivor.total;
  setProgress(elements.survivorProgressFill, elements.survivorProgressText, summary.roles.survivor.unlocked, summary.roles.survivor.total);
  elements.generalUnlocked.textContent = summary.roles.general.unlocked;
  elements.generalTotal.textContent = summary.roles.general.total;
  setProgress(elements.generalProgressFill, elements.generalProgressText, summary.roles.general.unlocked, summary.roles.general.total);
  elements.adeptUnlocked.textContent = summary.adept.unlocked;
  elements.adeptTotal.textContent = summary.adept.total;
  setProgress(elements.adeptProgressFill, elements.adeptProgressText, summary.adept.unlocked, summary.adept.total);
}

function showWorkspace() {
  elements.workspace.classList.remove('hidden');
}

function slugifyFilePart(value) {
  return String(value || 'profile').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'profile';
}

function fileTimestamp() {
  const now = new Date();
  const pad = (num) => String(num).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function csvEscape(value) {
  const stringValue = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(stringValue) ? `"${stringValue.replaceAll('"', '""')}"` : stringValue;
}

function buildExportRows(dataset) {
  return dataset.map((item) => ({
    name: item.name,
    role: item.role,
    character: item.character || '',
    chapter: item.chapter || '',
    releaseOrder: item.releaseOrder ?? '',
    isAdept: item.isAdept,
    unlocked: item.unlocked,
    unlockText: item.unlockDisplay || '',
    progressText: item.progressDisplay || '',
    globalPercent: item.globalPercent ?? '',
    description: item.description || '',
  }));
}

function exportDataset(dataset, format, label) {
  if (!dataset.length) {
    showMessage(`There is nothing to export for ${label}.`, 'error');
    return;
  }

  const base = `${slugifyFilePart(state.currentProfile?.profileName || state.currentProfile?.input || 'profile')}_${label}_${fileTimestamp()}`;
  const rows = buildExportRows(dataset);

  if (format === 'json') {
    downloadFile(JSON.stringify(rows, null, 2), `${base}.json`, 'application/json');
    showMessage(`Exported ${dataset.length} ${label} rows to JSON.`, 'success');
    return;
  }

  const headers = Object.keys(rows[0]);
  const csv = [headers.join(',')].concat(rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))).join('\n');
  downloadFile(csv, `${base}.csv`, 'text/csv;charset=utf-8');
  showMessage(`Exported ${dataset.length} ${label} rows to CSV.`, 'success');
}

function setLoadingState(isLoading, isForceRefresh = false) {
  elements.loadButton.disabled = isLoading;
  elements.refreshButton.disabled = isLoading;
  elements.loadButton.textContent = isLoading && !isForceRefresh ? 'Loading...' : 'Load achievements';
  elements.refreshButton.textContent = isLoading && isForceRefresh ? 'Refreshing...' : 'Force refresh Steam';
}

function openAboutModal() {
  elements.aboutModal.classList.remove('hidden');
  elements.aboutModal.setAttribute('aria-hidden', 'false');
}

function closeAboutModal() {
  elements.aboutModal.classList.add('hidden');
  elements.aboutModal.setAttribute('aria-hidden', 'true');
}

async function loadAchievements(profile, forceRefresh = false) {
  hideMessage();
  setLoadingState(true, forceRefresh);

  try {
    const response = await fetch('/api/achievements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, forceRefresh }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to load achievements.');

    state.achievements = data.achievements || [];
    state.currentProfile = data.profile;
    elements.profileName.textContent = data.profile.profileName || 'Unknown Steam user';
    elements.profileLink.textContent = data.profile.resolvedProfileUrl;
    elements.profileLink.href = data.profile.resolvedProfileUrl;

    updateSummary(data.summary);
    showWorkspace();
    setActiveModule('browser');
    filterAchievements();
    filterAdeptBrowser();
    updateRandomModule(true);
    showMessage(
      forceRefresh
        ? `Refreshed ${data.summary.total} achievements from Steam for ${data.profile.profileName}.`
        : `Loaded ${data.summary.total} achievements for ${data.profile.profileName}.`,
      'success'
    );
  } catch (error) {
    showMessage(error.message || 'Failed to load achievements.', 'error');
  } finally {
    setLoadingState(false, false);
  }
}

function setQuickRole(role) {
  elements.roleFilter.value = role;
  syncQuickRoleButtons(role);
  filterAchievements();
}

function setAdeptBrowserRole(role) {
  state.adeptBrowserRole = role;
  syncSwitchButtons(elements.adeptBrowserRoleButtons, role, 'adeptBrowserRole');
  filterAdeptBrowser();
}

function setRandomRole(role) {
  state.randomRole = role;
  syncSwitchButtons(elements.randomRoleButtons, role, 'randomRole');
  updateRandomModule(true);
}

function attachEvents() {
  elements.profileForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const profile = elements.profileInput.value.trim();
    if (!profile) {
      showMessage('Enter a Steam profile URL, SteamID64, or custom profile name.', 'error');
      return;
    }
    loadAchievements(profile, false);
  });

  elements.refreshButton.addEventListener('click', () => {
    const profile = elements.profileInput.value.trim() || state.currentProfile?.input || '';
    if (!profile) {
      showMessage('Enter a Steam profile first, then force refresh.', 'error');
      return;
    }
    if (!elements.profileInput.value.trim()) {
      elements.profileInput.value = profile;
    }
    loadAchievements(profile, true);
  });

  elements.aboutButton.addEventListener('click', openAboutModal);
  elements.aboutCloseButton.addEventListener('click', closeAboutModal);
  elements.aboutModal.addEventListener('click', (event) => {
    if (event.target === elements.aboutModal) closeAboutModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !elements.aboutModal.classList.contains('hidden')) {
      closeAboutModal();
    }
  });

  [elements.searchInput, elements.sortSelect, elements.statusFilter, elements.roleFilter, elements.excludeAdepts].forEach((element) => {
    element.addEventListener('input', filterAchievements);
    element.addEventListener('change', filterAchievements);
  });

  elements.quickRoleButtons.forEach((button) => {
    button.addEventListener('click', () => setQuickRole(button.dataset.roleQuick));
  });

  [elements.adeptSearchInput, elements.adeptSortSelect, elements.adeptStatusFilter].forEach((element) => {
    element.addEventListener('input', filterAdeptBrowser);
    element.addEventListener('change', filterAdeptBrowser);
  });

  elements.adeptBrowserRoleButtons.forEach((button) => {
    button.addEventListener('click', () => setAdeptBrowserRole(button.dataset.adeptBrowserRole));
  });

  elements.randomRoleButtons.forEach((button) => {
    button.addEventListener('click', () => setRandomRole(button.dataset.randomRole));
  });

  elements.moduleTabs.forEach((button) => {
    button.addEventListener('click', () => setActiveModule(button.dataset.moduleTarget));
  });

  elements.randomAdeptButton.addEventListener('click', pickRandomLockedAdept);
  elements.exportBrowserCsv.addEventListener('click', () => exportDataset(state.filteredAchievements, 'csv', 'achievement-browser'));
  elements.exportBrowserJson.addEventListener('click', () => exportDataset(state.filteredAchievements, 'json', 'achievement-browser'));
  elements.exportAdeptCsv.addEventListener('click', () => exportDataset(state.filteredAdepts, 'csv', 'adept-browser'));
  elements.exportAdeptJson.addEventListener('click', () => exportDataset(state.filteredAdepts, 'json', 'adept-browser'));
}

attachEvents();
setQuickRole('all');
setAdeptBrowserRole('killer');
setRandomRole('killer');
setActiveModule('browser');
