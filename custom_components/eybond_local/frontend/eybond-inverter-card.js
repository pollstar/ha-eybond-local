/*
 * EyeBond Inverter Card — Lovelace card for EyeBond Local hybrid inverters.
 *
 * Served by the eybond_local integration; no extra resource is needed.
 *   type: custom:eybond-inverter-card
 *   device: pi30_6200        # optional, object-id prefix; auto-detected
 *   title: Инвертор          # optional
 *   show_controls: true      # optional
 *
 * Vanilla JS, no dependencies. Every value comes from the integration's
 * entities; the card only calls select / number / switch services.
 */

const CARD_VERSION = "0.1.0";
const INTEGRATION = "eybond_local";

const I18N = {
  en: {
    solar: "Solar", grid: "Grid", battery: "Battery", home: "Home",
    no_grid: "No grid", charging: "Charging", discharging: "Discharging", idle: "Idle",
    output_priority: "Output priority", charge_priority: "Charge source",
    settings: "Settings", stats: "Statistics", close: "Close",
    priorities: "Priorities", charge_current: "Charge current",
    max_utility_current: "Max grid charge current", max_total_current: "Max total charge current",
    battery_section: "Battery", battery_type: "Battery type",
    battery_warning: "Change only if you know your battery's specifications.",
    inverter_section: "Inverter", input_range: "AC input range",
    apply: "Apply", today: "Today", now: "Now",
    pv_energy: "Solar", load_energy: "Consumption", batt_in: "Battery charge",
    batt_out: "Battery discharge", grid_in: "From grid", grid_out: "To grid",
    output: "Output", load: "Load", temperature: "Temperature", bus: "DC bus",
    pv_input: "PV input", grid_input: "Grid input", battery_now: "Battery",
    model: "Model", not_found: "No EyeBond Local inverter found. Set `device:` in the card config.",
    write_failed: "Failed to change setting",
    out_hint: { "Utility first": "Grid → Solar → Battery", "Solar first": "Solar → Grid → Battery", "SBU first": "Solar → Battery → Grid" },
    out_label: { "Utility first": "Grid", "Solar first": "Solar", "SBU first": "SBU" },
    chg_label: { "Utility first": "Grid first", "Solar first": "Solar first", "Solar + Utility": "Solar + grid", "Only solar charging permitted": "Solar only" },
    modes: { "Power on": "Starting", "Standby": "Standby", "Line": "On grid", "Battery": "On battery", "Fault": "Fault", "Power saving": "Power saving" },
    switches: {
      buzzer_enabled: "Buzzer", lcd_backlight_enabled: "LCD backlight", power_saving_enabled: "Power saving",
      overload_bypass_enabled: "Overload bypass", overload_restart_enabled: "Restart after overload",
      over_temperature_restart_enabled: "Restart after overheat",
    },
    numbers: {
      battery_bulk_voltage: "Bulk (CV) voltage", battery_float_voltage: "Float voltage",
      battery_cut_off_voltage: "Cut-off voltage", battery_recharge_voltage: "Back to grid at",
      battery_redischarge_voltage: "Back to battery at",
    },
  },
  ru: {
    solar: "Солнце", grid: "Сеть", battery: "АКБ", home: "Дом",
    no_grid: "Нет сети", charging: "Заряд", discharging: "Разряд", idle: "Покой",
    output_priority: "Приоритет питания", charge_priority: "Источник заряда",
    settings: "Настройки", stats: "Статистика", close: "Закрыть",
    priorities: "Приоритеты", charge_current: "Ток заряда",
    max_utility_current: "Макс. ток заряда от сети", max_total_current: "Макс. общий ток заряда",
    battery_section: "Аккумулятор", battery_type: "Тип АКБ",
    battery_warning: "Меняйте, только если знаете параметры своей АКБ.",
    inverter_section: "Инвертор", input_range: "Диапазон входа AC",
    apply: "Применить", today: "Сегодня", now: "Сейчас",
    pv_energy: "Солнце", load_energy: "Потребление", batt_in: "Заряд АКБ",
    batt_out: "Разряд АКБ", grid_in: "Из сети", grid_out: "В сеть",
    output: "Выход", load: "Нагрузка", temperature: "Температура", bus: "Шина DC",
    pv_input: "Вход PV", grid_input: "Вход сети", battery_now: "АКБ",
    model: "Модель", not_found: "Инвертор EyeBond Local не найден. Укажите `device:` в настройках карточки.",
    write_failed: "Не удалось изменить настройку",
    out_hint: { "Utility first": "Сеть → Солнце → АКБ", "Solar first": "Солнце → Сеть → АКБ", "SBU first": "Солнце → АКБ → Сеть" },
    out_label: { "Utility first": "Сеть", "Solar first": "Солнце", "SBU first": "SBU" },
    chg_label: { "Utility first": "Сначала сеть", "Solar first": "Сначала солнце", "Solar + Utility": "Солнце + сеть", "Only solar charging permitted": "Только солнце" },
    modes: { "Power on": "Запуск", "Standby": "Ожидание", "Line": "От сети", "Battery": "От АКБ", "Fault": "Авария", "Power saving": "Энергосбережение" },
    switches: {
      buzzer_enabled: "Звуковой сигнал", lcd_backlight_enabled: "Подсветка дисплея", power_saving_enabled: "Энергосбережение",
      overload_bypass_enabled: "Байпас при перегрузке", overload_restart_enabled: "Перезапуск после перегрузки",
      over_temperature_restart_enabled: "Перезапуск после перегрева",
    },
    numbers: {
      battery_bulk_voltage: "Напряжение заряда (CV)", battery_float_voltage: "Напряжение поддержки",
      battery_cut_off_voltage: "Отсечка разряда", battery_recharge_voltage: "Возврат на сеть при",
      battery_redischarge_voltage: "Возврат на АКБ при",
    },
  },
  uk: {
    solar: "Сонце", grid: "Мережа", battery: "АКБ", home: "Дім",
    no_grid: "Немає мережі", charging: "Заряд", discharging: "Розряд", idle: "Спокій",
    output_priority: "Пріоритет живлення", charge_priority: "Джерело заряду",
    settings: "Налаштування", stats: "Статистика", close: "Закрити",
    priorities: "Пріоритети", charge_current: "Струм заряду",
    max_utility_current: "Макс. струм заряду від мережі", max_total_current: "Макс. загальний струм заряду",
    battery_section: "Акумулятор", battery_type: "Тип АКБ",
    battery_warning: "Змінюйте, лише якщо знаєте параметри своєї АКБ.",
    inverter_section: "Інвертор", input_range: "Діапазон входу AC",
    apply: "Застосувати", today: "Сьогодні", now: "Зараз",
    pv_energy: "Сонце", load_energy: "Споживання", batt_in: "Заряд АКБ",
    batt_out: "Розряд АКБ", grid_in: "З мережі", grid_out: "У мережу",
    output: "Вихід", load: "Навантаження", temperature: "Температура", bus: "Шина DC",
    pv_input: "Вхід PV", grid_input: "Вхід мережі", battery_now: "АКБ",
    model: "Модель", not_found: "Інвертор EyeBond Local не знайдено. Вкажіть `device:` у налаштуваннях картки.",
    write_failed: "Не вдалося змінити налаштування",
    out_hint: { "Utility first": "Мережа → Сонце → АКБ", "Solar first": "Сонце → Мережа → АКБ", "SBU first": "Сонце → АКБ → Мережа" },
    out_label: { "Utility first": "Мережа", "Solar first": "Сонце", "SBU first": "SBU" },
    chg_label: { "Utility first": "Спершу мережа", "Solar first": "Спершу сонце", "Solar + Utility": "Сонце + мережа", "Only solar charging permitted": "Лише сонце" },
    modes: { "Power on": "Запуск", "Standby": "Очікування", "Line": "Від мережі", "Battery": "Від АКБ", "Fault": "Аварія", "Power saving": "Енергозбереження" },
    switches: {
      buzzer_enabled: "Звуковий сигнал", lcd_backlight_enabled: "Підсвітка дисплея", power_saving_enabled: "Енергозбереження",
      overload_bypass_enabled: "Байпас при перевантаженні", overload_restart_enabled: "Перезапуск після перевантаження",
      over_temperature_restart_enabled: "Перезапуск після перегріву",
    },
    numbers: {
      battery_bulk_voltage: "Напруга заряду (CV)", battery_float_voltage: "Напруга підтримки",
      battery_cut_off_voltage: "Відсічка розряду", battery_recharge_voltage: "Повернення на мережу при",
      battery_redischarge_voltage: "Повернення на АКБ при",
    },
  },
};

