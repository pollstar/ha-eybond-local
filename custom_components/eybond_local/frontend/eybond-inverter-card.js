/*
 * EyeBond Inverter Card — Lovelace card for EyeBond Local hybrid inverters.
 *
 * Served by the eybond_local integration, which also keeps the dashboard
 * resource /eybond_local_static/eybond-inverter-card.js?v=<hash> current —
 * nothing to add by hand.
 *   type: custom:eybond-inverter-card
 *   device: pi30_6200        # optional, object-id prefix; auto-detected
 *   title: Инвертор          # optional
 *   show_controls: true      # optional
 *   animation: auto          # auto | always | off — auto follows the OS
 *                            # "reduce motion" setting
 *   theme: auto              # auto | light | dark — auto follows the HA theme
 *   auto_reload: true        # reload the page once when the integration was
 *                            # updated and serves a newer card
 *
 * Language follows the HA UI language: Ukrainian, Russian, otherwise English.
 *
 * Vanilla JS, no dependencies. Every value comes from the integration's
 * entities; the card only calls select / number / switch services.
 */

const CARD_VERSION = "0.3.2";

// Hash the integration put in our URL (?v=…); null when loaded some other way.
const LOADED_VERSION = (() => {
  try { return new URL(import.meta.url).searchParams.get("v"); } catch (_e) { return null; }
})();
const VERSION_CHECK_EVERY_MS = 10 * 60 * 1000;

// One shared check for all card instances: only the in-flight request is
// shared; every later check asks the server again.
const versionCheck = {
  inflight: null,
  lastAt: 0,
  fetch(hass) {
    if (!this.inflight) {
      this.inflight = hass.callApi("GET", "eybond_local/card_version")
        .then((r) => (r && typeof r.version === "string" ? r.version : null))
        .catch(() => null)
        .finally(() => { this.inflight = null; this.lastAt = Date.now(); });
    }
    return this.inflight;
  },
};
const INTEGRATION = "eybond_local";

