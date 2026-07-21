const PLACEHOLDER_ICON = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
    <rect width="96" height="96" rx="18" fill="#202736"/>
    <path d="M48 20 60 40 48 76 36 40Z" fill="#9fb4ff" opacity="0.92"/>
    <circle cx="48" cy="24" r="6" fill="#ffffff" opacity="0.9"/>
  </svg>
`)}`;

const THEME_STORAGE_KEY = 'dbdTheme';
const GOALS_STORAGE_KEY = 'dbdPinnedGoals';
const avatarCache = new Map();

const state = {
  achievements: [],
  filteredAchievements: [],
  filteredAdepts: [],
  activeModule: 'browser',
  adeptBrowserRole: 'killer',
  randomRole: 'killer',
  browserView: 'table',
  currentProfile: null,
  currentSummary: null,
  compareProfiles: [],
  pinnedGoals: loadPinnedGoals(),
  admin: {
    status: null,
  },
};

const elements = {
  profileForm: document.getElementById('profile-form'),
  profileInput: document.getElementById('profile-input'),
  loadButton: document.getElementById('load-button'),
  refreshButton: document.getElementById('refresh-button'),
  themeSelect: document.getElementById('theme-select'),
  aboutButton: document.getElementById('about-button'),
  aboutModal: document.getElementById('about-modal'),
  aboutCloseButton: document.getElementById('about-close-button'),
  adminButton: document.getElementById('admin-button'),
  adminModal: document.getElementById('admin-modal'),
  adminCloseButton: document.getElementById('admin-close-button'),
  adminCacheSummary: document.getElementById('admin-cache-summary'),
  adminClearProfileCache: document.getElementById('admin-clear-profile-cache'),
  adminClearGlobalCache: document.getElementById('admin-clear-global-cache'),
  adminClearAllCache: document.getElementById('admin-clear-all-cache'),
  adminAchievementSelect: document.getElementById('admin-achievement-select'),
  adminRoleSelect: document.getElementById('admin-role-select'),
  adminCharacterInput: document.getElementById('admin-character-input'),
  adminChapterInput: document.getElementById('admin-chapter-input'),
  adminReleaseOrderInput: document.getElementById('admin-release-order-input'),
  adminDescriptionInput: document.getElementById('admin-description-input'),
  adminSaveOverride: document.getElementById('admin-save-override'),
  adminRemoveOverride: document.getElementById('admin-remove-override'),
  adminSaveReload: document.getElementById('admin-save-reload'),
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
    goals: document.getElementById('module-goals'),
    compare: document.getElementById('module-compare'),
    insights: document.getElementById('module-insights'),
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
  browserViewSelect: document.getElementById('browser-view-select'),
  excludeAdepts: document.getElementById('exclude-adepts'),
  quickRoleButtons: [...document.querySelectorAll('[data-role-quick]')],
  achievementTableBody: document.getElementById('achievement-table-body'),
  browserTableWrap: document.getElementById('browser-table-wrap'),
  browserChapterGroups: document.getElementById('browser-chapter-groups'),
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
  goalsCount: document.getElementById('goals-count'),
  goalsList: document.getElementById('goals-list'),
  goalsClearButton: document.getElementById('goals-clear-button'),
  goalsRandomButton: document.getElementById('goals-random-button'),
  goalsRecommendButton: document.getElementById('goals-recommend-button'),
  goalsFocusSelect: document.getElementById('goals-focus-select'),
  goalsModeSelect: document.getElementById('goals-mode-select'),
  goalsRandomCard: document.getElementById('goals-random-card'),
  goalsSmartCard: document.getElementById('goals-smart-card'),
  compareProfileInput: document.getElementById('compare-profile-input'),
  compareAddButton: document.getElementById('compare-add-button'),
  compareAddCurrentButton: document.getElementById('compare-add-current-button'),
  compareClearButton: document.getElementById('compare-clear-button'),
  compareTableBody: document.getElementById('compare-table-body'),
  compareCount: document.getElementById('compare-count'),
  compareTopProfile: document.getElementById('compare-top-profile'),
  compareAverageCompletion: document.getElementById('compare-average-completion'),
  compareBestAdepts: document.getElementById('compare-best-adepts'),
  roleChart: document.getElementById('role-chart'),
  rarityChart: document.getElementById('rarity-chart'),
  unlockHeatmap: document.getElementById('unlock-heatmap'),
  chapterSummaryList: document.getElementById('chapter-summary-list'),
};

const adminEnabled = Boolean(elements.adminButton && elements.adminModal);