const SWITCH_KEYS = [
  "buzzer_enabled", "lcd_backlight_enabled", "power_saving_enabled",
  "overload_bypass_enabled", "overload_restart_enabled", "over_temperature_restart_enabled",
];
const NUMBER_KEYS = [
  "battery_bulk_voltage", "battery_float_voltage", "battery_cut_off_voltage",
  "battery_recharge_voltage", "battery_redischarge_voltage",
];
const ENERGY_TILES = [
  ["estimated_pv_energy_today", "pv_energy", "mdi:solar-power-variant", "pv"],
  ["estimated_load_energy_today", "load_energy", "mdi:home-lightning-bolt", "home"],
  ["estimated_battery_charge_energy_today", "batt_in", "mdi:battery-arrow-up", "batt"],
  ["estimated_battery_discharge_energy_today", "batt_out", "mdi:battery-arrow-down", "batt"],
  ["estimated_grid_import_energy_today", "grid_in", "mdi:transmission-tower-import", "grid"],
  ["estimated_grid_export_energy_today", "grid_out", "mdi:transmission-tower-export", "grid"],
];
const FLOW_W = 5; // watts below which a path is considered idle
const PENDING_MS = 30000; // PI30 polls slowly; keep the pending hint until readback

const STYLE = `
  :host { --eb-pv:#e8a317; --eb-batt:#2fa866; --eb-grid:#4f86e8; --eb-home:#9a6fd6;
          --eb-track:var(--divider-color,#e0e0e0); --eb-muted:var(--secondary-text-color,#727272);
          --eb-bg:var(--card-background-color,var(--ha-card-background,#fff)); }
  ha-card { padding:16px; overflow:hidden; }
  .hdr { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:10px; }
  .title { font-size:18px; font-weight:500; flex:1 1 auto; min-width:0;
           white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--primary-text-color); }
  .chips { display:flex; gap:6px; flex-wrap:wrap; }
  .chip { display:inline-flex; align-items:center; gap:6px; height:26px; padding:0 10px;
          border-radius:13px; font-size:12px; font-weight:500; cursor:pointer; user-select:none;
          background:color-mix(in srgb,var(--primary-text-color) 7%,transparent); color:var(--primary-text-color); }
  .chip .dot { width:8px; height:8px; border-radius:50%; background:var(--eb-muted); }
  .chip.m-line .dot { background:var(--eb-grid); } .chip.m-battery .dot { background:var(--eb-batt); }
  .chip.m-fault { background:color-mix(in srgb,var(--error-color,#db4437) 15%,transparent); }
  .chip.m-fault .dot { background:var(--error-color,#db4437); }
  .chip.alarm { background:color-mix(in srgb,var(--warning-color,#f4a100) 18%,transparent); }
  .chip.alarm ha-icon { --mdc-icon-size:16px; color:var(--warning-color,#f4a100); }
  [hidden] { display:none !important; }

  .flow { position:relative; width:100%; max-width:440px; margin:0 auto; aspect-ratio:160/120; }
  .flow > svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; }
  .flow .track { fill:none; stroke:var(--eb-track); stroke-width:1.4; }
  .flow .dash { fill:none; stroke-width:1.6; stroke-linecap:round; stroke-dasharray:0.1 5;
                opacity:0; transition:opacity .4s; animation:eb-dash var(--dur,2s) linear infinite; }
  .flow .dash.on { opacity:1; } .flow .dash.rev { animation-direction:reverse; }
  .flow .p-pv { stroke:var(--eb-pv); } .flow .p-batt { stroke:var(--eb-batt); }
  .flow .p-grid { stroke:var(--eb-grid); } .flow .p-home { stroke:var(--eb-home); }
  @keyframes eb-dash { to { stroke-dashoffset:-10.1; } }

  .node { position:absolute; width:max(58px,17%); transform:translate(-50%,-50%); cursor:pointer;
          display:flex; flex-direction:column; align-items:center; }
  .circle { position:relative; width:100%; aspect-ratio:1; border-radius:50%; box-sizing:border-box;
            border:2px solid var(--c); background:var(--eb-bg); display:flex; flex-direction:column;
            align-items:center; justify-content:center; gap:1px; transition:border-color .3s; }
  .node.idle .circle { border-color:var(--eb-track); }
  .circle ha-icon { --mdc-icon-size:clamp(16px,5.2vw,22px); color:var(--c); }
  .node.idle .circle ha-icon { color:var(--eb-muted); }
  .val { font-size:clamp(11px,3.3vw,13px); font-weight:600; line-height:1.1; color:var(--primary-text-color);
         font-variant-numeric:tabular-nums; white-space:nowrap; }
  .cap { position:absolute; left:50%; transform:translateX(-50%); white-space:nowrap; text-align:center;
         font-size:11.5px; line-height:1.25; color:var(--eb-muted); font-variant-numeric:tabular-nums; }
  .cap b { font-weight:500; color:var(--primary-text-color); }
  .node.top .cap { bottom:calc(100% + 4px); } .node.bottom .cap { top:calc(100% + 4px); }
  .n-pv { --c:var(--eb-pv); } .n-grid { --c:var(--eb-grid); } .n-home { --c:var(--eb-home); }
  .n-batt { --c:var(--eb-batt); }
  .n-batt .circle { border:none; padding:3px;
     background:conic-gradient(var(--c) calc(var(--soc,0)*1%), var(--eb-track) 0); }
  .n-batt .circle .inner { width:100%; height:100%; border-radius:50%; background:var(--eb-bg);
     display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; }
  .n-batt.low { --c:var(--error-color,#db4437); }
  .soc { font-size:clamp(13px,4vw,16px); font-weight:700; color:var(--primary-text-color); }
  .hub { position:absolute; left:50%; top:50%; width:11%; aspect-ratio:1; transform:translate(-50%,-50%);
         border-radius:50%; background:var(--eb-bg); border:1.5px solid var(--eb-track);
         display:flex; align-items:center; justify-content:center; cursor:pointer; }
  .hub ha-icon { --mdc-icon-size:clamp(14px,4vw,18px); color:var(--eb-muted); }
  .hub-cap { position:absolute; top:calc(100% + 3px); left:50%; transform:translateX(-50%);
             font-size:11px; color:var(--eb-muted); white-space:nowrap; }

  .ctl { margin-top:14px; }
  .ctl-lbl { display:flex; justify-content:space-between; gap:8px; font-size:12px; color:var(--eb-muted); margin:0 2px 6px; }
  .ctl-lbl .hint { color:var(--primary-text-color); opacity:.75; text-align:right; }
  .seg { display:grid; grid-auto-flow:column; grid-auto-columns:1fr; gap:4px; padding:4px; border-radius:12px;
         background:color-mix(in srgb,var(--primary-text-color) 6%,transparent); }
  .seg.grid2 { grid-auto-flow:row; grid-template-columns:1fr 1fr; }
  .seg button { all:unset; box-sizing:border-box; text-align:center; padding:8px 6px; border-radius:9px;
                font-size:13px; font-weight:500; color:var(--primary-text-color); cursor:pointer;
                transition:background .2s, color .2s; min-height:36px; display:flex; align-items:center; justify-content:center; }
  .seg button:hover { background:color-mix(in srgb,var(--primary-text-color) 6%,transparent); }
  .seg button:focus-visible { outline:2px solid var(--primary-color); outline-offset:1px; }
  .seg button.active { background:var(--primary-color); color:var(--text-primary-color,#fff); }
  .seg button.pending { animation:eb-pulse 1.1s ease-in-out infinite; }
  .seg button:disabled { opacity:.5; cursor:default; }
  @keyframes eb-pulse { 50% { opacity:.45; } }

  .actions { display:flex; justify-content:center; gap:12px; margin-top:14px; }
  .icon-btn { all:unset; box-sizing:border-box; display:inline-flex; align-items:center; gap:8px; cursor:pointer;
              height:40px; padding:0 16px; border-radius:20px; font-size:13px; font-weight:500;
              color:var(--primary-text-color); background:color-mix(in srgb,var(--primary-text-color) 6%,transparent); }
  .icon-btn:hover { background:color-mix(in srgb,var(--primary-text-color) 11%,transparent); }
  .icon-btn:focus-visible { outline:2px solid var(--primary-color); }
  .icon-btn ha-icon { --mdc-icon-size:20px; color:var(--eb-muted); }
  .warn { padding:12px; color:var(--error-color,#db4437); }

  .backdrop { position:fixed; inset:0; z-index:9; background:rgba(0,0,0,.45); display:flex;
              align-items:center; justify-content:center; padding:16px; box-sizing:border-box; }
  .dlg { width:min(480px,100%); max-height:min(86vh,760px); display:flex; flex-direction:column;
         background:var(--eb-bg); color:var(--primary-text-color); border-radius:20px;
         box-shadow:0 12px 40px rgba(0,0,0,.35); overflow:hidden; }
  .dlg header { display:flex; align-items:center; padding:14px 8px 8px 20px; font-size:18px; font-weight:500; }
  .dlg header span { flex:1; }
  .dlg header button { all:unset; cursor:pointer; width:40px; height:40px; border-radius:50%;
                       display:flex; align-items:center; justify-content:center; }
  .dlg header button:hover { background:color-mix(in srgb,var(--primary-text-color) 8%,transparent); }
  .dlg-body { overflow:auto; padding:4px 20px 20px; }
  .sec { margin-top:16px; } .sec:first-child { margin-top:4px; }
  .sec h3 { margin:0 0 8px; font-size:13px; font-weight:600; color:var(--eb-muted); text-transform:uppercase; letter-spacing:.04em; }
  .sec .note { font-size:12px; color:var(--eb-muted); margin:-2px 0 8px; }
  .row { display:flex; align-items:center; gap:10px; min-height:44px; border-bottom:1px solid var(--divider-color,#e0e0e0); }
  .row:last-child { border-bottom:none; }
  .row .lbl { flex:1; font-size:14px; min-width:0; }
  .row select, .row input { font:inherit; font-size:14px; color:var(--primary-text-color); background:transparent;
       border:1px solid var(--divider-color,#ccc); border-radius:8px; padding:6px 8px; }
  .row select { max-width:55%; }
  .row input[type=number] { width:76px; text-align:right; }
  .row .unit { font-size:13px; color:var(--eb-muted); }
  .row .apply { all:unset; cursor:pointer; font-size:13px; font-weight:500; color:var(--primary-color); padding:6px 8px; border-radius:8px; }
  .row .apply:disabled { visibility:hidden; }
  .row.pending { opacity:.55; }
  .tgl { position:relative; width:40px; height:22px; flex:none; }
  .tgl input { position:absolute; opacity:0; inset:0; margin:0; cursor:pointer; }
  .tgl span { position:absolute; inset:0; border-radius:11px; background:var(--eb-track); transition:background .2s; pointer-events:none; }
  .tgl span::after { content:""; position:absolute; top:3px; left:3px; width:16px; height:16px; border-radius:50%;
                     background:#fff; box-shadow:0 1px 2px rgba(0,0,0,.3); transition:transform .2s; }
  .tgl input:checked + span { background:var(--primary-color); }
  .tgl input:checked + span::after { transform:translateX(18px); }
  .tgl input:focus-visible + span { outline:2px solid var(--primary-color); outline-offset:2px; }

  .tiles { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .tile { border-radius:14px; padding:10px 12px; cursor:pointer; display:flex; align-items:center; gap:10px;
          background:color-mix(in srgb,var(--c) 10%,transparent); }
  .tile ha-icon { --mdc-icon-size:22px; color:var(--c); }
  .tile .t-lbl { font-size:12px; color:var(--eb-muted); }
  .tile .t-val { font-size:16px; font-weight:600; font-variant-numeric:tabular-nums; }
  .tile.pv { --c:var(--eb-pv); } .tile.home { --c:var(--eb-home); } .tile.batt { --c:var(--eb-batt); } .tile.grid { --c:var(--eb-grid); }
  .kv { display:flex; justify-content:space-between; gap:12px; padding:9px 0; font-size:14px;
        border-bottom:1px solid var(--divider-color,#e0e0e0); cursor:pointer; }
  .kv:last-child { border-bottom:none; }
  .kv span:last-child { font-variant-numeric:tabular-nums; color:var(--primary-text-color); text-align:right; }
  .kv span:first-child { color:var(--eb-muted); }

  @media (prefers-reduced-motion: reduce) {
    .flow .dash { animation:none; stroke-dasharray:none; opacity:0; }
    .flow .dash.on { opacity:.55; }
    .seg button.pending { animation:none; opacity:.6; }
  }
`;

