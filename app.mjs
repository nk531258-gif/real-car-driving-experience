import {
  getClockSnapshot,
  getDefaultZones,
  isValidTimeZone,
  zoneLabel
} from './clock-utils.mjs';

const clocks = new Set(getDefaultZones());

const selectEl = document.getElementById('timezone-select');
const addButton = document.getElementById('add-clock');
const listEl = document.getElementById('clock-list');
const statusEl = document.getElementById('status');
const hour24El = document.getElementById('setting-24h');
const secondsEl = document.getElementById('setting-seconds');

function allTimeZones() {
  if (typeof Intl.supportedValuesOf === 'function') {
    return Intl.supportedValuesOf('timeZone');
  }

  return Array.from(clocks);
}

function updateStatus(message = '') {
  statusEl.textContent = message;
}

function options() {
  return {
    hour12: !hour24El.checked,
    showSeconds: secondsEl.checked
  };
}

function renderSelect() {
  const zones = allTimeZones();
  selectEl.innerHTML = '';

  for (const zone of zones) {
    const option = document.createElement('option');
    option.value = zone;
    option.textContent = zone;
    selectEl.append(option);
  }

  selectEl.value = zones.includes('UTC') ? 'UTC' : zones[0] || '';
}

function renderClocks() {
  const now = new Date();
  listEl.innerHTML = '';

  for (const zone of clocks) {
    const item = document.createElement('li');
    item.className = 'clock-card';

    if (!isValidTimeZone(zone)) {
      item.innerHTML = `
        <div class="clock-card__title">
          <span class="clock-card__city">${zoneLabel(zone)}</span>
          <span class="clock-card__zone">${zone}</span>
        </div>
        <p class="clock-meta">This time zone is not supported by your browser.</p>
      `;
      listEl.append(item);
      continue;
    }

    const snapshot = getClockSnapshot(now, zone, options());

    item.innerHTML = `
      <div class="clock-card__title">
        <span class="clock-card__city">${zoneLabel(zone)}</span>
        <span class="badge">${snapshot.phase}</span>
      </div>
      <div class="clock-card__zone">${zone}</div>
      <div class="clock-time">${snapshot.time}</div>
      <div class="clock-meta">${snapshot.dateText}</div>
      <div class="clock-meta">${snapshot.utcOffset}</div>
      <button type="button" class="clock-remove" aria-label="Remove ${zone}">Remove</button>
    `;

    const removeButton = item.querySelector('.clock-remove');
    removeButton?.addEventListener('click', () => {
      clocks.delete(zone);
      renderClocks();
      updateStatus(`Removed ${zone}.`);
    });

    listEl.append(item);
  }
}

function addClock() {
  const zone = selectEl.value.trim();

  if (!zone) {
    updateStatus('Please choose a time zone.');
    return;
  }

  if (!isValidTimeZone(zone)) {
    updateStatus(`Unsupported time zone: ${zone}`);
    return;
  }

  if (clocks.has(zone)) {
    updateStatus(`${zone} is already added.`);
    return;
  }

  clocks.add(zone);
  renderClocks();
  updateStatus(`Added ${zone}.`);
}

addButton.addEventListener('click', addClock);
selectEl.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    addClock();
  }
});
hour24El.addEventListener('change', renderClocks);
secondsEl.addEventListener('change', renderClocks);

renderSelect();
renderClocks();
setInterval(renderClocks, 1000);