const I18N = {
  en: {
    update_available: "Card updated. Reload the page to use the new version.", reload: "Reload",
    f_title: { pv: "Where the solar went", home: "What powered the home", batt: "What charged the battery" },
    f_grid_note: "Grid energy is calculated from the balance (no grid meter); inverter losses are not included.",
    h_title: { pv: "Solar production", grid: "Grid", home: "Home consumption", batt: "Battery" },
    h_period: { day: "Day", month: "Month", year: "Year" },
    h_prev: "Previous", h_next: "Next", h_more: "Live values", h_total: "Total",
    h_no_data: "No data for this period yet. History builds up from the day the integration was installed.",
    h_error: "History is unavailable (is the recorder enabled?)", h_loading: "Loading…",
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
    modes: { "Power on": "Starting", "Standby": "Standby", "Line": "Grid connected", "Battery": "On battery", "Fault": "Fault", "Power saving": "Power saving" },
    switches: {
      buzzer_enabled: "Buzzer", lcd_backlight_enabled: "LCD backlight", power_saving_enabled: "Power saving",
      overload_bypass_enabled: "Overload bypass", overload_restart_enabled: "Restart after overload",
      over_temperature_restart_enabled: "Restart after overheat",
    },
    options: {
      battery_type: { AGM: "AGM", Flooded: "Flooded", User: "User-defined" },
      input_voltage_range: { Appliance: "Appliance (90–280 V)", UPS: "UPS (170–280 V)" },
    },
    alarms: { Ok: "OK", "Line fail warning": "Grid lost" },
    more: "more",
    numbers: {
      battery_bulk_voltage: "Bulk (CV) voltage", battery_float_voltage: "Float voltage",
      battery_cut_off_voltage: "Cut-off voltage", battery_recharge_voltage: "Back to grid at",
      battery_redischarge_voltage: "Back to battery at",
    },
  },
  ru: {
    update_available: "Карточка обновлена. Перезагрузите страницу.", reload: "Перезагрузить",
    f_title: { pv: "Куда ушло солнце", home: "Чем питался дом", batt: "Чем заряжалась АКБ" },
    f_grid_note: "Энергия сети вычислена из баланса (счётчика сети нет), потери инвертора не учтены.",
    h_title: { pv: "Выработка солнца", grid: "Сеть", home: "Потребление дома", batt: "Аккумулятор" },
    h_period: { day: "День", month: "Месяц", year: "Год" },
    h_prev: "Назад", h_next: "Вперёд", h_more: "Текущие значения", h_total: "Всего",
    h_no_data: "За этот период данных пока нет. История копится с момента установки интеграции.",
    h_error: "История недоступна (включён ли recorder?)", h_loading: "Загрузка…",
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
    modes: { "Power on": "Запуск", "Standby": "Ожидание", "Line": "Сеть подключена", "Battery": "От АКБ", "Fault": "Авария", "Power saving": "Энергосбережение" },
    switches: {
      buzzer_enabled: "Звуковой сигнал", lcd_backlight_enabled: "Подсветка дисплея", power_saving_enabled: "Энергосбережение",
      overload_bypass_enabled: "Байпас при перегрузке", overload_restart_enabled: "Перезапуск после перегрузки",
      over_temperature_restart_enabled: "Перезапуск после перегрева",
    },
    options: {
      battery_type: { AGM: "AGM", Flooded: "Кислотная (жидкий электролит)", User: "Пользовательский" },
      input_voltage_range: { Appliance: "Бытовой (90–280 В)", UPS: "ИБП (170–280 В)" },
    },
    alarms: {
      Ok: "Норма", "PV loss warning": "Нет PV", "Inverter fault": "Авария инвертора",
      "Bus over fault": "Перенапряжение шины", "Bus under fault": "Низкое напряжение шины",
      "Bus soft fail fault": "Сбой плавного пуска шины", "Line fail warning": "Пропала сеть",
      "Output voltage fault": "Авария выходного напряжения", "Inverter voltage too low fault": "Низкое напряжение инвертора",
      "Inverter voltage too high fault": "Высокое напряжение инвертора", "Over temperature": "Перегрев",
      "Fan locked": "Вентилятор заблокирован", "Battery voltage high": "Высокое напряжение АКБ",
      "Battery low alarm warning": "АКБ разряжена", "Battery under shutdown warning": "Отключение по разряду АКБ",
      "Overload": "Перегрузка", "EEPROM fault": "Сбой EEPROM", "Inverter over current fault": "Перегрузка по току",
      "Inverter soft fail fault": "Сбой плавного пуска", "Self test fail fault": "Ошибка самотеста",
      "Output DC voltage over fault": "Постоянка на выходе", "Battery open fault": "АКБ не подключена",
      "Current sensor fail fault": "Сбой датчика тока", "Battery short fault": "КЗ АКБ",
      "Power limit warning": "Ограничение мощности", "PV voltage high warning": "Высокое напряжение PV",
      "MPPT overload fault": "Авария перегрузки MPPT", "MPPT overload warning": "Перегрузка MPPT",
      "Battery too low to charge warning": "АКБ слишком разряжена для заряда", "DC/DC over current fault": "Перегрузка DC/DC",
      "Battery weak warning": "Слабая АКБ", "Low PV energy warning": "Мало энергии PV",
      "High AC input during bus soft start warning": "Высокое AC при пуске шины", "Battery equalization warning": "Выравнивание АКБ",
    },
    more: "ещё",
    numbers: {
      battery_bulk_voltage: "Напряжение заряда (CV)", battery_float_voltage: "Напряжение поддержки",
      battery_cut_off_voltage: "Отсечка разряда", battery_recharge_voltage: "Возврат на сеть при",
      battery_redischarge_voltage: "Возврат на АКБ при",
    },
  },
  uk: {
    update_available: "Картку оновлено. Перезавантажте сторінку.", reload: "Перезавантажити",
    f_title: { pv: "Куди пішло сонце", home: "Чим живився дім", batt: "Чим заряджалася АКБ" },
    f_grid_note: "Енергію мережі обчислено з балансу (лічильника мережі немає), втрати інвертора не враховано.",
    h_title: { pv: "Вироблення сонця", grid: "Мережа", home: "Споживання дому", batt: "Акумулятор" },
    h_period: { day: "День", month: "Місяць", year: "Рік" },
    h_prev: "Назад", h_next: "Вперед", h_more: "Поточні значення", h_total: "Усього",
    h_no_data: "За цей період даних поки немає. Історія накопичується з моменту встановлення інтеграції.",
    h_error: "Історія недоступна (чи ввімкнено recorder?)", h_loading: "Завантаження…",
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
    modes: { "Power on": "Запуск", "Standby": "Очікування", "Line": "Мережа підключена", "Battery": "Від АКБ", "Fault": "Аварія", "Power saving": "Енергозбереження" },
    switches: {
      buzzer_enabled: "Звуковий сигнал", lcd_backlight_enabled: "Підсвітка дисплея", power_saving_enabled: "Енергозбереження",
      overload_bypass_enabled: "Байпас при перевантаженні", overload_restart_enabled: "Перезапуск після перевантаження",
      over_temperature_restart_enabled: "Перезапуск після перегріву",
    },
    options: {
      battery_type: { AGM: "AGM", Flooded: "Кислотна (рідкий електроліт)", User: "Користувацький" },
      input_voltage_range: { Appliance: "Побутовий (90–280 В)", UPS: "ДБЖ (170–280 В)" },
    },
    alarms: {
      Ok: "Норма", "PV loss warning": "Немає PV", "Inverter fault": "Аварія інвертора",
      "Bus over fault": "Перенапруга шини", "Bus under fault": "Низька напруга шини",
      "Bus soft fail fault": "Збій плавного пуску шини", "Line fail warning": "Зникла мережа",
      "Output voltage fault": "Аварія вихідної напруги", "Inverter voltage too low fault": "Низька напруга інвертора",
      "Inverter voltage too high fault": "Висока напруга інвертора", "Over temperature": "Перегрів",
      "Fan locked": "Вентилятор заблоковано", "Battery voltage high": "Висока напруга АКБ",
      "Battery low alarm warning": "АКБ розряджена", "Battery under shutdown warning": "Вимкнення через розряд АКБ",
      "Overload": "Перевантаження", "EEPROM fault": "Збій EEPROM", "Inverter over current fault": "Перевантаження за струмом",
      "Inverter soft fail fault": "Збій плавного пуску", "Self test fail fault": "Помилка самотесту",
      "Output DC voltage over fault": "Постійна напруга на виході", "Battery open fault": "АКБ не під'єднана",
      "Current sensor fail fault": "Збій датчика струму", "Battery short fault": "КЗ АКБ",
      "Power limit warning": "Обмеження потужності", "PV voltage high warning": "Висока напруга PV",
      "MPPT overload fault": "Аварія перевантаження MPPT", "MPPT overload warning": "Перевантаження MPPT",
      "Battery too low to charge warning": "АКБ надто розряджена для заряду", "DC/DC over current fault": "Перевантаження DC/DC",
      "Battery weak warning": "Слабка АКБ", "Low PV energy warning": "Мало енергії PV",
      "High AC input during bus soft start warning": "Висока AC під час пуску шини", "Battery equalization warning": "Вирівнювання АКБ",
    },
    more: "ще",
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
// Energy history per flow node: daily-reset kWh sensors (state_class
// total_increasing), so HA long-term statistics give per hour/day/month change.
// dir 1 = drawn above the baseline, -1 = mirrored below it.
const HISTORY = {
  pv: { color: "--eb-pv", live: "pv_power",
        series: [{ key: "estimated_pv_energy_today", label: "pv_energy", dir: 1 }] },
  grid: { color: "--eb-grid", live: "grid_voltage",
          series: [{ key: "estimated_grid_import_energy_today", label: "grid_in", dir: 1 },
                   { key: "estimated_grid_export_energy_today", label: "grid_out", dir: -1 }] },
  home: { color: "--eb-home", live: "load_power",
          series: [{ key: "estimated_load_energy_today", label: "load_energy", dir: 1 }] },
  batt: { color: "--eb-batt", live: "battery_percent",
          series: [{ key: "estimated_battery_charge_energy_today", label: "batt_in", dir: 1 },
                   { key: "estimated_battery_discharge_energy_today", label: "batt_out", dir: -1 }] },
};
const STAT_PERIOD = { day: "hour", month: "day", year: "month" };

const FLOW_W = 5; // watts below which a path is considered idle
const PENDING_MS = 30000; // PI30 polls slowly; keep the pending hint until readback

const STYLE = `
  :host { --eb-pv:#e8a317; --eb-batt:#2fa866; --eb-grid:#4f86e8; --eb-home:#9a6fd6;
          --eb-track:var(--divider-color,#e0e0e0); --eb-muted:var(--secondary-text-color,#727272);
          --eb-bg:var(--card-background-color,var(--ha-card-background,#fff)); }
  :host([data-theme="dark"]) {
    --primary-text-color:#e6e6e6; --secondary-text-color:#9e9e9e; --divider-color:#3a3a3a;
    --card-background-color:#1c1c1c; --ha-card-background:#1c1c1c; --eb-bg:#1c1c1c; color-scheme:dark;
  }
  :host([data-theme="light"]) {
    --primary-text-color:#1c1c1c; --secondary-text-color:#727272; --divider-color:#e0e0e0;
    --card-background-color:#fff; --ha-card-background:#fff; --eb-bg:#fff; color-scheme:light;
  }
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
  .update { display:flex; align-items:center; gap:10px; margin:-4px 0 12px; padding:8px 8px 8px 12px; border-radius:12px;
            font-size:13px; background:color-mix(in srgb,var(--primary-color) 12%,transparent); color:var(--primary-text-color); }
  .update span { flex:1; }
  .update button { all:unset; cursor:pointer; font-weight:600; color:var(--primary-color); padding:6px 10px; border-radius:8px; }
  .update button:hover { background:color-mix(in srgb,var(--primary-color) 12%,transparent); }

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
  .row select option { background:var(--eb-bg); color:var(--primary-text-color); }
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

  :host([data-anim="off"]) .flow .dash { animation:none; stroke-dasharray:none; opacity:0; }
  :host([data-anim="off"]) .flow .dash.on { opacity:.55; }
  .flowbar { margin-top:12px; }
  .flowbar .fb-h { display:flex; justify-content:space-between; gap:8px; font-size:13px; margin-bottom:6px; }
  .flowbar .fb-h b { font-weight:600; font-variant-numeric:tabular-nums; }
  .flowbar .fb-bar { display:flex; gap:2px; height:12px; border-radius:6px; overflow:hidden;
                     background:var(--eb-track); }
  .flowbar .fb-bar i { display:block; height:100%; background:var(--c); min-width:3px; }
  .flowbar .fb-lg { display:flex; flex-wrap:wrap; gap:4px 14px; margin-top:6px; font-size:12px; color:var(--eb-muted); }
  .flowbar .fb-lg span { display:inline-flex; align-items:center; gap:5px; cursor:pointer; }
  .flowbar .fb-lg span::before { content:""; width:8px; height:8px; border-radius:2px; background:var(--c); }
  .flowbar .fb-lg b { color:var(--primary-text-color); font-weight:600; font-variant-numeric:tabular-nums; }
  .fb-note { margin-top:10px; font-size:11.5px; color:var(--eb-muted); }
  .c-pv { --c:var(--eb-pv); } .c-batt { --c:var(--eb-batt); } .c-grid { --c:var(--eb-grid); } .c-home { --c:var(--eb-home); }
  .h-head { display:flex; flex-direction:column; gap:10px; }
  .h-nav { display:flex; align-items:center; gap:4px; }
  .h-nav span { flex:1; text-align:center; font-size:14px; font-weight:500; }
  .h-nav button { all:unset; cursor:pointer; width:36px; height:36px; border-radius:50%;
                  display:flex; align-items:center; justify-content:center; color:var(--primary-text-color); }
  .h-nav button:hover { background:color-mix(in srgb,var(--primary-text-color) 8%,transparent); }
  .h-nav button:disabled { opacity:.3; cursor:default; background:none; }
  .h-nav button:focus-visible { outline:2px solid var(--primary-color); }
  .h-total { display:flex; flex-wrap:wrap; align-items:baseline; gap:4px 16px; margin:14px 0 6px; }
  .h-total .big { font-size:26px; font-weight:600; font-variant-numeric:tabular-nums; }
  .h-total .lg { display:inline-flex; align-items:center; gap:6px; font-size:13px; color:var(--eb-muted); }
  .h-total .lg i { width:10px; height:10px; border-radius:3px; background:var(--c); }
  .h-total .lg i.down { background:color-mix(in srgb,var(--c) 50%,var(--eb-bg)); }
  .h-total .lg b { color:var(--primary-text-color); font-weight:600; font-variant-numeric:tabular-nums; }
  .h-chart { position:relative; height:200px; margin-top:8px; display:grid; grid-template-columns:auto 1fr; gap:0 6px; }
  .h-y { position:relative; min-width:26px; font-size:10.5px; color:var(--eb-muted);
         text-align:right; font-variant-numeric:tabular-nums; }
  .h-y span { position:absolute; right:0; transform:translateY(-50%); line-height:1; }
  .h-y span.top { transform:none; } .h-y span.bottom { transform:translateY(-100%); }
  .h-plot { position:relative; display:flex; flex-direction:column; min-width:0; }
  .h-half { position:relative; display:flex; gap:2px; }
  .h-half.up { align-items:flex-end; border-bottom:1px solid var(--eb-track); }
  .h-half.down { align-items:flex-start; }
  .h-grid { position:absolute; left:0; right:0; top:0; border-top:1px dashed var(--eb-track); pointer-events:none; }
  .h-half.down .h-grid { top:auto; bottom:0; }
  .h-col { flex:1 1 0; min-width:0; height:100%; display:flex; cursor:pointer; position:relative; }
  .h-half.up .h-col { align-items:flex-end; } .h-half.down .h-col { align-items:flex-start; }
  .h-bar { width:100%; background:var(--c); border-radius:4px 4px 0 0; min-height:0; transition:height .25s; }
  .h-half.down .h-bar { background:color-mix(in srgb,var(--c) 50%,var(--eb-bg)); border-radius:0 0 4px 4px; }
  .h-col.hot .h-bar { filter:brightness(1.15); }
  .h-col.hot::after { content:""; position:absolute; inset:0 -1px; border-radius:4px;
                      background:color-mix(in srgb,var(--primary-text-color) 7%,transparent); pointer-events:none; }
  .h-x { position:relative; height:16px; font-size:10.5px; color:var(--eb-muted); margin-top:4px; }
  .h-x span { position:absolute; transform:translateX(-50%); white-space:nowrap; }
  .h-tip { position:absolute; z-index:2; pointer-events:none; transform:translate(-50%,-100%); margin-top:-6px;
           background:var(--eb-bg); color:var(--primary-text-color); border:1px solid var(--divider-color,#ddd);
           border-radius:8px; padding:6px 9px; font-size:12px; line-height:1.4; white-space:nowrap;
           box-shadow:0 4px 14px rgba(0,0,0,.18); font-variant-numeric:tabular-nums; }
  .h-tip .t { color:var(--eb-muted); }
  .h-msg { height:200px; display:flex; align-items:center; justify-content:center; text-align:center;
           padding:0 16px; font-size:13px; color:var(--eb-muted); }
  .h-more { all:unset; cursor:pointer; display:inline-flex; align-items:center; gap:6px; margin-top:16px;
            font-size:13px; font-weight:500; color:var(--primary-color); padding:6px 8px; border-radius:8px; }
  .h-more:hover { background:color-mix(in srgb,var(--primary-color) 10%,transparent); }
  .h-more ha-icon { --mdc-icon-size:18px; }

  @media (prefers-reduced-motion: reduce) {
    :host(:not([data-anim="always"])) .flow .dash { animation:none; stroke-dasharray:none; opacity:0; }
    :host(:not([data-anim="always"])) .flow .dash.on { opacity:.55; }
    :host(:not([data-anim="always"])) .seg button.pending { animation:none; opacity:.6; }
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
    this._config = { show_controls: true, animation: "auto", ...(config || {}) };
    const anim = ["always", "off"].includes(this._config.animation) ? this._config.animation : "auto";
    this.setAttribute("data-anim", anim);
    const theme = ["light", "dark"].includes(this._config.theme) ? this._config.theme : "auto";
    this.setAttribute("data-theme", theme);
    this._prefix = this._config.device || null;
    this._built = false;
    this._pending = {};
    if (this.shadowRoot) this.shadowRoot.innerHTML = "";
    if (this._hass) this._render();
  }

  set hass(hass) {
    const reconnected = this._wasConnected === false && hass?.connected === true;
    this._wasConnected = hass?.connected;
    this._hass = hass;
    this._maybeCheckVersion(reconnected);
    // Native controls (select pop-ups, number spinners) follow the HA theme too.
    if (this.getAttribute("data-theme") === "auto") {
      this.style.colorScheme = hass?.themes?.darkMode ? "dark" : "light";
    }
    this._render();
  }

  getCardSize() { return 7; }

  // ---------------------------------------------------------------- updates
  _maybeCheckVersion(force) {
    if (!LOADED_VERSION || !this._hass?.callApi || this._serverVersion === undefined && this._checking) return;
    const first = this._serverVersion === undefined;
    const stale = Date.now() - versionCheck.lastAt > VERSION_CHECK_EVERY_MS;
    if (!force && !first && !stale) return;
    if (!force && first && Date.now() - versionCheck.lastAt < 30000 && versionCheck.lastVersion !== undefined) {
      this._onServerVersion(versionCheck.lastVersion);
      return;
    }
    this._checking = true;
    versionCheck.fetch(this._hass).then((v) => {
      this._checking = false;
      versionCheck.lastVersion = v;
      this._onServerVersion(v);
    });
  }

  _onServerVersion(version) {
    this._serverVersion = version;
    if (!version || version === LOADED_VERSION) { this._setUpdateBanner(false); return; }
    if (this._config?.auto_reload !== false) {
      const key = `eybond-inverter-card-reloaded-${version}`;
      try {
        if (!window.sessionStorage.getItem(key)) {
          window.sessionStorage.setItem(key, "1");
          // Reload only if the marker really stuck, otherwise we could loop.
          if (window.sessionStorage.getItem(key) === "1") { window.location.reload(); return; }
        }
      } catch (_e) { /* storage blocked: fall through to the banner */ }
    }
    this._setUpdateBanner(true);
  }

  _setUpdateBanner(show) {
    this._updateAvailable = show;
    const el = this.shadowRoot?.querySelector("[data-update]");
    if (el) el.hidden = !show;
  }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: "auto" }; }

  disconnectedCallback() { this._closeDialog(); }

  // ---------------------------------------------------------------- helpers
  get _t() {
    const lang = String(this._hass?.locale?.language || this._hass?.language || "en").toLowerCase().slice(0, 2);
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
        <div class="update" data-update ${this._updateAvailable ? "" : "hidden"}>
          <span>${t.update_available}</span><button data-reload>${t.reload}</button>
        </div>
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
      el.addEventListener("click", () => {
        const node = el.dataset.node;
        if (this._historySeries(node).length) this._openDialog(`history:${node}`);
        else this._moreInfo(this._id("sensor", nodeEntity[node]));
      }));
    root.querySelector("[data-hub]").addEventListener("click", () => this._moreInfo(this._id("sensor", "inverter_temperature")));
    root.querySelector("[data-mode]").addEventListener("click", () => this._moreInfo(this._id("sensor", "operating_mode")));
    root.querySelector("[data-alarm]").addEventListener("click", () => this._moreInfo(this._id("sensor", "alarm_status")));
    root.querySelectorAll("[data-open]").forEach((el) =>
      el.addEventListener("click", () => this._openDialog(el.dataset.open)));
    this._wireSegments(root);
    root.querySelector("[data-reload]").addEventListener("click", () => window.location.reload());

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
    const alarms = this._alarmList(this._str("alarm_status"));
    alarmEl.lastElementChild.textContent = alarms.length > 1
      ? `${alarms[0]} +${alarms.length - 1} ${t.more}` : alarms[0] || "";
    alarmEl.title = alarms.join("\n");

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
      // Coloured whenever the grid is present, even at 0 W (solar covering the
      // load); grey with a crossed tower only when the grid is actually lost.
      "grid", gridOk,
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

  _alarmList(raw) {
    if (!raw || raw === "Ok") return [];
    const names = this._t.alarms || {};
    return raw.split(";").map((a) => a.trim()).filter(Boolean).map((a) => names[a] || a);
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
    const node = kind.startsWith("history:") ? kind.slice(8) : null;
    const title = node ? t.h_title[node] : kind === "settings" ? t.settings : t.stats;
    const body = node ? this._historyHtml(node) : kind === "settings" ? this._settingsHtml() : this._statsHtml();
    wrap.innerHTML = `<div class="dlg" role="dialog" aria-modal="true" aria-label="${title}">
        <header><span>${title}</span>
          <button data-close aria-label="${t.close}"><ha-icon icon="mdi:close"></ha-icon></button></header>
        <div class="dlg-body">${body}</div>
      </div>`;
    wrap.addEventListener("click", (ev) => { if (ev.target === wrap) this._closeDialog(); });
    wrap.querySelector("[data-close]").addEventListener("click", () => this._closeDialog());
    this._onKey = (ev) => { if (ev.key === "Escape") this._closeDialog(); };
    window.addEventListener("keydown", this._onKey);
    this.shadowRoot.appendChild(wrap);
    this._dialog = { kind, el: wrap };
    if (node) this._wireHistory(wrap, node);
    else if (kind === "settings") this._wireSettings(wrap);
    else this._wireStats(wrap);
    this._updateDialog();
    wrap.querySelector("[data-close]").focus();
  }

  _closeDialog() {
    this._hist = null;
    if (this._dialog) this._dialog.el.remove();
    this._dialog = null;
    if (this._onKey) window.removeEventListener("keydown", this._onKey);
    this._onKey = null;
  }

  _selectRow(key, label) {
    const s = this._st("select", key);
    if (!s) return "";
    const labels = this._t.options?.[key] || {};
    const opts = (s.attributes.options || []).map((o) => `<option value="${o}">${labels[o] || o}</option>`).join("");
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
    const flows = this._energyFlows()
      ? `<div class="sec" data-flows>${["pv", "home", "batt"].map((f) => `<div class="flowbar" data-flow="${f}"></div>`).join("")}
          ${this._st("sensor", "grid_voltage") && !this._st("sensor", "grid_power") ? `<div class="fb-note">${t.f_grid_note}</div>` : ""}</div>`
      : "";
    return `<div class="sec"><h3>${t.today}</h3><div class="tiles">${tiles}</div></div>
      ${flows}
      <div class="sec"><h3>${t.now}</h3>${kv}
        <div class="kv" data-info="sensor:model"><span>${t.model}</span><span data-model></span></div></div>`;
  }

  // Today's energy routes, from the integration's split kWh sensors. Routes the
  // integration does not expose (PV->battery, grid->battery) are the remainder
  // of their source total, clamped at zero.
  _energyFlows() {
    const v = (k) => this._num(`estimated_${k}_energy_today`);
    const pvToHome = v("pv_to_home"), battToHome = v("battery_to_home"), gridToHome = v("grid_to_home");
    if (pvToHome === null || battToHome === null || gridToHome === null) return null;
    const pv = v("pv") || 0, gridIn = v("grid_import") || 0, gridOut = v("grid_export") || 0;
    const charge = v("battery_charge") || 0;
    const pvToGrid = Math.min(gridOut, Math.max(0, pv - pvToHome));
    const pvToBatt = Math.max(0, pv - pvToHome - pvToGrid);
    const gridToBatt = Math.max(0, Math.min(charge - Math.min(pvToBatt, charge), gridIn - gridToHome));
    return {
      pv: { total: pv, parts: [["home", pvToHome, "pv_to_home"], ["batt", pvToBatt, "pv"], ["grid", pvToGrid, "pv"]] },
      home: { total: pvToHome + battToHome + gridToHome,
              parts: [["pv", pvToHome, "pv_to_home"], ["batt", battToHome, "battery_to_home"], ["grid", gridToHome, "grid_to_home"]] },
      batt: { total: Math.min(pvToBatt, charge) + gridToBatt,
              parts: [["pv", Math.min(pvToBatt, charge), "battery_charge"], ["grid", gridToBatt, "battery_charge"]] },
    };
  }

  _renderFlows(el) {
    const flows = this._energyFlows();
    if (!flows) return;
    const t = this._t;
    const name = { pv: t.solar, batt: t.battery, grid: t.grid, home: t.home };
    el.querySelectorAll("[data-flow]").forEach((box) => {
      const f = flows[box.dataset.flow];
      const parts = f.parts.filter(([, val]) => val >= 0.005);
      const sum = parts.reduce((a, [, val]) => a + val, 0);
      const bar = sum > 0
        ? parts.map(([k, val]) => `<i class="c-${k}" style="flex:${val / sum}" title="${name[k]}"></i>`).join("")
        : "";
      const lg = parts.map(([k, val, ent]) =>
        `<span class="c-${k}" data-info="sensor:estimated_${ent}_energy_today">${name[k]} <b>${this._kwh(val)}</b>${
          parts.length > 1 ? ` · ${this._fmt((val / sum) * 100)}%` : ""}</span>`).join("");
      const html = `<div class="fb-h"><span>${t.f_title[box.dataset.flow]}</span><b>${this._kwh(f.total)}</b></div>
        <div class="fb-bar">${bar}</div><div class="fb-lg">${lg || "—"}</div>`;
      if (box._html === html) return; // hass updates arrive often; skip identical redraws
      box._html = html;
      box.innerHTML = html;
      box.querySelectorAll("[data-info]").forEach((n) => n.addEventListener("click", () => {
        const [domain, key] = n.dataset.info.split(":");
        this._moreInfo(this._id(domain, key));
      }));
    });
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

  // ---------------------------------------------------------------- history
  _historySeries(node) {
    const cfg = HISTORY[node];
    return cfg ? cfg.series.filter((s) => this._st("sensor", s.key)) : [];
  }

  _historyHtml(node) {
    const t = this._t;
    const cfg = HISTORY[node];
    return `<div class="h-head" style="--c:var(${cfg.color})">
        <div class="seg" data-hperiod>${["day", "month", "year"]
          .map((p) => `<button data-p="${p}">${t.h_period[p]}</button>`).join("")}</div>
        <div class="h-nav">
          <button data-hstep="-1" aria-label="${t.h_prev}"><ha-icon icon="mdi:chevron-left"></ha-icon></button>
          <span data-hlabel></span>
          <button data-hstep="1" aria-label="${t.h_next}"><ha-icon icon="mdi:chevron-right"></ha-icon></button>
        </div>
      </div>
      <div style="--c:var(${cfg.color})">
        <div class="h-total" data-htotal></div>
        <div data-hbody><div class="h-msg">${t.h_loading}</div></div>
      </div>
      <button class="h-more" data-hmore><ha-icon icon="mdi:chart-line"></ha-icon>${t.h_more}</button>`;
  }

  _wireHistory(wrap, node) {
    this._hist = { node, period: "day", anchor: new Date(), req: 0, data: null, liveAt: 0 };
    wrap.querySelector("[data-hperiod]").addEventListener("click", (ev) => {
      const b = ev.target.closest("button[data-p]");
      if (!b || b.dataset.p === this._hist.period) return;
      this._hist.period = b.dataset.p;
      this._hist.anchor = new Date();
      this._loadHistory();
    });
    wrap.querySelectorAll("[data-hstep]").forEach((b) => b.addEventListener("click", () => {
      if (b.disabled) return;
      this._hist.anchor = this._shiftPeriod(this._hist.anchor, this._hist.period, Number(b.dataset.hstep));
      this._loadHistory();
    }));
    wrap.querySelector("[data-hmore]").addEventListener("click", () =>
      this._moreInfo(this._id("sensor", HISTORY[node].live)));
    this._loadHistory();
  }

  _periodRange(period, anchor) {
    const s = new Date(anchor);
    s.setHours(0, 0, 0, 0);
    if (period !== "day") s.setDate(1);
    if (period === "year") s.setMonth(0);
    const e = this._shiftPeriod(s, period, 1);
    const n = period === "day" ? 24 : period === "month" ? Math.round((e - s) / 864e5) : 12;
    return { s, e, n };
  }

  _shiftPeriod(d, period, step) {
    const x = new Date(d);
    if (period === "day") x.setDate(x.getDate() + step);
    else if (period === "month") { x.setDate(1); x.setMonth(x.getMonth() + step); }
    else x.setFullYear(x.getFullYear() + step);
    return x;
  }

  _bucketIndex(period, date) {
    return period === "day" ? date.getHours() : period === "month" ? date.getDate() - 1 : date.getMonth();
  }

  _statTime(v) {
    return typeof v === "number" ? new Date(v < 1e12 ? v * 1000 : v) : new Date(v);
  }

  async _loadHistory() {
    const h = this._hist;
    const req = ++h.req;
    const { period } = h;
    const { s, e, n } = this._periodRange(period, h.anchor);
    const series = this._historySeries(h.node);
    const ids = series.map((x) => this._id("sensor", x.key));
    this._renderHistoryFrame();
    try {
      const stats = await this._hass.callWS({
        type: "recorder/statistics_during_period",
        start_time: s.toISOString(), end_time: e.toISOString(),
        statistic_ids: ids, period: STAT_PERIOD[period], types: ["change"], units: { energy: "kWh" },
      });
      const values = ids.map((id) => {
        const arr = new Array(n).fill(0);
        for (const row of stats?.[id] || []) {
          const i = this._bucketIndex(period, this._statTime(row.start));
          if (i >= 0 && i < n && Number.isFinite(row.change)) arr[i] += Math.max(0, row.change);
        }
        return arr;
      });
      // Long-term statistics lag up to an hour: put what today's counters
      // gained since the last compiled hour into the bucket holding "now".
      const now = new Date();
      if (now >= s && now < e) {
        const day0 = new Date(now); day0.setHours(0, 0, 0, 0);
        const todayStats = period === "day" ? stats : await this._hass.callWS({
          type: "recorder/statistics_during_period",
          start_time: day0.toISOString(), end_time: now.toISOString(),
          statistic_ids: ids, period: "hour", types: ["change"], units: { energy: "kWh" },
        });
        ids.forEach((id, k) => {
          const today = this._num(series[k].key);
          if (today === null) return;
          const compiled = (todayStats?.[id] || [])
            .filter((r) => this._statTime(r.start) >= day0)
            .reduce((a, r) => a + (Number.isFinite(r.change) ? Math.max(0, r.change) : 0), 0);
          const pending = today - compiled;
          if (pending > 0.0005) values[k][this._bucketIndex(period, now)] += pending;
        });
      }
      if (req !== h.req || this._hist !== h || !this._dialog) return;
      h.data = { period, s, e, n, series, values };
      h.liveAt = Date.now();
      this._renderHistory();
    } catch (err) {
      if (req !== h.req || this._hist !== h || !this._dialog) return;
      h.data = null;
      this._historyMessage(this._t.h_error);
      console.warn("eybond-inverter-card: history query failed", err);
    }
  }

  _historyLiveRefresh() {
    // Re-query at most once a minute while the current period is on screen.
    const h = this._hist;
    if (!h?.data || Date.now() - h.liveAt < 60000) return;
    const now = new Date();
    if (now >= h.data.s && now < h.data.e) { h.liveAt = Date.now(); this._loadHistory(); }
  }

  _renderHistoryFrame() {
    const el = this._dialog?.el;
    if (!el) return;
    const h = this._hist;
    const lang = this._hass?.locale?.language || "en";
    const { s } = this._periodRange(h.period, h.anchor);
    const fmt = h.period === "day" ? { day: "numeric", month: "long", year: "numeric", weekday: "short" }
      : h.period === "month" ? { month: "long", year: "numeric" } : { year: "numeric" };
    el.querySelector("[data-hlabel]").textContent = new Intl.DateTimeFormat(lang, fmt).format(s);
    el.querySelectorAll("[data-hperiod] button").forEach((b) => b.classList.toggle("active", b.dataset.p === h.period));
    const next = el.querySelector('[data-hstep="1"]');
    next.disabled = this._shiftPeriod(s, h.period, 1) > new Date();
  }

  _historyMessage(text) {
    const el = this._dialog?.el;
    if (!el) return;
    el.querySelector("[data-htotal]").innerHTML = "";
    el.querySelector("[data-hbody]").innerHTML = `<div class="h-msg">${text}</div>`;
  }

  _kwh(v) {
    return `${this._fmt(v, v < 10 ? 2 : v < 100 ? 1 : 0)} ${this._unit("kWh")}`;
  }

  _niceMax(v) {
    if (v <= 0) return 0;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p;
    return 10 * p;
  }

  _renderHistory() {
    const el = this._dialog?.el;
    const d = this._hist?.data;
    if (!el || !d) return;
    const t = this._t;
    const lang = this._hass?.locale?.language || "en";
    const totals = d.values.map((a) => a.reduce((x, y) => x + y, 0));
    if (totals.every((v) => v < 0.0005)) { this._historyMessage(t.h_no_data); return; }

    // A mirrored series with nothing in it (e.g. no export off-grid) is hidden.
    const shown = d.series.map((s, k) => ({ ...s, k })).filter((s) => s.dir === 1 || totals[s.k] >= 0.0005);
    const up = shown.find((s) => s.dir === 1);
    const down = shown.find((s) => s.dir === -1);
    const upMax = this._niceMax(Math.max(...(up ? d.values[up.k] : [0])));
    const downMax = down ? this._niceMax(Math.max(...d.values[down.k])) : 0;

    // Nodes with two directions keep the labelled legend even when one side
    // is empty, so "Grid 19 kWh" is never ambiguous about import vs export.
    el.querySelector("[data-htotal]").innerHTML = d.series.length === 1
      ? `<span class="big">${this._kwh(totals[shown[0].k])}</span>`
      : shown.map((s) => `<span class="lg"><i class="${s.dir < 0 ? "down" : ""}"></i>${t[s.label]} <b>${this._kwh(totals[s.k])}</b></span>`).join("");

    const cols = (s, max) => d.values[s.k].map((v, i) =>
      `<div class="h-col" data-i="${i}"><div class="h-bar" style="height:${max ? (v / max) * 100 : 0}%"></div></div>`).join("");
    const total = upMax + downMax || 1;
    const H = 168;
    const upH = Math.round((H * upMax) / total);
    const yFmt = (v) => this._fmt(v, v < 1 ? 2 : v < 10 ? 1 : 0);
    const plotH = down ? H : upH;
    const yLabels = [
      upMax ? `<span class="top" style="top:0">${yFmt(upMax)}</span>` : "",
      `<span class="${down ? "" : "bottom"}" style="top:${upH}px">0</span>`,
      down ? `<span class="bottom" style="top:${H}px">${yFmt(downMax)}</span>` : "",
    ].join("");
    const ticks = this._xTicks(d, lang);

    el.querySelector("[data-hbody]").innerHTML = `
      <div class="h-chart" style="height:${plotH + 20}px">
        <div class="h-y" style="height:${plotH}px">${yLabels}</div>
        <div class="h-plot">
          <div class="h-half up" style="height:${upH}px"><div class="h-grid"></div>${up ? cols(up, upMax) : ""}</div>
          ${down ? `<div class="h-half down" style="height:${H - upH}px"><div class="h-grid"></div>${cols(down, downMax)}</div>` : ""}
          <div class="h-x">${ticks}</div>
          <div class="h-tip" data-htip hidden></div>
        </div>
      </div>`;

    const plot = el.querySelector(".h-plot");
    const tip = el.querySelector("[data-htip]");
    const show = (i) => {
      plot.querySelectorAll(".h-col").forEach((c) => c.classList.toggle("hot", Number(c.dataset.i) === i));
      const lines = shown.map((s) => `${t[s.label]}: <b>${this._kwh(d.values[s.k][i])}</b>`).join("<br>");
      tip.innerHTML = `<div class="t">${this._bucketLabel(d, i, lang)}</div>${lines}`;
      tip.hidden = false;
      const x = ((i + 0.5) / d.n) * plot.clientWidth;
      const half = tip.offsetWidth / 2;
      tip.style.left = `${Math.min(Math.max(x, half), plot.clientWidth - half)}px`;
      tip.style.top = "0px";
    };
    const hide = () => { tip.hidden = true; plot.querySelectorAll(".h-col.hot").forEach((c) => c.classList.remove("hot")); };
    plot.querySelectorAll(".h-col").forEach((c) => {
      const i = Number(c.dataset.i);
      c.addEventListener("mouseenter", () => show(i));
      c.addEventListener("click", () => show(i));
    });
    plot.addEventListener("mouseleave", hide);
  }

  _xTicks(d, lang) {
    const pos = (i) => `${((i + 0.5) / d.n) * 100}%`;
    let idx;
    if (d.period === "day") idx = [0, 3, 6, 9, 12, 15, 18, 21];
    else if (d.period === "month") idx = [0, 4, 9, 14, 19, 24, d.n - 1].filter((i, k, a) => i < d.n && a.indexOf(i) === k);
    else idx = [...Array(12).keys()];
    const mon = new Intl.DateTimeFormat(lang, { month: "narrow" });
    return idx.map((i) => {
      const label = d.period === "day" ? String(i).padStart(2, "0")
        : d.period === "month" ? String(i + 1)
        : mon.format(new Date(d.s.getFullYear(), i, 1));
      return `<span style="left:${pos(i)}">${label}</span>`;
    }).join("");
  }

  _bucketLabel(d, i, lang) {
    if (d.period === "day") return `${String(i).padStart(2, "0")}:00–${String((i + 1) % 24).padStart(2, "0")}:00`;
    if (d.period === "month") {
      return new Intl.DateTimeFormat(lang, { day: "numeric", month: "long", weekday: "short" })
        .format(new Date(d.s.getFullYear(), d.s.getMonth(), i + 1));
    }
    return new Intl.DateTimeFormat(lang, { month: "long", year: "numeric" }).format(new Date(d.s.getFullYear(), i, 1));
  }

  _updateDialog() {
    const { kind, el } = this._dialog;
    const t = this._t;
    if (kind.startsWith("history:")) {
      this._historyLiveRefresh();
    } else if (kind === "settings") {
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
      this._renderFlows(el);
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