// The SVG uses a 160×120 viewBox; node centres are mirrored in CSS percentages.
const NODES = {
  pv: { x: 30, y: 30 }, grid: { x: 130, y: 30 }, batt: { x: 30, y: 90 }, home: { x: 130, y: 90 },
};
const PATHS = {
  // Each path is drawn FROM its node TO the inverter hub.
  pv: "M30 43.6 Q30 60 71.2 60",
  grid: "M130 43.6 Q130 60 88.8 60",
  batt: "M30 76.4 Q30 60 71.2 60",
  home: "M130 76.4 Q130 60 88.8 60",
};

class EyeBondInverterCard extends HTMLElement {
  static getStubConfig(hass) {
    const prefix = hass ? EyeBondInverterCard._detectPrefix(hass) : null;
    return prefix ? { device: prefix } : {};
  }

  static _detectPrefix(hass) {
    const candidates = [];
    for (const id of Object.keys(hass.states)) {
      const m = /^sensor\.(.+)_battery_percent$/.exec(id);
      if (!m || !hass.states[`sensor.${m[1]}_pv_power`]) continue;
      const platform = hass.entities?.[id]?.platform;
      candidates.push({ prefix: m[1], score: platform === INTEGRATION ? 2 : 1 });
    }
    candidates.sort((a, b) => b.score - a.score || a.prefix.localeCompare(b.prefix));
    return candidates.length ? candidates[0].prefix : null;
  }

