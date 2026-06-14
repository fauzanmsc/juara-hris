// ============================================================
// JEF GROUP HRIS — Google Apps Script Backend
// Version: 2.0 | Author: JEF GROUP Dev
// Deploy sebagai Web App: Execute as "Me", Access "Anyone"
// ============================================================

// ============ KONFIGURASI SPREADSHEET ============
const SPREADSHEET_ID = '1wQ7PB5Zl7UpXE8kVuAD6fZDyPGxY1_pPMNJS5NiHg9E'; // Ganti dengan ID Google Sheets Anda
const DRIVE_FOLDER_ID = '1BGiuWcUZlIQSSFsnqfsfRjZC6ZoO7iRq'; // Folder Google Drive untuk foto

// Sheet names
const SHEET = {
  USERS: 'tbl_users',
  ATTENDANCE: 'tbl_attendance',
  LEAVE: 'tbl_leave_requests',
  HOLIDAYS: 'tbl_holidays',
  CONFIG: 'tbl_config',
  QUOTAS: 'tbl_leave_quota',
  POSITION: 'tbl_position',
  TASKS: 'tbl_tasks'
};

// ============ HELPER: CONFIG ============

function getAllConfig() {
  const keys = [
    'office_latitude', 'office_longitude', 'max_radius_meters',
    'weekday_start', 'weekday_end', 'saturday_start', 'saturday_end',
    'tolerance_minutes', 'wa_admin', 'email_hrd'
  ];
  const config = {};
  keys.forEach(k => {
    config[k] = getConfigVal(k, '');
  });
  return config;
}

function getConfigVal(key, defaultVal) {
  const rows = sheetToObjects(getSheet(SHEET.CONFIG));

  const found = rows.find(r => String(r.key).trim() === String(key).trim());

  if (!found || found.value === '' || found.value === null) {
    return defaultVal;
  }
  let val;
  if (Object.prototype.toString.call(found.value) === '[object Date]') {
    var h = String(found.value.getHours()).padStart(2, '0');
    var m = String(found.value.getMinutes()).padStart(2, '0');
    val = h + ':' + m;
  } else {
    val = String(found.value).trim();
  }

  // FIX GOOGLE SHEETS INDONESIA FORMAT
  if (
    key === 'office_latitude' ||
    key === 'office_longitude'
  ) {

    val = val.replace(/,/g, '.');
    const isNegative = val.startsWith('-');

    val = val.replace('-', '');

    const parts = val.split('.');

    if (parts.length > 2) {
      val = parts[0] + '.' + parts.slice(1).join('');
    }

    if (isNegative) {
      val = '-' + val;
    }
  }

  return val;
}

function parseConfigNumber(value, defaultVal) {
  const fallback = Number(defaultVal);
  if (value === '' || value === null || value === undefined) return fallback;

  const cleaned = String(value).trim().replace(/,/g, '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? fallback : parsed;
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = function (value) { return value * Math.PI / 180; };
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function validateAttendanceLocation(lat, lng) {
  const userLat = parseConfigNumber(lat, NaN);
  const userLng = parseConfigNumber(lng, NaN);
  const officeLat = parseConfigNumber(getConfigVal('office_latitude', '-6.4063219'), NaN);
  const officeLng = parseConfigNumber(getConfigVal('office_longitude', '106.7731088'), NaN);
  const maxRadius = parseConfigNumber(getConfigVal('max_radius_meters', '200'), 200);

  if ([userLat, userLng, officeLat, officeLng, maxRadius].some(function (value) { return isNaN(value); })) {
    return {
      valid: false,
      distance: null,
      maxRadius: maxRadius,
      message: 'Konfigurasi lokasi kantor atau GPS tidak valid. Hubungi HR.'
    };
  }

  const distance = haversineMeters(userLat, userLng, officeLat, officeLng);
  if (distance > maxRadius) {
    return {
      valid: false,
      distance: distance,
      maxRadius: maxRadius,
      message: `Jarak ${Math.round(distance)}m melebihi batas ${Math.round(maxRadius)}m dari kantor`
    };
  }

  return {
    valid: true,
    distance: distance,
    maxRadius: maxRadius
  };
}

// ============ CONFIG ============

function saveConfig(body) {
  const sheet = getSheet(SHEET.CONFIG);
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const keyIdx = headers.indexOf('key');
  const valIdx = headers.indexOf('value');

  const keys = ['office_latitude','office_longitude','max_radius_meters',
                 'weekday_start','weekday_end','saturday_start','saturday_end','tolerance_minutes',
                 'wa_admin', 'email_hrd', 'radius_enabled'];

  keys.forEach(key => {
    if (body[key] === undefined) return;
    let found = false;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][keyIdx]) === key) {
        sheet.getRange(i+1, valIdx+1).setValue(body[key]);
        found = true; break;
      }
    }
    if (!found) sheet.appendRow([key, body[key]]);
  });

  return { success: true };
}