function loadPinnedGoals() {
  try {
    const parsed = JSON.parse(localStorage.getItem(GOALS_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePinnedGoals() {
  localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(state.pinnedGoals));
}

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

function portraitSlug(character) {
  if (!character) return 'no-linked-character';
  return character
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'no-linked-character';
}

function getCharacterAvatar(character) {
  const key = character || 'no-linked-character';
  if (avatarCache.has(key)) return avatarCache.get(key);
  const slug = portraitSlug(character);
  const result = {
    primary: `/static/portraits/${slug}.png`,
    fallback: `/static/portraits/${slug}.svg`,
    generic: `/static/portraits/no-linked-character.svg`,
  };
  avatarCache.set(key, result);
  return result;
}

function portraitImageTag(character, alt, className = '') {
  const paths = getCharacterAvatar(character);
  const fallbackScript = `if(this.dataset.fallback){const next=this.dataset.fallback;this.dataset.fallback='';this.src=next;}else{this.onerror=null;this.src='${paths.generic}';}`;
  return `<img class="${className}" src="${escapeHtml(paths.primary)}" data-fallback="${escapeHtml(paths.fallback)}" onerror="${fallbackScript}" alt="${escapeHtml(alt)}">`;
}

function isPinned(name) {
  return state.pinnedGoals.includes(name);
}

function togglePinnedGoal(name) {
  if (!name) return;
  if (isPinned(name)) {
    state.pinnedGoals = state.pinnedGoals.filter((item) => item !== name);
  } else {
    state.pinnedGoals = [...state.pinnedGoals, name];
  }
  savePinnedGoals();
  renderAllDataViews();
}

function renderPinButton(name) {
  const pinned = isPinned(name);
  return `<button class="mini-action ${pinned ? 'active' : ''}" type="button" data-pin-achievement="${escapeHtml(name)}">${pinned ? 'Pinned' : 'Pin goal'}</button>`;
}

function renderCharacterCell(achievement) {
  const character = achievement.character || 'No linked character';
  const chapter = achievement.chapter || 'No chapter tag';
  return `
    <div class="character-cell">
      ${portraitImageTag(achievement.character, `${character} portrait`, 'portrait-small')}
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
  if (!items.length) return `<tr><td colspan="6">${escapeHtml(emptyText)}</td></tr>`;

  return items.map((achievement) => `
    <tr>
      <td>
        <div class="achievement-name">
          <img src="${escapeHtml(getIconSrc(achievement.icon))}" alt="${escapeHtml(achievement.name)} icon">
          <div>
            <strong>${escapeHtml(achievement.name)}</strong>
            <small>${escapeHtml(achievement.description || 'No description available.')}</small>
            <div class="meta-row">
              ${adeptBadge(achievement.isAdept)}
              ${renderPinButton(achievement.name)}
            </div>
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

function buildChapterGroups(items) {
  if (!items.length) {
    return '<div class="group-card"><p>No achievements match your current search and filter settings.</p></div>';
  }

  const groups = new Map();
  for (const achievement of items) {
    const chapter = achievement.chapter || 'No chapter tag';
    if (!groups.has(chapter)) groups.set(chapter, []);
    groups.get(chapter).push(achievement);
  }

  return [...groups.entries()].map(([chapter, achievements]) => {
    const unlocked = achievements.filter((item) => item.unlocked).length;
    const ratio = safePercent(unlocked, achievements.length);
    const list = sortAchievements(achievements, 'character').map((achievement) => `
      <div class="chapter-item ${achievement.unlocked ? 'is-unlocked' : 'is-locked'}">
        <div>
          <strong>${escapeHtml(achievement.name)}</strong>
          <small>${escapeHtml(achievement.character || achievement.role)}</small>
        </div>
        <div class="chapter-item-actions">
          ${statusBadge(achievement.unlocked)}
          ${renderPinButton(achievement.name)}
        </div>
      </div>
    `).join('');

    return `
      <article class="group-card">
        <div class="section-header compact">
          <div>
            <p class="eyebrow">Chapter</p>
            <h3>${escapeHtml(chapter)}</h3>
          </div>
          <p class="results-count">${unlocked}/${achievements.length} unlocked</p>
        </div>
        <div class="progress-track"><span class="progress-fill accent-fill-bar" style="width:${ratio}%"></span></div>
        <div class="chapter-items">${list}</div>
      </article>
    `;
  }).join('');
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

function openModal(modal) {
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
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

function renderBrowserView() {
  const useChapterGroups = state.browserView === 'chapter_groups';
  elements.browserTableWrap.classList.toggle('hidden', useChapterGroups);
  elements.browserChapterGroups.classList.toggle('hidden', !useChapterGroups);
  if (useChapterGroups) {
    elements.browserChapterGroups.innerHTML = buildChapterGroups(state.filteredAchievements);
  } else {
    elements.achievementTableBody.innerHTML = buildAchievementRows(state.filteredAchievements, 'No achievements match your current search and filter settings.');
  }
}

function filterAchievements() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const sortMode = elements.sortSelect.value;
  const statusMode = elements.statusFilter.value;
  const roleMode = elements.roleFilter.value;
  const excludeAdepts = elements.excludeAdepts.checked;
  state.browserView = elements.browserViewSelect.value;

  syncQuickRoleButtons(roleMode);

  const filtered = state.achievements.filter((achievement) => {
    if (statusMode === 'unlocked' && !achievement.unlocked) return false;
    if (statusMode === 'locked' && achievement.unlocked) return false;
    if (roleMode !== 'all' && achievement.role !== roleMode) return false;
    if (excludeAdepts && achievement.isAdept) return false;
    if (!query) return true;
    const haystack = [achievement.name, achievement.description, achievement.role, achievement.character, achievement.chapter, achievement.unlocked ? 'unlocked' : 'locked'].join(' ').toLowerCase();
    return haystack.includes(query);
  });

  state.filteredAchievements = sortAchievements(filtered, sortMode);
  elements.resultsCount.textContent = `${state.filteredAchievements.length} result${state.filteredAchievements.length === 1 ? '' : 's'}`;
  updateBrowserVisibleStats(state.filteredAchievements);
  renderBrowserView();
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
    const haystack = [achievement.name, achievement.description, achievement.character, achievement.role, achievement.chapter].join(' ').toLowerCase();
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
      ${renderPinButton(randomAchievement.name)}
    </div>
    <div class="character-spotlight">
      ${portraitImageTag(randomAchievement.character, `${randomAchievement.character || 'Character'} portrait`, 'portrait-medium')}
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
  state.currentSummary = summary;
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

function setAdminControlsDisabled(disabled) {
  if (!adminEnabled) return;
  [
    elements.adminClearProfileCache,
    elements.adminClearGlobalCache,
    elements.adminClearAllCache,
    elements.adminAchievementSelect,
    elements.adminRoleSelect,
    elements.adminCharacterInput,
    elements.adminChapterInput,
    elements.adminReleaseOrderInput,
    elements.adminDescriptionInput,
    elements.adminSaveOverride,
    elements.adminRemoveOverride,
    elements.adminSaveReload,
  ].forEach((element) => {
    if (element) element.disabled = disabled;
  });
}

function updateAdminCacheSummary(status) {
  if (!adminEnabled || !status) return;
  const cache = status.cache || {};
  elements.adminCacheSummary.textContent = `Global cache: ${cache.globalCacheExists ? 'yes' : 'no'} • Profile caches: ${cache.profileCacheCount ?? 0} • Overrides: ${status.overrideCount ?? 0}`;
}

function populateAdminAchievementSelect() {
  if (!adminEnabled) return;
  const options = sortAchievements(state.achievements, 'name_asc');
  if (!options.length) {
    elements.adminAchievementSelect.innerHTML = '<option value="">Load a profile first</option>';
    return;
  }
  elements.adminAchievementSelect.innerHTML = ['<option value="">Choose an achievement</option>']
    .concat(options.map((achievement) => `<option value="${escapeHtml(achievement.name)}">${escapeHtml(achievement.name)}</option>`))
    .join('');
}

function fillAdminFormFromAchievement(achievementName) {
  if (!adminEnabled) return;
  const achievement = state.achievements.find((item) => item.name === achievementName);
  if (!achievement) {
    elements.adminRoleSelect.value = '';
    elements.adminCharacterInput.value = '';
    elements.adminChapterInput.value = '';
    elements.adminReleaseOrderInput.value = '';
    elements.adminDescriptionInput.value = '';
    return;
  }
  elements.adminRoleSelect.value = achievement.role || '';
  elements.adminCharacterInput.value = achievement.character || '';
  elements.adminChapterInput.value = achievement.chapter || '';
  elements.adminReleaseOrderInput.value = achievement.releaseOrder ?? '';
  elements.adminDescriptionInput.value = achievement.description || '';
}

async function fetchAdminStatus() {
  if (!adminEnabled) return null;
  const response = await fetch('/api/admin/status');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to load admin status.');
  state.admin.status = data;
  updateAdminCacheSummary(data);
  return data;
}

async function clearCache(target) {
  const profile = state.currentProfile?.input || '';
  const response = await fetch('/api/admin/cache/clear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target, profile }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to clear cache.');
  state.admin.status = { ...(state.admin.status || {}), cache: data.cache, overrideCount: state.admin.status?.overrideCount ?? 0 };
  updateAdminCacheSummary(state.admin.status);
  return data;
}

async function saveOverride(shouldReload = false) {
  const achievementName = elements.adminAchievementSelect.value;
  if (!achievementName) {
    showMessage('Choose an achievement first in Admin Tools.', 'error');
    return;
  }

  const payload = {
    achievementName,
    role: elements.adminRoleSelect.value,
    character: elements.adminCharacterInput.value,
    chapter: elements.adminChapterInput.value,
    releaseOrder: elements.adminReleaseOrderInput.value,
    description: elements.adminDescriptionInput.value,
  };

  setAdminControlsDisabled(true);
  try {
    const response = await fetch('/api/admin/overrides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to save override.');

    if (state.admin.status) {
      state.admin.status.overrideCount = data.overrideCount;
      updateAdminCacheSummary(state.admin.status);
    }

    if (shouldReload && state.currentProfile?.input) {
      await loadAchievements(state.currentProfile.input, true);
      elements.adminAchievementSelect.value = achievementName;
      fillAdminFormFromAchievement(achievementName);
    }

    showMessage(data.message || 'Override saved.', 'success');
  } catch (error) {
    showMessage(error.message || 'Failed to save override.', 'error');
  } finally {
    setAdminControlsDisabled(false);
  }
}

async function removeOverride() {
  const achievementName = elements.adminAchievementSelect.value;
  if (!achievementName) {
    showMessage('Choose an achievement first in Admin Tools.', 'error');
    return;
  }

  setAdminControlsDisabled(true);
  try {
    const response = await fetch('/api/admin/overrides', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ achievementName }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to remove override.');

    if (state.admin.status) {
      state.admin.status.overrideCount = data.overrideCount;
      updateAdminCacheSummary(state.admin.status);
    }

    if (state.currentProfile?.input) {
      await loadAchievements(state.currentProfile.input, true);
      elements.adminAchievementSelect.value = achievementName;
      fillAdminFormFromAchievement(achievementName);
    }

    showMessage(data.message || 'Override removed.', 'success');
  } catch (error) {
    showMessage(error.message || 'Failed to remove override.', 'error');
  } finally {
    setAdminControlsDisabled(false);
  }
}

async function openAdminModal() {
  if (!adminEnabled) return;
  openModal(elements.adminModal);
  setAdminControlsDisabled(true);
  try {
    await fetchAdminStatus();
    populateAdminAchievementSelect();
  } catch (error) {
    showMessage(error.message || 'Failed to open admin tools.', 'error');
  } finally {
    setAdminControlsDisabled(false);
  }
}

function upsertCompareProfile(entry) {
  const key = entry.resolvedProfileUrl || entry.input || entry.profileName;
  const existingIndex = state.compareProfiles.findIndex((item) => (item.resolvedProfileUrl || item.input || item.profileName) === key);
  if (existingIndex >= 0) state.compareProfiles.splice(existingIndex, 1, entry);
  else state.compareProfiles.push(entry);
  state.compareProfiles.sort((a, b) => (b.completionPercent || 0) - (a.completionPercent || 0));
  renderCompareModule();
}

function renderCompareModule() {
  elements.compareCount.textContent = `${state.compareProfiles.length} profile${state.compareProfiles.length === 1 ? '' : 's'}`;
  if (!state.compareProfiles.length) {
    elements.compareTopProfile.textContent = '—';
    elements.compareAverageCompletion.textContent = '0%';
    elements.compareBestAdepts.textContent = '0';
    elements.compareTableBody.innerHTML = '<tr><td colspan="7">No profiles added yet. Add current profile or a friend profile to start comparing.</td></tr>';
    return;
  }

  const average = state.compareProfiles.reduce((sum, profile) => sum + (profile.completionPercent || 0), 0) / state.compareProfiles.length;
  const top = state.compareProfiles[0];
  const bestAdepts = Math.max(...state.compareProfiles.map((profile) => profile.adeptUnlocked || 0));
  elements.compareTopProfile.textContent = top.profileName;
  elements.compareAverageCompletion.textContent = `${average.toFixed(1)}%`;
  elements.compareBestAdepts.textContent = bestAdepts;

  elements.compareTableBody.innerHTML = state.compareProfiles.map((profile, index) => {
    const leader = index === 0 ? ' 🏆' : '';
    const percent = Number(profile.completionPercent || 0);
    const pctWidth = Math.max(0, Math.min(100, percent));
    return `
      <tr>
        <td>
          <strong>${escapeHtml(profile.profileName)}${leader}</strong>
          <div><a href="${escapeHtml(profile.resolvedProfileUrl)}" target="_blank" rel="noreferrer">Open profile</a></div>
        </td>
        <td>
          <div class="global-rate-cell">
            <strong>${escapeHtml(formatPercent(percent))}</strong>
            <div class="mini-progress"><span style="width:${pctWidth}%"></span></div>
          </div>
        </td>
        <td>${escapeHtml(`${profile.unlocked}/${profile.total}`)}</td>
        <td>${escapeHtml(`${profile.adeptUnlocked}/${profile.adeptTotal}`)}</td>
        <td>${escapeHtml(`${profile.killerUnlocked}/${profile.killerTotal}`)}</td>
        <td>${escapeHtml(`${profile.survivorUnlocked}/${profile.survivorTotal}`)}</td>
        <td>
          <div class="chapter-item-actions">
            <button class="mini-action" type="button" data-load-compare="${index}">Load</button>
            <button class="mini-action" type="button" data-remove-compare="${index}">Remove</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function fetchComparisonProfile(profileInput) {
  const response = await fetch('/api/achievements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile: profileInput, forceRefresh: false }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to compare profile.');
  return {
    profileName: data.profile.profileName,
    resolvedProfileUrl: data.profile.resolvedProfileUrl,
    input: profileInput,
    completionPercent: data.summary.completionPercent,
    unlocked: data.summary.unlocked,
    total: data.summary.total,
    adeptUnlocked: data.summary.adept.unlocked,
    adeptTotal: data.summary.adept.total,
    killerUnlocked: data.summary.roles.killer.unlocked,
    killerTotal: data.summary.roles.killer.total,
    survivorUnlocked: data.summary.roles.survivor.unlocked,
    survivorTotal: data.summary.roles.survivor.total,
  };
}

async function addCompareProfileFromInput() {
  const input = elements.compareProfileInput.value.trim();
  if (!input) {
    showMessage('Enter a profile to compare.', 'error');
    return;
  }
  elements.compareAddButton.disabled = true;
  try {
    const entry = await fetchComparisonProfile(input);
    upsertCompareProfile(entry);
    elements.compareProfileInput.value = '';
    showMessage(`Added ${entry.profileName} to compare mode.`, 'success');
  } catch (error) {
    showMessage(error.message || 'Failed to compare profile.', 'error');
  } finally {
    elements.compareAddButton.disabled = false;
  }
}

function addCurrentProfileToCompare() {
  if (!state.currentProfile || !state.currentSummary) {
    showMessage('Load a profile first before adding it to compare mode.', 'error');
    return;
  }
  upsertCompareProfile({
    profileName: state.currentProfile.profileName,
    resolvedProfileUrl: state.currentProfile.resolvedProfileUrl,
    input: state.currentProfile.input,
    completionPercent: state.currentSummary.completionPercent,
    unlocked: state.currentSummary.unlocked,
    total: state.currentSummary.total,
    adeptUnlocked: state.currentSummary.adept.unlocked,
    adeptTotal: state.currentSummary.adept.total,
    killerUnlocked: state.currentSummary.roles.killer.unlocked,
    killerTotal: state.currentSummary.roles.killer.total,
    survivorUnlocked: state.currentSummary.roles.survivor.unlocked,
    survivorTotal: state.currentSummary.roles.survivor.total,
  });
  showMessage(`Added ${state.currentProfile.profileName} to compare mode.`, 'success');
}

function removeCompareProfile(index) {
  state.compareProfiles.splice(index, 1);
  renderCompareModule();
}

function loadCompareProfileIntoMain(index) {
  const profile = state.compareProfiles[index];
  if (!profile) return;
  elements.profileInput.value = profile.input || profile.resolvedProfileUrl || '';
  loadAchievements(elements.profileInput.value, false);
}

function clearCompareProfiles() {
  state.compareProfiles = [];
  renderCompareModule();
}

function resolvePinnedGoalAchievements() {
  const byName = new Map(state.achievements.map((achievement) => [achievement.name, achievement]));
  return state.pinnedGoals.map((name) => byName.get(name)).filter(Boolean);
}

function renderGoalsModule() {
  const goals = resolvePinnedGoalAchievements();
  elements.goalsCount.textContent = `${goals.length} goal${goals.length === 1 ? '' : 's'}`;

  if (!goals.length) {
    elements.goalsList.innerHTML = '<div class="goal-card"><p>No pinned goals yet. Use “Pin goal” in Browser or Adepts.</p></div>';
    return;
  }

  elements.goalsList.innerHTML = sortAchievements(goals, 'locked_first').map((achievement) => `
    <article class="goal-card ${achievement.unlocked ? 'done' : 'todo'}">
      <div class="goal-card-top">
        ${portraitImageTag(achievement.character, `${achievement.character || 'Character'} portrait`, 'portrait-medium')}
        <div>
          <p class="eyebrow">${escapeHtml(achievement.chapter || 'No chapter tag')}</p>
          <h3>${escapeHtml(achievement.name)}</h3>
          <div class="meta-row">
            ${roleBadge(achievement.role)}
            ${statusBadge(achievement.unlocked)}
            ${adeptBadge(achievement.isAdept)}
          </div>
        </div>
      </div>
      <p class="goal-description">${escapeHtml(achievement.description || '')}</p>
      <div class="module-actions left-actions">
        <button class="mini-action active" type="button" data-pin-achievement="${escapeHtml(achievement.name)}">Remove from queue</button>
      </div>
    </article>
  `).join('');
}

function randomGoalFromQueue() {
  const goals = resolvePinnedGoalAchievements();
  if (!goals.length) {
    elements.goalsRandomCard.classList.add('empty');
    elements.goalsRandomCard.innerHTML = '<p>Pin some achievements first, then pick a random queue goal.</p>';
    return;
  }

  const lockedGoals = goals.filter((goal) => !goal.unlocked);
  const source = lockedGoals.length ? lockedGoals : goals;
  const randomAchievement = source[Math.floor(Math.random() * source.length)];
  elements.goalsRandomCard.classList.remove('empty');
  elements.goalsRandomCard.innerHTML = `
    <div class="random-card-header">
      <div>
        <p class="eyebrow">Queue pick</p>
        <h3>${escapeHtml(randomAchievement.name)}</h3>
      </div>
      ${portraitImageTag(randomAchievement.character, `${randomAchievement.character || 'Character'} portrait`, 'random-icon')}
    </div>
    <div class="meta-row">
      ${roleBadge(randomAchievement.role)}
      ${statusBadge(randomAchievement.unlocked)}
      ${adeptBadge(randomAchievement.isAdept)}
    </div>
    <p>${escapeHtml(randomAchievement.description || '')}</p>
  `;
}

function recommendGoal() {
  const focus = elements.goalsFocusSelect.value;
  const mode = elements.goalsModeSelect.value;

  let locked = state.achievements.filter((achievement) => !achievement.unlocked);
  if (focus === 'adept') locked = locked.filter((achievement) => achievement.isAdept);
  else if (focus !== 'any') locked = locked.filter((achievement) => achievement.role === focus);

  if (!locked.length) {
    elements.goalsSmartCard.classList.add('empty');
    elements.goalsSmartCard.innerHTML = '<p>No locked achievements match that smart picker filter.</p>';
    return;
  }

  let sorted = [...locked];
  let label = 'Balanced recommendation';
  if (mode === 'quick') {
    sorted = sortAchievements(sorted, 'commonest');
    label = 'Quick win recommendation';
  } else if (mode === 'rarest') {
    sorted = sortAchievements(sorted, 'rarest');
    label = 'Rarest target recommendation';
  } else if (mode === 'grindy') {
    sorted = sortAchievements(sorted, 'name_desc');
    label = 'Big grind recommendation';
  } else {
    sorted = sortAchievements(sorted, focus === 'adept' ? 'rarest' : 'locked_first');
  }

  const topPool = sorted.slice(0, Math.min(8, sorted.length));
  const recommendation = topPool[Math.floor(Math.random() * topPool.length)];
  elements.goalsSmartCard.classList.remove('empty');
  elements.goalsSmartCard.innerHTML = `
    <div class="random-card-header">
      <div>
        <p class="eyebrow">${escapeHtml(label)}</p>
        <h3>${escapeHtml(recommendation.name)}</h3>
      </div>
      ${portraitImageTag(recommendation.character, `${recommendation.character || 'Character'} portrait`, 'random-icon')}
    </div>
    <div class="meta-row">
      ${roleBadge(recommendation.role)}
      ${statusBadge(recommendation.unlocked)}
      ${adeptBadge(recommendation.isAdept)}
      ${renderPinButton(recommendation.name)}
    </div>
    <p>${escapeHtml(recommendation.description || '')}</p>
    <p><strong>Why this pick:</strong> ${mode === 'quick' ? 'more common / easier to clean up soon' : mode === 'rarest' ? 'rarer target for a brag-worthy grind' : mode === 'grindy' ? 'likely a longer grind target to chip away at' : 'a balanced recommendation from your current locked list'}.</p>
  `;
}

function renderRoleChart() {
  if (!state.currentSummary) {
    elements.roleChart.innerHTML = '<p class="subtle">Load a profile to see the role chart.</p>';
    return;
  }

  const entries = [
    { label: 'Killer', color: '#ff7d7d', unlocked: state.currentSummary.roles.killer.unlocked, total: state.currentSummary.roles.killer.total },
    { label: 'Survivor', color: '#59dfb4', unlocked: state.currentSummary.roles.survivor.unlocked, total: state.currentSummary.roles.survivor.total },
    { label: 'General', color: '#84a6ff', unlocked: state.currentSummary.roles.general.unlocked, total: state.currentSummary.roles.general.total },
    { label: 'Adepts', color: '#ffcd66', unlocked: state.currentSummary.adept.unlocked, total: state.currentSummary.adept.total },
  ];

  const barHeight = 28;
  const gap = 18;
  const svgHeight = entries.length * (barHeight + gap) + 20;
  const rows = entries.map((entry, index) => {
    const y = index * (barHeight + gap) + 10;
    const width = Math.max(0, Math.min(100, safePercent(entry.unlocked, entry.total)));
    return `
      <text x="0" y="${y + 18}" fill="#d7e1f7" font-size="14" font-family="Inter, Segoe UI, Arial">${entry.label}</text>
      <rect x="120" y="${y}" width="420" height="${barHeight}" rx="14" fill="rgba(255,255,255,0.08)" />
      <rect x="120" y="${y}" width="${(420 * width) / 100}" height="${barHeight}" rx="14" fill="${entry.color}" />
      <text x="550" y="${y + 18}" fill="#d7e1f7" font-size="13" font-family="Inter, Segoe UI, Arial">${entry.unlocked}/${entry.total} (${width.toFixed(1)}%)</text>
    `;
  }).join('');

  elements.roleChart.innerHTML = `
    <svg viewBox="0 0 700 ${svgHeight}" class="chart-svg" role="img" aria-label="Role completion chart">
      ${rows}
    </svg>
  `;
}

function renderRarityChart() {
  if (!state.achievements.length) {
    elements.rarityChart.innerHTML = '<p class="subtle">Load a profile to see the rarity breakdown.</p>';
    return;
  }

  const buckets = [
    { label: 'Ultra rare', min: 0, max: 2 },
    { label: 'Rare', min: 2, max: 5 },
    { label: 'Uncommon', min: 5, max: 15 },
    { label: 'Common', min: 15, max: 101 },
  ];

  const rows = buckets.map((bucket) => {
    const list = state.achievements.filter((achievement) => {
      const pct = Number(achievement.globalPercent ?? -1);
      return pct >= bucket.min && pct < bucket.max;
    });
    const unlocked = list.filter((achievement) => achievement.unlocked).length;
    return { ...bucket, total: list.length, unlocked, pct: safePercent(unlocked, list.length) };
  });

  elements.rarityChart.innerHTML = rows.map((row) => `
    <div class="rarity-row">
      <div>
        <strong>${escapeHtml(row.label)}</strong>
        <small>${row.unlocked}/${row.total} unlocked</small>
      </div>
      <div class="progress-track"><span class="progress-fill accent-fill-bar" style="width:${row.pct}%"></span></div>
      <strong>${row.pct.toFixed(1)}%</strong>
    </div>
  `).join('');
}

function renderHeatmap() {
  const unlocked = state.achievements.filter((achievement) => achievement.unlocked && achievement.unlockDate);
  if (!unlocked.length) {
    elements.unlockHeatmap.innerHTML = '<p class="subtle">No unlock-date data available yet.</p>';
    return;
  }

  const counts = new Map();
  for (const achievement of unlocked) {
    const date = new Date(achievement.unlockDate);
    if (Number.isNaN(date.getTime())) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const maxCount = Math.max(...counts.values(), 1);
  const html = [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => {
      const opacity = 0.18 + (count / maxCount) * 0.82;
      return `
        <div class="heatmap-cell" style="--cell-opacity:${opacity}">
          <strong>${escapeHtml(month)}</strong>
          <span>${count} unlock${count === 1 ? '' : 's'}</span>
        </div>
      `;
    })
    .join('');

  elements.unlockHeatmap.innerHTML = html;
}

function renderChapterSummary() {
  if (!state.achievements.length) {
    elements.chapterSummaryList.innerHTML = '<p class="subtle">Load a profile to see chapter grouping stats.</p>';
    return;
  }

  const groups = new Map();
  for (const achievement of state.achievements) {
    const chapter = achievement.chapter || 'No chapter tag';
    if (!groups.has(chapter)) groups.set(chapter, []);
    groups.get(chapter).push(achievement);
  }

  const html = [...groups.entries()]
    .map(([chapter, list]) => {
      const unlocked = list.filter((item) => item.unlocked).length;
      return { chapter, list, unlocked, total: list.length, pct: safePercent(unlocked, list.length) };
    })
    .sort((a, b) => b.pct - a.pct || a.chapter.localeCompare(b.chapter))
    .map((group) => `
      <article class="chapter-summary-card">
        <div class="section-header compact">
          <div>
            <h3>${escapeHtml(group.chapter)}</h3>
            <p class="results-count">${group.unlocked}/${group.total} unlocked</p>
          </div>
          <strong>${group.pct.toFixed(1)}%</strong>
        </div>
        <div class="progress-track"><span class="progress-fill accent-fill-bar" style="width:${group.pct}%"></span></div>
      </article>
    `)
    .join('');

  elements.chapterSummaryList.innerHTML = html;
}

function renderInsights() {
  renderRoleChart();
  renderRarityChart();
  renderHeatmap();
  renderChapterSummary();
}

function renderAllDataViews() {
  filterAchievements();
  filterAdeptBrowser();
  updateRandomModule(false);
  renderGoalsModule();
  renderInsights();
  if (adminEnabled) populateAdminAchievementSelect();
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  if (elements.themeSelect) elements.themeSelect.value = theme;
}

function hydrateTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'default';
  applyTheme(savedTheme);
}

function persistTheme(theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
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
    renderAllDataViews();

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

function attachDelegatedPinHandlers() {
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const pinButton = target.closest('[data-pin-achievement]');
    if (pinButton) {
      togglePinnedGoal(pinButton.getAttribute('data-pin-achievement'));
      return;
    }

    const removeCompare = target.closest('[data-remove-compare]');
    if (removeCompare) {
      removeCompareProfile(Number(removeCompare.getAttribute('data-remove-compare')));
      return;
    }

    const loadCompare = target.closest('[data-load-compare]');
    if (loadCompare) {
      loadCompareProfileIntoMain(Number(loadCompare.getAttribute('data-load-compare')));
    }
  });
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
    if (!elements.profileInput.value.trim()) elements.profileInput.value = profile;
    loadAchievements(profile, true);
  });

  elements.themeSelect.addEventListener('change', () => persistTheme(elements.themeSelect.value));

  elements.aboutButton.addEventListener('click', () => openModal(elements.aboutModal));
  elements.aboutCloseButton.addEventListener('click', () => closeModal(elements.aboutModal));
  elements.aboutModal.addEventListener('click', (event) => {
    if (event.target === elements.aboutModal) closeModal(elements.aboutModal);
  });

  if (adminEnabled) {
    elements.adminButton.addEventListener('click', openAdminModal);
    elements.adminCloseButton.addEventListener('click', () => closeModal(elements.adminModal));
    elements.adminModal.addEventListener('click', (event) => {
      if (event.target === elements.adminModal) closeModal(elements.adminModal);
    });
    elements.adminAchievementSelect.addEventListener('change', () => fillAdminFormFromAchievement(elements.adminAchievementSelect.value));
    elements.adminClearProfileCache.addEventListener('click', async () => {
      try {
        const data = await clearCache('profiles');
        showMessage(`Profile cache cleared (${data.clearedProfiles}).`, 'success');
      } catch (error) {
        showMessage(error.message || 'Failed to clear profile cache.', 'error');
      }
    });
    elements.adminClearGlobalCache.addEventListener('click', async () => {
      try {
        await clearCache('global');
        showMessage('Global cache cleared.', 'success');
      } catch (error) {
        showMessage(error.message || 'Failed to clear global cache.', 'error');
      }
    });
    elements.adminClearAllCache.addEventListener('click', async () => {
      try {
        const data = await clearCache('all');
        showMessage(`All caches cleared. Profile caches removed: ${data.clearedProfiles}.`, 'success');
      } catch (error) {
        showMessage(error.message || 'Failed to clear caches.', 'error');
      }
    });
    elements.adminSaveOverride.addEventListener('click', () => saveOverride(false));
    elements.adminSaveReload.addEventListener('click', () => saveOverride(true));
    elements.adminRemoveOverride.addEventListener('click', removeOverride);
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal(elements.aboutModal);
      if (adminEnabled) closeModal(elements.adminModal);
    }
  });

  [elements.searchInput, elements.sortSelect, elements.statusFilter, elements.roleFilter, elements.excludeAdepts, elements.browserViewSelect].forEach((element) => {
    element.addEventListener('input', filterAchievements);
    element.addEventListener('change', filterAchievements);
  });

  elements.quickRoleButtons.forEach((button) => button.addEventListener('click', () => setQuickRole(button.dataset.roleQuick)));
  [elements.adeptSearchInput, elements.adeptSortSelect, elements.adeptStatusFilter].forEach((element) => {
    element.addEventListener('input', filterAdeptBrowser);
    element.addEventListener('change', filterAdeptBrowser);
  });
  elements.adeptBrowserRoleButtons.forEach((button) => button.addEventListener('click', () => setAdeptBrowserRole(button.dataset.adeptBrowserRole)));
  elements.randomRoleButtons.forEach((button) => button.addEventListener('click', () => setRandomRole(button.dataset.randomRole)));
  elements.moduleTabs.forEach((button) => button.addEventListener('click', () => setActiveModule(button.dataset.moduleTarget)));
  elements.randomAdeptButton.addEventListener('click', pickRandomLockedAdept);
  elements.exportBrowserCsv.addEventListener('click', () => exportDataset(state.filteredAchievements, 'csv', 'achievement-browser'));
  elements.exportBrowserJson.addEventListener('click', () => exportDataset(state.filteredAchievements, 'json', 'achievement-browser'));
  elements.exportAdeptCsv.addEventListener('click', () => exportDataset(state.filteredAdepts, 'csv', 'adept-browser'));
  elements.exportAdeptJson.addEventListener('click', () => exportDataset(state.filteredAdepts, 'json', 'adept-browser'));

  elements.goalsRecommendButton.addEventListener('click', recommendGoal);
  elements.goalsRandomButton.addEventListener('click', randomGoalFromQueue);
  elements.goalsClearButton.addEventListener('click', () => {
    state.pinnedGoals = [];
    savePinnedGoals();
    renderAllDataViews();
  });

  elements.compareAddButton.addEventListener('click', addCompareProfileFromInput);
  elements.compareAddCurrentButton.addEventListener('click', addCurrentProfileToCompare);
  elements.compareClearButton.addEventListener('click', clearCompareProfiles);

  attachDelegatedPinHandlers();
}

attachEvents();
hydrateTheme();
renderGoalsModule();
renderCompareModule();
renderInsights();
setQuickRole('all');
setAdeptBrowserRole('killer');
setRandomRole('killer');
setActiveModule('browser');