  setConfig(config) {
    this._config = { show_controls: true, ...(config || {}) };
    this._prefix = this._config.device || null;
    this._built = false;
    this._pending = {};
    if (this.shadowRoot) this.shadowRoot.innerHTML = "";
    if (this._hass) this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() { return 7; }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: "auto" }; }

  disconnectedCallback() { this._closeDialog(); }

  // ---------------------------------------------------------------- helpers
  get _t() {
    const lang = (this._hass?.locale?.language || this._hass?.language || "en").slice(0, 2);
    return I18N[lang] || I18N.en;
  }

  _id(domain, key) { return `${domain}.${this._prefix}_${key}`; }
  _st(domain, key) { return this._hass?.states[this._id(domain, key)]; }
  _num(key, domain = "sensor") {
    const s = this._st(domain, key);
    if (!s) return null;
    const v = parseFloat(s.state);
    return Number.isFinite(v) ? v : null;
  }
  _str(key, domain = "sensor") {
    const s = this._st(domain, key);
    return s && !["unknown", "unavailable"].includes(s.state) ? s.state : null;
  }

  _fmt(v, digits = 0) {
    if (v === null || v === undefined) return "—";
    const lang = this._hass?.locale?.language || "en";
    return new Intl.NumberFormat(lang, { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(v);
  }
  _w(v) {
    if (v === null) return "—";
    const a = Math.abs(v);
    const unit = this._t === I18N.en ? ["W", "kW"] : ["Вт", "кВт"];
    return a >= 1000 ? `${this._fmt(a / 1000, a >= 10000 ? 1 : 2)} ${unit[1]}` : `${this._fmt(a)} ${unit[0]}`;
  }
  _unit(u) {
    if (this._t === I18N.en || !u) return u || "";
    return { V: "В", A: "А", W: "Вт", kWh: "кВт·ч", Hz: "Гц", VA: "ВА" }[u] || u;
  }
  _val(key, digits, domain = "sensor") {
    const s = this._st(domain, key);
    if (!s || ["unknown", "unavailable"].includes(s.state)) return "—";
    const v = parseFloat(s.state);
    const u = this._unit(s.attributes.unit_of_measurement);
    return Number.isFinite(v) ? `${this._fmt(v, digits)}${u ? " " + u : ""}` : s.state;
  }

  _moreInfo(entityId) {
    if (!entityId || !this._hass.states[entityId]) return;
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
  }

  _toast(message) {
    this.dispatchEvent(new CustomEvent("hass-notification", { detail: { message }, bubbles: true, composed: true }));
  }

  async _call(domain, service, key, data) {
    const entity_id = this._id(domain, key);
    this._pending[entity_id] = { value: data.option ?? data.value ?? (service === "turn_on" ? "on" : "off"), at: Date.now() };
    this._update();
    try {
      await this._hass.callService(domain, service, { entity_id, ...data });
    } catch (err) {
      delete this._pending[entity_id];
      this._toast(`${this._t.write_failed}: ${err?.message || err}`);
      this._update();
    }
  }

  _isPending(entityId) {
    const p = this._pending[entityId];
    if (!p) return null;
    const s = this._hass.states[entityId];
    const cur = s ? s.state : null;
    const done = cur !== null && (cur === String(p.value) || parseFloat(cur) === parseFloat(p.value));
    if (done || Date.now() - p.at > PENDING_MS) { delete this._pending[entityId]; return null; }
    return p;
  }

  // ---------------------------------------------------------------- render
  _render() {
    if (!this._hass || !this._config) return;
    if (!this._prefix) this._prefix = EyeBondInverterCard._detectPrefix(this._hass);
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    if (!this._prefix || !this._st("sensor", "battery_percent")) {
      this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card><div class="warn">${this._t.not_found}</div></ha-card>`;
      this._built = false;
      return;
    }
    if (!this._built || this._builtLang !== this._t) this._build();
    this._update();
  }

  _build() {
    const t = this._t;
    const pos = (n) => `left:${(NODES[n].x / 160) * 100}%;top:${(NODES[n].y / 120) * 100}%`;
    const pathEls = Object.entries(PATHS)
      .map(([k, d]) => `<path class="track" d="${d}"/><path class="dash p-${k}" data-path="${k}" d="${d}"/>`)
      .join("");
    const outOpts = this._st("select", "output_source_priority")?.attributes.options || [];
    const controls = this._config.show_controls !== false && outOpts.length
      ? `<div class="ctl">
           <div class="ctl-lbl"><span>${t.output_priority}</span><span class="hint" data-out-hint></span></div>
           <div class="seg" data-seg="output_source_priority">${outOpts
             .map((o) => `<button data-opt="${o}">${t.out_label[o] || o}</button>`).join("")}</div>
         </div>` : "";

    this.shadowRoot.innerHTML = `<style>${STYLE}</style>
      <ha-card>
        <div class="hdr">
          <div class="title" data-title></div>
          <div class="chips">
            <span class="chip alarm" data-alarm hidden><ha-icon icon="mdi:alert"></ha-icon><span></span></span>
            <span class="chip" data-mode><span class="dot"></span><span></span></span>
          </div>
        </div>
        <div class="flow">
          <svg viewBox="0 0 160 120" aria-hidden="true">${pathEls}</svg>
          <div class="node top n-pv" data-node="pv" style="${pos("pv")}">
            <div class="cap"><b>${t.solar}</b><br><span data-cap></span></div>
            <div class="circle"><ha-icon icon="mdi:solar-power-variant"></ha-icon><span class="val" data-val></span></div>
          </div>
          <div class="node top n-grid" data-node="grid" style="${pos("grid")}">
            <div class="cap"><b>${t.grid}</b><br><span data-cap></span></div>
            <div class="circle"><ha-icon data-grid-icon icon="mdi:transmission-tower"></ha-icon><span class="val" data-val></span></div>
          </div>
          <div class="node bottom n-batt" data-node="batt" style="${pos("batt")}">
            <div class="circle"><div class="inner"><span class="soc" data-val></span></div></div>
            <div class="cap"><b data-cap-title>${t.battery}</b><br><span data-cap></span></div>
          </div>
          <div class="node bottom n-home" data-node="home" style="${pos("home")}">
            <div class="circle"><ha-icon icon="mdi:home"></ha-icon><span class="val" data-val></span></div>
            <div class="cap"><b>${t.home}</b><br><span data-cap></span></div>
          </div>
          <div class="hub" data-hub><ha-icon icon="mdi:sine-wave"></ha-icon><span class="hub-cap" data-hub-cap></span></div>
        </div>
        ${controls}
        <div class="actions">
          ${this._config.show_controls !== false ? `<button class="icon-btn" data-open="settings"><ha-icon icon="mdi:tune-variant"></ha-icon>${t.settings}</button>` : ""}
          <button class="icon-btn" data-open="stats"><ha-icon icon="mdi:chart-box-outline"></ha-icon>${t.stats}</button>
        </div>
      </ha-card>`;

    const root = this.shadowRoot;
    const nodeEntity = { pv: "pv_power", grid: "grid_voltage", batt: "battery_percent", home: "load_power" };
    root.querySelectorAll("[data-node]").forEach((el) =>
      el.addEventListener("click", () => this._moreInfo(this._id("sensor", nodeEntity[el.dataset.node]))));
    root.querySelector("[data-hub]").addEventListener("click", () => this._moreInfo(this._id("sensor", "inverter_temperature")));
    root.querySelector("[data-mode]").addEventListener("click", () => this._moreInfo(this._id("sensor", "operating_mode")));
    root.querySelector("[data-alarm]").addEventListener("click", () => this._moreInfo(this._id("sensor", "alarm_status")));
    root.querySelectorAll("[data-open]").forEach((el) =>
      el.addEventListener("click", () => this._openDialog(el.dataset.open)));
    this._wireSegments(root);

    this._built = true;
    this._builtLang = t;
  }

  _wireSegments(scope) {
    scope.querySelectorAll("[data-seg]").forEach((seg) => {
      seg.addEventListener("click", (ev) => {
        const btn = ev.target.closest("button[data-opt]");
        if (!btn || btn.disabled || btn.classList.contains("active")) return;
        this._call("select", "select_option", seg.dataset.seg, { option: btn.dataset.opt });
      });
    });
  }

  _update() {
    if (!this._built) return;
    const root = this.shadowRoot;
    const t = this._t;

    // Header
    root.querySelector("[data-title]").textContent =
      this._config.title || this._str("model") || "Inverter";
    const mode = this._str("operating_mode");
    const modeEl = root.querySelector("[data-mode]");
    modeEl.className = `chip m-${(mode || "").toLowerCase().replace(/\s+/g, "-")}`;
    modeEl.lastElementChild.textContent = (mode && t.modes[mode]) || mode || "—";
    const alarmOn = this._st("binary_sensor", "alarm_active")?.state === "on";
    const alarmEl = root.querySelector("[data-alarm]");
    alarmEl.hidden = !alarmOn;
    alarmEl.lastElementChild.textContent = this._alarmText(this._str("alarm_status"));

    // Flow values
    const pv = this._num("pv_power");
    const load = this._num("load_power");
    const battP = this._num("battery_power");
    const soc = this._num("battery_percent");
    const gridV = this._num("grid_voltage");
    const gridOk = gridV !== null && gridV > 90;
    const gridIn = (this._num("grid_to_home_power") || 0) + (this._num("grid_to_battery_power") || 0);
    const gridOut = this._num("pv_to_grid_power") || 0;

    this._setNode("pv", pv !== null && pv > FLOW_W, this._w(pv), `${this._val("pv_voltage", 0)}`);
    this._setNode(
      "grid", gridOk && (gridIn > FLOW_W || gridOut > FLOW_W),
      gridOk ? this._w(gridOut > gridIn ? gridOut : gridIn) : "—",
      gridOk ? `${this._val("grid_voltage", 0)} · ${this._val("grid_frequency", 1)}` : t.no_grid,
    );
    root.querySelector("[data-grid-icon]").setAttribute("icon", gridOk ? "mdi:transmission-tower" : "mdi:transmission-tower-off");
    const battNode = root.querySelector('[data-node="batt"]');
    battNode.style.setProperty("--soc", soc ?? 0);
    battNode.classList.toggle("low", soc !== null && soc <= 20);
    const battState = battP === null || Math.abs(battP) <= FLOW_W ? t.idle : battP > 0 ? t.charging : t.discharging;
    this._setNode("batt", true, soc === null ? "—" : `${this._fmt(soc)}%`,
      `${battState}${battP !== null && Math.abs(battP) > FLOW_W ? " " + this._w(battP) : ""} · ${this._val("battery_voltage", 1)}`);
    battNode.querySelector("[data-cap-title]").textContent = t.battery;
    const loadPct = this._num("load_percent");
    this._setNode("home", load !== null && load > FLOW_W, this._w(load), loadPct === null ? "" : `${this._fmt(loadPct)}%`);
    const temp = this._num("inverter_temperature");
    root.querySelector("[data-hub-cap]").textContent = temp === null ? "" : `${this._fmt(temp)} °C`;

    // Animated paths
    this._setPath("pv", pv, false);
    this._setPath("grid", gridOk ? (gridOut > gridIn ? gridOut : gridIn) : 0, gridOut > gridIn);
    this._setPath("batt", battP === null ? 0 : Math.abs(battP), battP !== null && battP > 0);
    this._setPath("home", load, true);

    // Output priority + hint
    const out = this._str("output_source_priority", "select");
    const hint = root.querySelector("[data-out-hint]");
    if (hint) hint.textContent = (out && t.out_hint[out]) || "";
    this._updateSegments(root);
    if (this._dialog) this._updateDialog();
  }

  _alarmText(raw) {
    if (!raw) return "";
    const map = {
      "Line fail warning": this._t.no_grid,
    };
    return map[raw] || raw;
  }

  _setNode(name, active, value, caption) {
    const el = this.shadowRoot.querySelector(`[data-node="${name}"]`);
    el.classList.toggle("idle", !active);
    el.querySelector("[data-val]").textContent = value;
    el.querySelector("[data-cap]").textContent = caption;
  }

  _setPath(name, watts, reverse) {
    const el = this.shadowRoot.querySelector(`[data-path="${name}"]`);
    const on = watts !== null && watts > FLOW_W;
    el.classList.toggle("on", on);
    el.classList.toggle("rev", reverse);
    // Faster dots for more power: 2.8 s at a trickle down to 0.7 s at ≥4 kW.
    const dur = on ? Math.max(0.7, 2.8 - Math.log10(Math.max(watts, 10)) * 0.55) : 2;
    el.style.setProperty("--dur", `${dur.toFixed(2)}s`);
  }

  _updateSegments(scope) {
    scope.querySelectorAll("[data-seg]").forEach((seg) => {
      const id = this._id("select", seg.dataset.seg);
      const cur = this._hass.states[id]?.state;
      const pend = this._isPending(id);
      const unavailable = !this._hass.states[id] || cur === "unavailable";
      seg.querySelectorAll("button").forEach((b) => {
        const opt = b.dataset.opt;
        b.classList.toggle("active", !pend && opt === cur);
        b.classList.toggle("pending", !!pend && String(pend.value) === opt);
        b.disabled = unavailable || !!pend;
      });
    });
  }

  // ---------------------------------------------------------------- dialogs
  _openDialog(kind) {
    this._closeDialog();
    const t = this._t;
    const wrap = document.createElement("div");
    wrap.className = "backdrop";
    wrap.innerHTML = `<div class="dlg" role="dialog" aria-modal="true" aria-label="${kind === "settings" ? t.settings : t.stats}">
        <header><span>${kind === "settings" ? t.settings : t.stats}</span>
          <button data-close aria-label="${t.close}"><ha-icon icon="mdi:close"></ha-icon></button></header>
        <div class="dlg-body">${kind === "settings" ? this._settingsHtml() : this._statsHtml()}</div>
      </div>`;
    wrap.addEventListener("click", (ev) => { if (ev.target === wrap) this._closeDialog(); });
    wrap.querySelector("[data-close]").addEventListener("click", () => this._closeDialog());
    this._onKey = (ev) => { if (ev.key === "Escape") this._closeDialog(); };
    window.addEventListener("keydown", this._onKey);
    this.shadowRoot.appendChild(wrap);
    this._dialog = { kind, el: wrap };
    if (kind === "settings") this._wireSettings(wrap);
    else this._wireStats(wrap);
    this._updateDialog();
    wrap.querySelector("[data-close]").focus();
  }

  _closeDialog() {
    if (this._dialog) this._dialog.el.remove();
    this._dialog = null;
    if (this._onKey) window.removeEventListener("keydown", this._onKey);
    this._onKey = null;
  }

  _selectRow(key, label) {
    const s = this._st("select", key);
    if (!s) return "";
    const opts = (s.attributes.options || []).map((o) => `<option value="${o}">${o}</option>`).join("");
    return `<div class="row" data-row="select:${key}"><span class="lbl">${label}</span><select data-select="${key}">${opts}</select></div>`;
  }

  _settingsHtml() {
    const t = this._t;
    const out = this._st("select", "output_source_priority");
    const chg = this._st("select", "charge_source_priority");
    const seg = (key, st, labels, cls = "") => st
      ? `<div class="seg ${cls}" data-seg="${key}">${st.attributes.options
          .map((o) => `<button data-opt="${o}">${labels[o] || o}</button>`).join("")}</div>` : "";
    const numbers = NUMBER_KEYS.filter((k) => this._st("number", k)).map((k) => {
      const a = this._st("number", k).attributes;
      return `<div class="row" data-row="number:${k}"><span class="lbl">${t.numbers[k] || k}</span>
        <input type="number" data-number="${k}" min="${a.min ?? ""}" max="${a.max ?? ""}" step="${a.step ?? 0.1}" inputmode="decimal">
        <span class="unit">${this._unit(a.unit_of_measurement)}</span>
        <button class="apply" data-apply="${k}" disabled>${t.apply}</button></div>`;
    }).join("");
    const switches = SWITCH_KEYS.filter((k) => this._st("switch", k)).map((k) =>
      `<div class="row" data-row="switch:${k}"><span class="lbl">${t.switches[k] || k}</span>
        <label class="tgl"><input type="checkbox" data-switch="${k}" aria-label="${t.switches[k] || k}"><span></span></label></div>`).join("");

    return `
      <div class="sec"><h3>${t.priorities}</h3>
        ${out ? `<div class="ctl-lbl"><span>${t.output_priority}</span><span class="hint" data-out-hint></span></div>${seg("output_source_priority", out, t.out_label)}` : ""}
        ${chg ? `<div class="ctl-lbl" style="margin-top:12px"><span>${t.charge_priority}</span></div>${seg("charge_source_priority", chg, t.chg_label, "grid2")}` : ""}
      </div>
      <div class="sec"><h3>${t.charge_current}</h3>
        ${this._selectRow("max_utility_charge_current", t.max_utility_current)}
        ${this._selectRow("max_total_charge_current", t.max_total_current)}
      </div>
      <div class="sec"><h3>${t.battery_section}</h3>
        <div class="note">${t.battery_warning}</div>
        ${this._selectRow("battery_type", t.battery_type)}
        ${numbers}
      </div>
      <div class="sec"><h3>${t.inverter_section}</h3>
        ${this._selectRow("input_voltage_range", t.input_range)}
        ${switches}
      </div>`;
  }

  _wireSettings(wrap) {
    this._wireSegments(wrap);
    wrap.querySelectorAll("[data-select]").forEach((sel) =>
      sel.addEventListener("change", () =>
        this._call("select", "select_option", sel.dataset.select, { option: sel.value })));
    wrap.querySelectorAll("[data-switch]").forEach((cb) =>
      cb.addEventListener("change", () =>
        this._call("switch", cb.checked ? "turn_on" : "turn_off", cb.dataset.switch, {})));
    wrap.querySelectorAll("[data-number]").forEach((inp) => {
      const key = inp.dataset.number;
      const btn = wrap.querySelector(`[data-apply="${key}"]`);
      const dirty = () => {
        const cur = this._num(key, "number");
        const v = parseFloat(inp.value);
        btn.disabled = !Number.isFinite(v) || v === cur || !inp.checkValidity();
      };
      inp.addEventListener("input", () => { inp.dataset.dirty = "1"; dirty(); });
      const apply = () => {
        if (btn.disabled) return;
        delete inp.dataset.dirty;
        btn.disabled = true;
        this._call("number", "set_value", key, { value: parseFloat(inp.value) });
      };
      btn.addEventListener("click", apply);
      inp.addEventListener("keydown", (ev) => { if (ev.key === "Enter") apply(); });
    });
  }

  _statsHtml() {
    const t = this._t;
    const tiles = ENERGY_TILES.filter(([k]) => this._st("sensor", k)).map(([k, lbl, icon, cls]) =>
      `<div class="tile ${cls}" data-info="sensor:${k}"><ha-icon icon="${icon}"></ha-icon>
        <div><div class="t-lbl">${t[lbl]}</div><div class="t-val" data-stat="${k}"></div></div></div>`).join("");
    const kv = [
      ["pv_input", ["pv_voltage", "pv_current", "pv_power"]],
      ["battery_now", ["battery_voltage", "battery_power"]],
      ["grid_input", ["grid_voltage", "grid_frequency"]],
      ["output", ["output_voltage", "output_frequency", "output_apparent_power"]],
      ["load", ["load_power", "load_percent"]],
      ["temperature", ["inverter_temperature"]],
      ["bus", ["inverter_bus_voltage"]],
    ].map(([lbl, keys]) => `<div class="kv" data-info="sensor:${keys[0]}"><span>${t[lbl]}</span><span data-kv="${keys.join(",")}"></span></div>`).join("");
    return `<div class="sec"><h3>${t.today}</h3><div class="tiles">${tiles}</div></div>
      <div class="sec"><h3>${t.now}</h3>${kv}
        <div class="kv" data-info="sensor:model"><span>${t.model}</span><span data-model></span></div></div>`;
  }

  _kvText(keys) {
    const t = this._t;
    if (keys[0] === "grid_voltage" && !((this._num("grid_voltage") || 0) > 90)) return t.no_grid;
    if (keys[0] === "battery_voltage") {
      const chg = this._num("battery_charge_current") || 0;
      const dis = this._num("battery_discharge_current") || 0;
      const amps = chg > 0 ? `+${this._fmt(chg, 1)}` : dis > 0 ? `−${this._fmt(dis, 1)}` : this._fmt(0, 1);
      const p = this._num("battery_power");
      return [this._val("battery_voltage", 1), `${amps} ${this._unit("A")}`,
        p === null ? null : `${p > 0 ? "+" : p < 0 ? "−" : ""}${this._w(p)}`].filter(Boolean).join(" · ");
    }
    return keys.map((k) => this._val(k, /voltage|frequency|current/.test(k) ? 1 : 0))
      .filter((v) => v !== "—").join(" · ") || "—";
  }

  _wireStats(wrap) {
    wrap.querySelectorAll("[data-info]").forEach((el) =>
      el.addEventListener("click", () => {
        const [domain, key] = el.dataset.info.split(":");
        this._moreInfo(this._id(domain, key));
      }));
  }

  _updateDialog() {
    const { kind, el } = this._dialog;
    const t = this._t;
    if (kind === "settings") {
      const out = this._str("output_source_priority", "select");
      const hint = el.querySelector("[data-out-hint]");
      if (hint) hint.textContent = (out && t.out_hint[out]) || "";
      this._updateSegments(el);
      el.querySelectorAll("[data-select]").forEach((sel) => {
        const id = this._id("select", sel.dataset.select);
        const pend = this._isPending(id);
        sel.closest(".row").classList.toggle("pending", !!pend);
        sel.disabled = !!pend;
        if (this.shadowRoot.activeElement !== sel) {
          sel.value = pend ? pend.value : this._hass.states[id]?.state;
        }
      });
      el.querySelectorAll("[data-switch]").forEach((cb) => {
        const id = this._id("switch", cb.dataset.switch);
        const pend = this._isPending(id);
        cb.closest(".row").classList.toggle("pending", !!pend);
        cb.disabled = !!pend;
        cb.checked = pend ? pend.value === "on" : this._hass.states[id]?.state === "on";
      });
      el.querySelectorAll("[data-number]").forEach((inp) => {
        const key = inp.dataset.number;
        const id = this._id("number", key);
        const pend = this._isPending(id);
        inp.closest(".row").classList.toggle("pending", !!pend);
        inp.disabled = !!pend;
        if (!inp.dataset.dirty && this.shadowRoot.activeElement !== inp) {
          const v = this._num(key, "number");
          inp.value = v === null ? "" : String(v);
        }
      });
    } else {
      el.querySelectorAll("[data-stat]").forEach((n) => {
        const v = this._num(n.dataset.stat);
        n.textContent = v === null ? "—" : `${this._fmt(v, v < 10 ? 2 : 1)} ${this._unit("kWh")}`;
      });
      el.querySelectorAll("[data-kv]").forEach((n) => {
        n.textContent = this._kvText(n.dataset.kv.split(","));
      });
      const m = el.querySelector("[data-model]");
      if (m) m.textContent = [this._str("model"), this._str("protocol_variant")].filter(Boolean).join(" · ") || "—";
    }
  }
}

if (!customElements.get("eybond-inverter-card")) {
  customElements.define("eybond-inverter-card", EyeBondInverterCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "eybond-inverter-card",
    name: "EyeBond Inverter",
    description: "Power flow, battery and priority control for EyeBond Local inverters.",
    preview: true,
  });
  console.info(`%c EYEBOND-INVERTER-CARD %c ${CARD_VERSION} `, "background:#2fa866;color:#fff;font-weight:600", "");
}
