// ============================================================
// JEF GROUP HRIS — Google Apps Script Backend
// Version: 2.0 | Author: JEF GROUP Dev
// Deploy sebagai Web App: Execute as "Me", Access "Anyone"
// ============================================================

// ============ KONFIGURASI SPREADSHEET ============
const SPREADSHEET_ID = '1EXmtgASni2x2dzdDhYIYyH7F_E_Jqi_wUncLrf2U1KM'; // Ganti dengan ID Google Sheets Anda
const DRIVE_FOLDER_ID = '1wciBOc5tFFwzMPVI1G42bUmfpOxamlMQ'; // Folder Google Drive untuk foto

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

// ============ ENTRY POINTS ============

function doGet(e) {
  const action = e.parameter.action || '';
  try {
    let result;
    switch(action) {
      case 'preflight':      result = preflightCheck(e.parameter); break;
      case 'employeeDashboard': result = getEmployeeDashboard(e.parameter); break;
      case 'adminDashboard': result = getAdminDashboard(e.parameter); break;
      case 'getUsers':       result = getUsers(); break;
      case 'getPendingLeaves': result = getPendingLeaves(); break;
      case 'getAttendance':  result = getAttendanceLog(e.parameter); break;
      case 'leaveHistory':   result = getLeaveHistory(e.parameter.user_id); break;
      case 'getLeaveReport':  result = getLeaveReport(e.parameter); break;
      case 'getPositions':   result = getPositions(); break;
      case 'getDivisions':   result = getDivisions(); break;
      case 'getConfig':
        result = {
          success: true,
          config: getAllConfig(),
          holidays: getHolidays().holidays
        };
        break;
      case 'getHolidays':    result = getHolidays(); break;
      case 'getTasks':       result = getTasks(e.parameter); break;
      default:               result = { success: false, message: 'Action tidak dikenali' };
    }
    return jsonResponse(result);
  } catch(err) {
    return jsonResponse({ success: false, message: err.message });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action || '';
    let result;
    switch(action) {
      case 'login':          result = login(body); break;
      case 'clockIn':        result = clockIn(body); break;
      case 'clockOut':       result = clockOut(body); break;
      case 'submitLeave':    result = submitLeave(body); break;
      case 'decideLeave':    result = decideLeave(body); break;
      case 'deleteLeave':    result = deleteLeaveRequest(body); break;
      case 'addUser':        result = addUser(body); break;
      case 'updateUser':     result = updateUser(body); break;
      case 'updateUserStatus': result = updateUserStatus(body); break;
      case 'saveConfig':     result = saveConfig(body); break;
      case 'addHoliday':     result = addHoliday(body); break;
      case 'deleteHoliday':  result = deleteHoliday(body); break;
      case 'updateLeaveQuota': result = updateLeaveQuota(body); break;
      case 'registerEmployee': result = registerEmployee(body); break;
      case 'addPosition':    result = addPosition(body); break;
      case 'deletePosition': result = deletePosition(body); break;
      case 'addDivision':    result = addDivision(body); break;
      case 'deleteDivision': result = deleteDivision(body); break;
      case 'createTask':     result = createTask(body); break;
      case 'updateTask':     result = updateTask(body); break;
      case 'deleteTask':     result = deleteTask(body); break;
      default:               result = { success: false, message: 'Action tidak dikenali' };
    }
    return jsonResponse(result);
  } catch(err) {
    return jsonResponse({ success: false, message: err.message });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}


// ============ HELPER: SPREADSHEET ============

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error(`Sheet "${name}" tidak ditemukan`);
  return sheet;
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0].map(h => String(h).trim());
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function generateId(prefix) {
  return prefix + '_' + new Date().getTime() + '_' + Math.floor(Math.random() * 1000);
}

/**
 * Generate next sequential user id in the form USR{NNN} based on existing tbl_users.
 * Falls back to 'USR001' if no numeric user ids found.
 */
function getNextUserId() {
  try {
    const users = sheetToObjects(getSheet(SHEET.USERS));
    let maxNum = 0;
    let maxDigits = 3;
    users.forEach(u => {
      const id = String(u.user_id || '');
      const m = id.match(/^USR0*(\d+)$/);
      if (m) {
        const digits = m[1].length;
        const num = parseInt(m[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
        if (digits > maxDigits) maxDigits = digits;
      }
    });
    const next = maxNum + 1;
    return 'USR' + String(next).padStart(maxDigits, '0');
  } catch (e) {
    return 'USR001';
  }
}

function getTodayString() {
  return Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd');
}

function getTimeString() {
  return Utilities.formatDate(new Date(), 'GMT+7', 'HH:mm:ss');
}

function formatDate(d) {
  return Utilities.formatDate(new Date(d), 'GMT+7', 'yyyy-MM-dd');
}

function formatTimeVal(val) {
  if (!val) return '';
  if (Object.prototype.toString.call(val) === '[object Date]') {
    return Utilities.formatDate(val, 'GMT+7', 'HH:mm');
  }
  var str = String(val).trim();
  var match = str.match(/(\d{2}):(\d{2}):\d{2}/);
  if (match) {
    return match[1] + ':' + match[2];
  }
  var match2 = str.match(/(\d{2}):(\d{2})/);
  if (match2) {
    return match2[1] + ':' + match2[2];
  }
  if (str.includes(':')) {
    return str.substring(0, 5);
  }
  if (str.includes('Sat') || str.includes('1899')) {
    return '';
  }
  return str;
}


// ============ HELPER: DRIVE ============

function uploadBase64ToDrive(base64Data, filename, folder) {
  try {
    const cleanBase64 = base64Data.split(',').length > 1 ? base64Data.split(',')[1] : base64Data;
    const decoded = Utilities.base64Decode(cleanBase64);
    const blob = Utilities.newBlob(decoded, 'image/jpeg', filename);
    const driveFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const subFolder = driveFolder.getFoldersByName(folder).hasNext()
      ? driveFolder.getFoldersByName(folder).next()
      : driveFolder.createFolder(folder);
    const file = subFolder.createFile(blob);
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {
      Logger.log('Sharing restricted: ' + shareErr.message);
    }
    return {
      url: `https://drive.google.com/uc?id=${file.getId()}`,
      id: file.getId()
    };
  } catch(e) {
    return { url: 'ERROR: ' + e.message, id: null };
  }
}


// ============ HELPER: CONFIG ============

function getAllConfig() {
  const rows = sheetToObjects(getSheet(SHEET.CONFIG));
  const config = {
    wa_admin: '628123456789',
    email_hrd: 'hrd@jefgroup.id'
  };
  rows.forEach(r => { config[r.key] = r.value; });
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
    val = Utilities.formatDate(found.value, 'GMT+7', 'HH:mm');
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

// ============ AUTH ============

function login(body) {
  const { email, password_pin } = body;
  if (!email || !password_pin) return { success: false, message: 'Email dan PIN wajib diisi' };

  const users = sheetToObjects(getSheet(SHEET.USERS));
  const user = users.find(u =>
    String(u.email).toLowerCase() === String(email).toLowerCase() &&
    String(u.password_pin) === String(password_pin)
  );

  if (!user) return { success: false, message: 'Email atau PIN salah' };

  if (user.status === 'Pending') {
    return { success: false, message: 'Akses Akun Anda belum disetujui' };
  }

  if (user.status === 'Inactive') {
    return { success: false, message: 'Akun Anda dinonaktifkan. Silakan hubungi HR.' };
  }

  return {
    success: true,
    user: {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      position: user.position,
      profile_pic_url: user.profile_pic_url || '',
      division: user.division || 'Umum'
    }
  };
}


// ============ PRE-FLIGHT CHECK ============

function preflightCheck(params) {
  const { user_id } = params;
  const today = getTodayString();

  // 1. Cek hari libur (mendukung single date dan date range)
  const holidays = sheetToObjects(getSheet(SHEET.HOLIDAYS));
  const todayTime = new Date(today + 'T00:00:00').getTime();
  const holiday = holidays.find(h => {
    const startStr = h.start_date ? formatDate(h.start_date) : (h.date ? formatDate(h.date) : '');
    const endStr = h.end_date ? formatDate(h.end_date) : startStr;
    if (!startStr) return false;
    const startT = new Date(startStr + 'T00:00:00').getTime();
    const endT = new Date(endStr + 'T00:00:00').getTime();
    return todayTime >= startT && todayTime <= endT;
  });
  if (holiday) {
    return { success: false, lock_type: 'holiday', message: `Libur Operasional: ${holiday.description}` };
  }

  // 1.5 Cek otomatis Hari Minggu (Libur Operasional)
  const checkDate = new Date(today + 'T00:00:00');
  if (checkDate.getDay() === 0) { // 0 = Hari Minggu
    return { success: false, lock_type: 'holiday', message: 'Libur Operasional (Hari Kerja: Senin - Sabtu)' };
  }

  // 2. Cek status cuti/izin/sakit yang approved
  const leaves = sheetToObjects(getSheet(SHEET.LEAVE));
  const activeLeave = leaves.find(l =>
    l.user_id === user_id &&
    l.status === 'Approved' &&
    formatDate(l.start_date) <= today &&
    formatDate(l.end_date) >= today
  );
  if (activeLeave) {
    return {
      success: false, lock_type: 'leave',
      message: `Anda sedang dalam masa ${activeLeave.type} s.d ${formatDate(activeLeave.end_date)}`
    };
  }

  // 3. Cek sudah absen masuk atau belum hari ini
  const attendance = sheetToObjects(getSheet(SHEET.ATTENDANCE));
  const todayAtt = attendance.find(a => a.user_id === user_id && formatDate(a.date) === today);
  const hasClockedIn = !!(todayAtt && todayAtt.clock_in_time);
  const hasClockedOut = !!(todayAtt && todayAtt.clock_out_time);

  return {
    success: true,
    has_clocked_in: hasClockedIn,
    has_clocked_out: hasClockedOut,
    attendance_id: todayAtt ? todayAtt.attendance_id : null,
    config: {
      office_latitude: getConfigVal('office_latitude', '-6.4063219'),
      office_longitude: getConfigVal('office_longitude', '106.7731088'),
      max_radius_meters: getConfigVal('max_radius_meters', '200')
    }
  };
}


// ============ CLOCK IN ============

function clockIn(body) {
  const { user_id, lat, lng, photo_base64 } = body;
  const today = getTodayString();
  const now = new Date();
  const timeStr = Utilities.formatDate(now, 'GMT+7', 'HH:mm:ss');
  const dayName = Utilities.formatDate(now, 'GMT+7', 'EEEE'); // 'Monday', 'Tuesday', ...
  const isSaturday = (dayName === 'Saturday');

  const locationCheck = validateAttendanceLocation(lat, lng);
  if (!locationCheck.valid) return { success: false, message: locationCheck.message };
  const distanceMeters = Math.round(locationCheck.distance);

  // Cek sudah clock in hari ini
  const attendance = sheetToObjects(getSheet(SHEET.ATTENDANCE));
  const todayAtt = attendance.find(a => a.user_id === user_id && formatDate(a.date) === today);
  if (todayAtt && todayAtt.clock_in_time) {
    return { success: false, message: 'Anda sudah melakukan Clock In hari ini' };
  }

  // Hitung status (Tepat Waktu / Terlambat)
  let scheduleStart, toleranceMin;
  toleranceMin = parseInt(getConfigVal('tolerance_minutes', '15'));

  if (isSaturday) { // Sabtu
    scheduleStart = getConfigVal('saturday_start', '09:00');
  } else { // Senin-Jumat
    scheduleStart = getConfigVal('weekday_start', '10:00');
  }

  const [sH, sM] = scheduleStart.split(':').map(Number);
  const deadlineMin = sH * 60 + sM + toleranceMin;
  const [cH, cM] = timeStr.split(':').map(Number);
  const clockMinutes = cH * 60 + cM;
  const statusIn = clockMinutes <= deadlineMin ? 'Tepat Waktu' : 'Terlambat';

  // Upload foto
  let photoData = { url: 'NO_PHOTO_PROVIDED_BY_FRONTEND', id: null };
  if (photo_base64) {
    photoData = uploadBase64ToDrive(photo_base64, `in_${user_id}_${today}.jpg`, 'foto_absensi');
  }

  // Simpan ke sheet
  const sheet = getSheet(SHEET.ATTENDANCE);
  const newId = generateId('ATT');
  const lastRow = sheet.getLastRow() + 1;
  
  sheet.appendRow([
    newId, user_id, today,
    timeStr, '',
    lat, lng,
    '', '',
    distanceMeters, '',
    photoData.url, '',
    statusIn, '', ''
  ]);

  // Insert Smart Chip jika upload berhasil
  if (photoData.id) {
    try {
      sheet.getRange(lastRow, 12).insertFileChip(photoData.id); // Kolom L (12)
    } catch (e) { Logger.log('Chip error: ' + e.message); }
  }

  return { success: true, attendance_id: newId, status: statusIn, time: timeStr };
}


// ============ CLOCK OUT ============

function clockOut(body) {
  const { user_id, lat, lng, photo_base64 } = body;
  const today = getTodayString();
  const now = new Date();
  const timeStr = Utilities.formatDate(now, 'GMT+7', 'HH:mm:ss');
  const dayName = Utilities.formatDate(now, 'GMT+7', 'EEEE'); // 'Monday', 'Tuesday', ...
  const isSaturday = (dayName === 'Saturday');

  const locationCheck = validateAttendanceLocation(lat, lng);
  if (!locationCheck.valid) return { success: false, message: locationCheck.message };
  const distanceMeters = Math.round(locationCheck.distance);

  const sheet = getSheet(SHEET.ATTENDANCE);
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const idx = {
    user_id: headers.indexOf('user_id'),
    date: headers.indexOf('date'),
    clock_out_time: headers.indexOf('clock_out_time'),
    lat_out: headers.indexOf('lat_out'),
    lng_out: headers.indexOf('lng_out'),
    distance_out_meters: headers.indexOf('distance_out_meters'),
    photo_out_url: headers.indexOf('photo_out_url'),
    status_out: headers.indexOf('status_out')
  };

  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idx.user_id]) === String(user_id) &&
        formatDate(data[i][idx.date]) === today &&
        !data[i][idx.clock_out_time]) {
      rowIndex = i + 1; break;
    }
  }

  if (rowIndex === -1) return { success: false, message: 'Data Clock In hari ini tidak ditemukan' };

  // Hitung status pulang
  let scheduleEnd;
  if (isSaturday) scheduleEnd = getConfigVal('saturday_end', '17:00');
  else scheduleEnd = getConfigVal('weekday_end', '19:00');
  const [eH, eM] = scheduleEnd.split(':').map(Number);
  const endMinutes = eH * 60 + eM;
  const [cH, cM] = timeStr.split(':').map(Number);
  const clockMinutes = cH * 60 + cM;
  const statusOut = clockMinutes >= endMinutes ? 'Normal' : 'Pulang Cepat';

  // Upload foto
  let photoData = { url: 'NO_PHOTO_PROVIDED_BY_FRONTEND', id: null };
  if (photo_base64) {
    photoData = uploadBase64ToDrive(photo_base64, `out_${user_id}_${today}.jpg`, 'foto_absensi');
  }

  // Update baris
  sheet.getRange(rowIndex, idx.clock_out_time + 1).setValue(timeStr);
  sheet.getRange(rowIndex, idx.lat_out + 1).setValue(lat);
  sheet.getRange(rowIndex, idx.lng_out + 1).setValue(lng);
  if (idx.distance_out_meters !== -1) {
    sheet.getRange(rowIndex, idx.distance_out_meters + 1).setValue(distanceMeters);
  }
  sheet.getRange(rowIndex, idx.photo_out_url + 1).setValue(photoData.url);
  sheet.getRange(rowIndex, idx.status_out + 1).setValue(statusOut);

  // Insert Smart Chip jika upload berhasil
  if (photoData.id) {
    try {
      sheet.getRange(rowIndex, idx.photo_out_url + 1).insertFileChip(photoData.id);
    } catch (e) { Logger.log('Chip error: ' + e.message); }
  }

  return { success: true, status: statusOut, time: timeStr };
}


// ============ LEAVE ============

function submitLeave(body) {
  const { user_id, type, start_date, end_date, reason, attachment_base64, attachment_name } = body;
  if (!user_id || !type || !start_date || !end_date || !reason) {
    return { success: false, message: 'Data pengajuan tidak lengkap' };
  }

  let photoData = { url: '', id: null };
  if (attachment_base64) {
    const ext = (attachment_name || 'doc').split('.').pop();
    const fname = `leave_${user_id}_${Date.now()}.${ext}`;
    photoData = uploadBase64ToDrive(attachment_base64, fname, 'dokumen_cuti');
  }

  const sheet = getSheet(SHEET.LEAVE);
  const newId = generateId('LVR');
  const lastRow = sheet.getLastRow() + 1;
  
  // If this is a 'Cuti' request, validate remaining quota first
  if (String(type).toLowerCase() === 'cuti') {
    try {
      const quotaSheet = getOrCreateSheet(SHEET.QUOTAS, ['user_id', 'name', 'allowed_leave_quota']);
      const quotas = sheetToObjects(quotaSheet);
      let qRecord = quotas.find(q => String(q.user_id) === String(user_id));
      let allowedQuota = 12;
      if (qRecord) allowedQuota = Number(qRecord.allowed_leave_quota);
      else quotaSheet.appendRow([user_id, '', 12]);

      // Calculate requested days (inclusive)
      const s = new Date(start_date);
      const e = new Date(end_date);
      const reqDays = Math.round((e - s) / (24 * 3600 * 1000)) + 1;

      // Count existing Cuti (Approved + Pending) for this user
      const allLeaves = sheetToObjects(getSheet(SHEET.LEAVE));
      const usedCuti = allLeaves
        .filter(l => String(l.user_id) === String(user_id) && String(l.type) === 'Cuti' && String(l.status) !== 'Rejected')
        .reduce((sum, l) => {
          const s2 = new Date(l.start_date);
          const e2 = new Date(l.end_date);
          const days = Math.round((e2 - s2) / (24 * 3600 * 1000)) + 1;
          return sum + (isNaN(days) ? 0 : days);
        }, 0);

      const remaining = allowedQuota - usedCuti;
      if (reqDays > remaining) {
        return { success: false, message: `Kuota cuti tidak mencukupi. Sisa kuota: ${remaining} hari` };
      }
    } catch (e) {
      // if quota check fails for any reason, allow submission but log
      Logger.log('Quota check failed: ' + e.message);
    }
  }

  sheet.appendRow([
    newId, user_id, type,
    start_date, end_date, reason,
    photoData.url, 'Pending', '', // attachment, status, approved_by
    new Date().toISOString() // created_at
  ]);

  // Auto Chip Lampiran Cuti
  if (photoData.id) {
    try { sheet.getRange(lastRow, 7).insertFileChip(photoData.id); } catch(e) {}
  }

  return { success: true, request_id: newId };
}

function decideLeave(body) {
  const { request_id, status, approved_by } = body;
  const sheet = getSheet(SHEET.LEAVE);
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const idIdx = headers.indexOf('request_id');
  const statusIdx = headers.indexOf('status');
  const approvedByIdx = headers.indexOf('approved_by');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === String(request_id)) {
      sheet.getRange(i + 1, statusIdx + 1).setValue(status);
      sheet.getRange(i + 1, approvedByIdx + 1).setValue(approved_by);
      return { success: true };
    }
  }
  return { success: false, message: 'Pengajuan tidak ditemukan' };
}

function getPendingLeaves() {
  const leaves = sheetToObjects(getSheet(SHEET.LEAVE));
  const users = sheetToObjects(getSheet(SHEET.USERS));

  const enriched = leaves.map(l => {
    const user = users.find(u => u.user_id === l.user_id);
    return { ...l, user_name: user ? user.name : 'Unknown', start_date: formatDate(l.start_date), end_date: formatDate(l.end_date) };
  }).sort((a, b) => {
    // Pending first
    if (a.status === 'Pending' && b.status !== 'Pending') return -1;
    if (b.status === 'Pending' && a.status !== 'Pending') return 1;
    return 0;
  });

  return { success: true, requests: enriched };
}

function getLeaveHistory(user_id) {
  const leaves = sheetToObjects(getSheet(SHEET.LEAVE));
  const filtered = leaves
    .filter(l => l.user_id === user_id)
    .map(l => ({ ...l, start_date: formatDate(l.start_date), end_date: formatDate(l.end_date) }))
    .reverse();
  return { success: true, requests: filtered };
}

function deleteLeaveRequest(body) {
  const { request_id, user_role, user_id } = body;
  const sheet = getSheet(SHEET.LEAVE);
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const idIdx = headers.indexOf('request_id');
  const statusIdx = headers.indexOf('status');
  const userIdIdx = headers.indexOf('user_id');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === String(request_id)) {
      const currentStatus = String(data[i][statusIdx]).toLowerCase();
      const ownerId = String(data[i][userIdIdx]);

      // If user is Admin, they can ALWAYS delete
      // If user is Employee, they can ONLY delete if status is 'pending' AND they are the owner
      if (user_role === 'Admin' || (user_role === 'Employee' && ownerId === user_id && currentStatus === 'pending')) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Pengajuan cuti berhasil dibatalkan/dihapus' };
      } else {
        return { success: false, message: 'Anda tidak memiliki wewenang untuk menghapus pengajuan ini' };
      }
    }
  }
  return { success: false, message: 'Pengajuan tidak ditemukan' };
}


// ============ USERS CRUD ============

function getUsers() {
  ensureUsersDivisionMigration();
  const users = sheetToObjects(getSheet(SHEET.USERS));
  const safe = users.map(u => ({
    user_id: u.user_id, 
    name: u.name, 
    email: u.email,
    position: u.position, 
    role: u.role, 
    status: u.status,
    profile_pic_url: u.profile_pic_url,
    division: u.division || 'Umum'
  }));
  return { success: true, users: safe };
}

function addUser(body) {
  const { name, email, password_pin, position, role } = body;
  if (!name || !email || !password_pin) return { success: false, message: 'Nama, email, dan PIN wajib diisi' };

  // Cek duplikat email
  const users = sheetToObjects(getSheet(SHEET.USERS));
  if (users.find(u => String(u.email).toLowerCase() === String(email).toLowerCase())) {
    return { success: false, message: 'Email sudah terdaftar' };
  }

  // Cari divisi dari jabatan
  let division = body.division || 'Umum';
  if (!body.division) {
    try {
      const posSheet = getSheet('tbl_position');
      if (posSheet) {
        const posData = posSheet.getDataRange().getValues();
        for (let i = 1; i < posData.length; i++) {
          if (posData[i][0] === position) {
            division = posData[i][1] || 'Umum';
            break;
          }
        }
      }
    } catch (e) {}
  }

  ensureUsersDivisionMigration();
  const sheet = getSheet(SHEET.USERS);
  const newId = getNextUserId();
  sheet.appendRow([newId, name, email, password_pin, role || 'Employee', position, '', 'Active', division]);
  return { success: true, user_id: newId };
}

function updateUser(body) {
  const { user_id, name, email, password_pin, position, role } = body;
  const sheet = getSheet(SHEET.USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());

  ensureUsersDivisionMigration();
  const refreshedHeaders = sheet.getDataRange().getValues()[0].map(h => String(h).trim());

  const idx = {
    user_id: refreshedHeaders.indexOf('user_id'),
    name: refreshedHeaders.indexOf('name'),
    email: refreshedHeaders.indexOf('email'),
    password_pin: refreshedHeaders.indexOf('password_pin'),
    role: refreshedHeaders.indexOf('role'),
    position: refreshedHeaders.indexOf('position'),
    profile_pic_url: refreshedHeaders.indexOf('profile_pic_url'),
    division: refreshedHeaders.indexOf('division')
  };

  let profilePicUrl = body.profile_pic_url;
  if (body.profile_pic_base64) {
    const photoData = uploadBase64ToDrive(body.profile_pic_base64, `profile_${user_id}_${Date.now()}.jpg`, 'foto_profil');
    if (photoData.url && !photoData.url.startsWith('ERROR')) {
      profilePicUrl = photoData.url;
    }
  }

  // Cari divisi dari jabatan
  let division = body.division || '';
  if (!body.division && position) {
    try {
      const posSheet = getSheet('tbl_position');
      if (posSheet) {
        const posData = posSheet.getDataRange().getValues();
        for (let i = 1; i < posData.length; i++) {
          if (posData[i][0] === position) {
            division = posData[i][1] || 'Umum';
            break;
          }
        }
      }
    } catch (e) {}
  }

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idx.user_id]) === String(user_id)) {
      if (name) sheet.getRange(i+1, idx.name+1).setValue(name);
      if (email) sheet.getRange(i+1, idx.email+1).setValue(email);
      if (password_pin) sheet.getRange(i+1, idx.password_pin+1).setValue(password_pin);
      if (position) sheet.getRange(i+1, idx.position+1).setValue(position);
      if (division && idx.division !== -1) {
        sheet.getRange(i+1, idx.division+1).setValue(division);
      }
      if (role) sheet.getRange(i+1, idx.role+1).setValue(role);
      if (profilePicUrl) sheet.getRange(i+1, idx.profile_pic_url+1).setValue(profilePicUrl);
      
      return { success: true, profile_pic_url: profilePicUrl };
    }
  }
  return { success: false, message: 'User tidak ditemukan' };
}

function updateUserStatus(body) {
  const { user_id, status } = body;
  const sheet = getSheet(SHEET.USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const userIdIdx = headers.indexOf('user_id');
  const statusIdx = headers.indexOf('status');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][userIdIdx]) === String(user_id)) {
      sheet.getRange(i+1, statusIdx+1).setValue(status);
      return { success: true };
    }
  }
  return { success: false, message: 'User tidak ditemukan' };
}


// ============ ATTENDANCE LOG ============

function getAttendanceLog(params) {
  const { start_date, end_date, name, status, user_id } = params;
  const attendance = sheetToObjects(getSheet(SHEET.ATTENDANCE));
  const users = sheetToObjects(getSheet(SHEET.USERS));
  // Map attendance rows to API-safe objects and normalize time/status using current config
  let records = attendance.map(a => {
    const user = users.find(u => u.user_id === a.user_id);

    // Normalize date and times to string values (prevent timezone shifts when Dates are JSON-serialized)
    const dateStr = formatDate(a.date);
    const clockInStr = formatTimeVal(a.clock_in_time);
    const clockOutStr = formatTimeVal(a.clock_out_time);

    // Recalculate status based on config (weekday vs saturday) and tolerance
    const dayName = Utilities.formatDate(new Date(a.date), 'GMT+7', 'EEEE');
    const isSaturday = (dayName === 'Saturday');
    const scheduleStart = isSaturday ? getConfigVal('saturday_start', '09:00') : getConfigVal('weekday_start', '10:00');
    const scheduleEnd = isSaturday ? getConfigVal('saturday_end', '17:00') : getConfigVal('weekday_end', '19:00');
    const toleranceMin = parseInt(getConfigVal('tolerance_minutes', '15')) || 0;

    let statusIn = a.status_in || '';
    if (clockInStr) {
      const [sH, sM] = scheduleStart.split(':').map(Number);
      const deadlineMin = (sH * 60 + sM) + toleranceMin;
      const [cH, cM] = clockInStr.split(':').map(Number);
      const clockMinutes = (cH || 0) * 60 + (cM || 0);
      statusIn = clockMinutes <= deadlineMin ? 'Tepat Waktu' : 'Terlambat';
    }

    let statusOut = a.status_out || '';
    if (clockOutStr) {
      const [eH, eM] = scheduleEnd.split(':').map(Number);
      const endMinutes = (eH * 60 + eM);
      const [cH2, cM2] = clockOutStr.split(':').map(Number);
      const clockMinutes2 = (cH2 || 0) * 60 + (cM2 || 0);
      statusOut = clockMinutes2 >= endMinutes ? 'Normal' : 'Pulang Cepat';
    }

    return {
      ...a,
      name: user ? user.name : 'Unknown',
      position: user ? user.position : '',
      profile_pic: user ? (user.profile_pic_url || '') : '',
      date: dateStr,
      clock_in_time: clockInStr,
      clock_out_time: clockOutStr,
      status_in: statusIn,
      status_out: statusOut
    };
  });

  if (user_id) records = records.filter(r => String(r.user_id).trim() === String(user_id).trim());
  if (start_date) records = records.filter(r => r.date >= start_date);
  if (end_date) records = records.filter(r => r.date <= end_date);
  if (name) records = records.filter(r => String(r.name).toLowerCase().includes(String(name).toLowerCase()));
  if (status) records = records.filter(r => r.status_in === status);

  // Calculate Analytics for Top 3
  const activeEmployees = users.filter(u => u.role === 'Employee' && u.status === 'Active');
  const leaves = sheetToObjects(getSheet(SHEET.LEAVE));
  const holidays = sheetToObjects(getSheet(SHEET.HOLIDAYS));

  // Find all unique dates in attendance sheet
  const uniqueDates = [...new Set(attendance.map(a => formatDate(a.date)))].sort();
  
  const employeeAnalytics = activeEmployees.map(emp => {
    // 1. Calculate Sick + Permit (Sakit & Izin)
    const empLeaves = leaves.filter(l => 
      String(l.user_id) === String(emp.user_id) && 
      l.status === 'Approved' && 
      (l.type === 'Sakit' || l.type === 'Izin')
    );
    
    const sickPermitDays = empLeaves.reduce((sum, l) => {
      const start = new Date(l.start_date);
      const end = new Date(l.end_date);
      const days = Math.round((end - start) / (24 * 3600 * 1000)) + 1;
      return sum + (isNaN(days) ? 0 : days);
    }, 0);

    // 2. Calculate Absences (Tidak Hadir)
    let absentDays = 0;
    uniqueDates.forEach(dStr => {
      // Skip if Sunday
      const dt = new Date(dStr + 'T00:00:00');
      if (dt.getDay() === 0) return;
      
      // Skip if holiday
      const isHoliday = holidays.some(h => {
        const start = h.start_date ? formatDate(h.start_date) : (h.date ? formatDate(h.date) : '');
        const end = h.end_date ? formatDate(h.end_date) : start;
        return dStr >= start && dStr <= end;
      });
      if (isHoliday) return;

      // Check if present
      const wasPresent = attendance.some(a => 
        String(a.user_id) === String(emp.user_id) && 
        formatDate(a.date) === dStr
      );
      if (wasPresent) return;

      // Check if on approved leave
      const wasOnLeave = leaves.some(l => 
        String(l.user_id) === String(emp.user_id) && 
        l.status === 'Approved' && 
        formatDate(l.start_date) <= dStr && 
        formatDate(l.end_date) >= dStr
      );
      if (wasOnLeave) return;

      absentDays++;
    });

    return {
      user_id: emp.user_id,
      name: emp.name,
      position: emp.position || 'Employee',
      profile_pic_url: emp.profile_pic_url || '',
      sick_permit_days: sickPermitDays,
      absent_days: absentDays
    };
  });

  // Top 3 Absent
  const topAbsent = [...employeeAnalytics]
    .sort((a, b) => b.absent_days - a.absent_days)
    .slice(0, 3)
    .filter(x => x.absent_days > 0);

  // Top 3 Sick & Permit
  const topSickPermit = [...employeeAnalytics]
    .sort((a, b) => b.sick_permit_days - a.sick_permit_days)
    .slice(0, 3)
    .filter(x => x.sick_permit_days > 0);

  return { 
    success: true, 
    records: records.reverse(),
    analytics: {
      top_absent: topAbsent,
      top_sick_permit: topSickPermit
    }
  };
}


// ============ DASHBOARD ============

function getEmployeeDashboard(params) {
  const { user_id } = params;
  const today = getTodayString();
  const [yearStr, monthStr] = today.split('-');
  const monthStart = `${yearStr}-${monthStr}-01`;

  const attendance = sheetToObjects(getSheet(SHEET.ATTENDANCE));
  const thisMonth = attendance.filter(a =>
    a.user_id === user_id && formatDate(a.date) >= monthStart
  );

  const todayAtt = thisMonth.find(a => formatDate(a.date) === today);
  const hadir = thisMonth.length;
  const terlambat = thisMonth.filter(a => a.status_in === 'Terlambat').length;

  // Recent activities
  const recentAtts = thisMonth.slice(-5).reverse().map(a => ({
    title: a.clock_out_time ? 'Clock In & Out' : 'Clock In',
    desc: a.status_in || '',
    time: formatDate(a.date), // Use actual attendance date as requested by the user
    color: a.status_in === 'Terlambat' ? 'orange' : 'green'
  }));

  const user = sheetToObjects(getSheet(SHEET.USERS)).find(u => u.user_id === user_id);

  // Check today's holiday
  const holidays = sheetToObjects(getSheet(SHEET.HOLIDAYS));
  const todayHoliday = holidays.find(h => formatDate(h.date) === today);

  // Check today's active leave
  const leaves = sheetToObjects(getSheet(SHEET.LEAVE));
  const todayLeave = leaves.find(l => 
    l.user_id === user_id &&
    l.status === 'Approved' &&
    formatDate(l.start_date) <= today &&
    formatDate(l.end_date) >= today
  );

  // Get latest approved leave for notifications
  const approvedLeaves = leaves.filter(l => l.user_id === user_id && l.status === 'Approved');
  const latestApproved = approvedLeaves.length > 0 ? {
    leave_type: approvedLeaves[approvedLeaves.length - 1].leave_type,
    start_date: formatDate(approvedLeaves[approvedLeaves.length - 1].start_date),
    end_date: formatDate(approvedLeaves[approvedLeaves.length - 1].end_date),
    reason: approvedLeaves[approvedLeaves.length - 1].reason || ''
  } : null;

  // Get latest rejected leave for notifications
  const rejectedLeaves = leaves.filter(l => l.user_id === user_id && l.status === 'Rejected');
  const latestRejected = rejectedLeaves.length > 0 ? {
    leave_type: rejectedLeaves[rejectedLeaves.length - 1].leave_type,
    start_date: formatDate(rejectedLeaves[rejectedLeaves.length - 1].start_date),
    end_date: formatDate(rejectedLeaves[rejectedLeaves.length - 1].end_date),
    reason: rejectedLeaves[rejectedLeaves.length - 1].reason || ''
  } : null;

  const quotaSheet = getOrCreateSheet(SHEET.QUOTAS, ['user_id', 'name', 'allowed_leave_quota']);
  const quotas = sheetToObjects(quotaSheet);
  let qRecord = quotas.find(q => String(q.user_id) === String(user_id));
  let allowedQuota = 12;
  if (qRecord) {
    allowedQuota = Number(qRecord.allowed_leave_quota);
  } else {
    quotaSheet.appendRow([user_id, user ? user.name : 'Karyawan', 12]);
  }

  const overallApprovedCuti = leaves.filter(l => 
    String(l.user_id) === String(user_id) && 
    l.status === 'Approved' && 
    l.type === 'Cuti'
  ).reduce((sum, l) => {
    const start = new Date(l.start_date);
    const end = new Date(l.end_date);
    const days = Math.round((end - start) / (24 * 3600 * 1000)) + 1;
    return sum + (isNaN(days) ? 0 : days);
  }, 0);

  const remainingQuota = allowedQuota - overallApprovedCuti;

  return {
    success: true,
    profile_pic_url: user ? (user.profile_pic_url || '') : '',
    division: user ? (user.division || 'Umum') : 'Umum',
    stats: { hadir, terlambat, sisa_cuti: remainingQuota >= 0 ? remainingQuota : 0 },
    today_in: todayAtt ? formatTimeVal(todayAtt.clock_in_time) : null,
    today_out: todayAtt ? formatTimeVal(todayAtt.clock_out_time) : null,
    status_in: todayAtt ? todayAtt.status_in : null,
    status_out: todayAtt ? todayAtt.status_out : null,
    activities: recentAtts,
    today_holiday: todayHoliday ? todayHoliday.description : null,
    today_leave: todayLeave ? todayLeave.leave_type + (todayLeave.reason ? ' - ' + todayLeave.reason : '') : null,
    latest_approved_leave: latestApproved,
    latest_rejected_leave: latestRejected
  };
}

function getAdminDashboard(params) {
  const { user_id } = params;
  const today = getTodayString();
  const users = sheetToObjects(getSheet(SHEET.USERS)).filter(u => u.status === 'Active');
  const admin = users.find(u => u.user_id === user_id);
  const attendance = sheetToObjects(getSheet(SHEET.ATTENDANCE));
  const leaves = sheetToObjects(getSheet(SHEET.LEAVE));

  const todayAtt = attendance.filter(a => formatDate(a.date) === today);
  const todayLeaves = leaves.filter(l =>
    l.status === 'Approved' &&
    formatDate(l.start_date) <= today &&
    formatDate(l.end_date) >= today
  );

  const hadirUserIds = todayAtt.map(a => a.user_id);
  const cutiUserIds = todayLeaves.map(l => l.user_id);
  const absenCount = users.filter(u =>
    !hadirUserIds.includes(u.user_id) && !cutiUserIds.includes(u.user_id)
  ).length;

  const pendingCount = leaves.filter(l => l.status === 'Pending').length;

  // Live log with user names
  const liveLog = todayAtt.map(a => {
    const user = users.find(u => u.user_id === a.user_id);
    return {
      name: user ? user.name : 'Unknown',
      position: user ? user.position : '',
      initials: user ? user.name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase() : 'XX',
      clock_in: formatTimeVal(a.clock_in_time),
      clock_out: formatTimeVal(a.clock_out_time) || null,
      distance: a.distance_in_meters || a.distance_meters || '',
      status_in: a.status_in,
      photo_in: a.photo_in_url || '',
      profile_pic: user ? (user.profile_pic_url || '') : ''
    };
  });

  return {
    success: true,
    profile_pic_url: admin ? (admin.profile_pic_url || '') : '',
    stats: {
      hadir: todayAtt.length,
      total: users.length,
      terlambat: todayAtt.filter(a => a.status_in === 'Terlambat').length,
      cuti: todayLeaves.length,
      absen: absenCount
    },
    pending_count: pendingCount,
    live_log: liveLog
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
                 'wa_admin', 'email_hrd'];

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


// ============ HOLIDAYS ============

function getHolidays() {
  const holidays = sheetToObjects(getSheet(SHEET.HOLIDAYS));
  return {
    success: true,
    holidays: holidays.map(h => {
      const s = h.start_date ? formatDate(h.start_date) : (h.date ? formatDate(h.date) : '');
      const e = h.end_date ? formatDate(h.end_date) : s;
      return {
        holiday_id: h.holiday_id,
        start_date: s,
        end_date: e,
        description: h.description,
        created_by: h.created_by
      };
    })
  };
}

function addHoliday(body) {
  const { start_date, end_date, description, created_by } = body;
  if (!start_date || !description) return { success: false, message: 'Tanggal dan keterangan wajib diisi' };
  const sheet = getSheet(SHEET.HOLIDAYS);
  const newId = generateId('HOL');
  const finalEndDate = end_date || start_date;

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());

  if (!headers.includes('start_date')) {
    sheet.getRange(1, 2).setValue('start_date');
    sheet.insertColumnAfter(2);
    sheet.getRange(1, 3).setValue('end_date');
  }

  sheet.appendRow([newId, start_date, finalEndDate, description, created_by || '']);
  return { success: true, holiday_id: newId };
}

function deleteHoliday(body) {
  const { holiday_id } = body;
  const sheet = getSheet(SHEET.HOLIDAYS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const idIdx = headers.indexOf('holiday_id');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === String(holiday_id)) {
      sheet.deleteRow(i+1);
      return { success: true };
    }
  }
  return { success: false, message: 'Data tidak ditemukan' };
}


// ============ SETUP HELPER ============
// Jalankan fungsi ini SEKALI untuk membuat struktur sheet otomatis
function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const schemas = {
    tbl_users: [
      'user_id',
      'name',
      'email',
      'password_pin',
      'role',
      'position',
      'profile_pic_url',
      'status'
    ],

    tbl_attendance: [
      'attendance_id',
      'user_id',
      'date',

      'clock_in_time',
      'clock_out_time',

      'lat_in',
      'lng_in',

      'lat_out',
      'lng_out',

      'distance_in_meters',
      'distance_out_meters',

      'photo_in_url',
      'photo_out_url',

      'status_in',
      'status_out',

      'notes'
    ],

    tbl_leave_requests: [
      'request_id',
      'user_id',
      'type',
      'start_date',
      'end_date',
      'reason',
      'attachment_url',
      'status',
      'approved_by',
      'created_at'
    ],

    tbl_holidays: [
      'holiday_id',
      'date',
      'description',
      'created_by'
    ],

    tbl_config: [
      'key',
      'value',
      'format'
    ]
  };

  Object.entries(schemas).forEach(([name, cols]) => {

    let sheet = ss.getSheetByName(name);

    if (!sheet) {
      sheet = ss.insertSheet(name);
    }

    sheet.clear();

    sheet
      .getRange(1, 1, 1, cols.length)
      .setValues([cols]);

    sheet
      .getRange(1, 1, 1, cols.length)
      .setFontWeight('bold');

    sheet.setFrozenRows(1);
  });

  // ===============================
  // DEFAULT CONFIG
  // ===============================

  const configSheet = ss.getSheetByName('tbl_config');

  // FORMAT TEXT DULU AGAR LAT LNG TIDAK BERUBAH
  configSheet.getRange('B:B').setNumberFormat('@STRING@');

  const defaults = [
    ['office_latitude', '-6.4063219', 'decimal'],
    ['office_longitude', '106.7731088', 'decimal'],
    ['max_radius_meters', '200', 'number'],

    ['weekday_start', '10:00', 'time'],
    ['weekday_end', '19:00', 'time'],

    ['saturday_start', '09:00', 'time'],
    ['saturday_end', '17:00', 'time'],

    ['tolerance_minutes', '15', 'number']
  ];

  configSheet
    .getRange(2, 1, defaults.length, defaults[0].length)
    .setValues(defaults);

  // FORMAT KHUSUS TIME
  configSheet.getRange('B5:B8').setNumberFormat('HH:mm');

  // FORMAT KHUSUS NUMBER
  configSheet.getRange('B4').setNumberFormat('0');
  configSheet.getRange('B9').setNumberFormat('0');

  // ===============================
  // ADMIN DEFAULT
  // ===============================

  const userSheet = ss.getSheetByName('tbl_users');

  userSheet.appendRow([
    'USR001',
    'Admin HR',
    'admin@jefgroup.com',
    '1234',
    'Admin',
    'HR Manager',
    '',
    'Active'
  ]);

  Logger.log('✅ Setup selesai');
}

// Jalankan fungsi ini secara manual di editor Google Apps Script 
// untuk memicu munculnya jendela otorisasi (Izin Google Drive)
function authorizeDrive() {
  // Mencoba akses baca
  const root = DriveApp.getRootFolder();
  // Mencoba akses tulis (PENTING untuk memicu izin Write)
  const testFile = DriveApp.createFile('AUTH_TEST_JEF_HRIS.txt', 'Otorisasi Berhasil');
  testFile.setTrashed(true); // Langsung hapus file tesnya
  Logger.log('✅ Otorisasi Menulis Drive Berhasil!');
}

// Jalankan ini sekali untuk merapikan semua data lama di Spreadsheet
// Mengubah link teks Drive menjadi Smart Chips
function convertExistingLinksToChips() {
  const sheet = getSheet(SHEET.ATTENDANCE);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return;
  
  const headers = data[0].map(h => String(h).trim());
  const idxIn = headers.indexOf('photo_in_url');
  const idxOut = headers.indexOf('photo_out_url');
  
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    const row = i + 1;
    
    // Proses Photo In
    const valIn = String(data[i][idxIn]);
    if (valIn.includes('id=')) {
      const id = valIn.split('id=')[1].split('&')[0];
      try { sheet.getRange(row, idxIn + 1).insertFileChip(id); count++; } catch(e) {}
    }
    
    // Proses Photo Out
    const valOut = String(data[i][idxOut]);
    if (valOut.includes('id=')) {
      const id = valOut.split('id=')[1].split('&')[0];
      try { sheet.getRange(row, idxOut + 1).insertFileChip(id); count++; } catch(e) {}
    }
  }
  Logger.log('✅ Selesai! Berhasil mengonversi ' + count + ' link menjadi Chips.');
}

/**
 * TRIGGER OTOMATIS:
 * Gunakan fungsi ini untuk Trigger "On Edit" (Installable)
 * Agar saat Anda paste link manual di Sheet, dia langsung jadi Chip.
 */
function handleManualEditToChip(e) {
  // Cegah error jika dijalankan manual dari editor
  if (!e || !e.range) {
    Logger.log('INFO: Fungsi ini berjalan otomatis saat Anda mengedit Sheet. Jangan dijalankan manual via tombol Run.');
    return;
  }

  const range = e.range;
  const val = String(e.value || '');
  
  if (val.includes('drive.google.com') && val.includes('id=')) {
    try {
      const id = val.split('id=')[1].split('&')[0];
      range.insertFileChip(id);
    } catch(err) {}
  }
}

// ============ NEW LEAVE REPORT & QUOTA FUNCTIONS ============

function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  }
  return sheet;
}

function getLeaveReport(params) {
  const startDateStr = params.start_date || ''; // YYYY-MM-DD
  const endDateStr = params.end_date || '';     // YYYY-MM-DD

  const users = sheetToObjects(getSheet(SHEET.USERS)).filter(u => u.role === 'Employee' && u.status === 'Active');
  const leaves = sheetToObjects(getSheet(SHEET.LEAVE)).filter(l => l.status === 'Approved');

  // Load or create the quota sheet
  const quotaSheet = getOrCreateSheet(SHEET.QUOTAS, ['user_id', 'name', 'allowed_leave_quota']);
  const quotas = sheetToObjects(quotaSheet);

  const report = users.map(user => {
    // Find customized quota or default to 12
    let qRecord = quotas.find(q => String(q.user_id) === String(user.user_id));
    let allowedQuota = 12; // default
    if (qRecord) {
      allowedQuota = Number(qRecord.allowed_leave_quota);
    } else {
      // Add a new row to tbl_leave_quota for this employee
      quotaSheet.appendRow([user.user_id, user.name, 12]);
      allowedQuota = 12;
    }

    // Filter leaves for this employee
    const userLeaves = leaves.filter(l => String(l.user_id) === String(user.user_id));

    // Calculate total Cuti APPROVED overall
    const overallApprovedCuti = userLeaves
      .filter(l => l.type === 'Cuti')
      .reduce((sum, l) => {
        const start = new Date(l.start_date);
        const end = new Date(l.end_date);
        const days = Math.round((end - start) / (24 * 3600 * 1000)) + 1;
        return sum + (isNaN(days) ? 0 : days);
      }, 0);

    const remainingQuota = allowedQuota - overallApprovedCuti;

    // Filter leaves strictly within the dynamic period if provided
    let periodLeaves = userLeaves;
    if (startDateStr && endDateStr) {
      const sLimit = new Date(startDateStr);
      const eLimit = new Date(endDateStr);
      periodLeaves = userLeaves.filter(l => {
        const sDate = new Date(l.start_date);
        const eDate = new Date(l.end_date);
        return sDate <= eLimit && eDate >= sLimit;
      });
    }

    // Calculate counts in the dynamic period
    const countType = (type) => {
      return periodLeaves
        .filter(l => l.type === type)
        .reduce((sum, l) => {
          const start = new Date(l.start_date);
          const end = new Date(l.end_date);
          let days = Math.round((end - start) / (24 * 3600 * 1000)) + 1;
          if (isNaN(days)) days = 0;
          return sum + days;
        }, 0);
    };

    return {
      user_id: user.user_id,
      name: user.name,
      position: user.position || 'Employee',
      profile_pic_url: user.profile_pic_url || '',
      allowed_leave_quota: allowedQuota,
      remaining_leave_quota: remainingQuota >= 0 ? remainingQuota : 0,
      sick_count: countType('Sakit'),
      permit_count: countType('Izin'),
      cuti_count: countType('Cuti')
    };
  });

  return { success: true, report: report };
}

function updateLeaveQuota(body) {
  const { user_id, name, allowed_leave_quota } = body;
  if (!user_id || allowed_leave_quota === undefined) {
    return { success: false, message: 'Data tidak lengkap' };
  }

  const quotaSheet = getOrCreateSheet(SHEET.QUOTAS, ['user_id', 'name', 'allowed_leave_quota']);
  const data = quotaSheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const idIdx = headers.indexOf('user_id');
  const quotaIdx = headers.indexOf('allowed_leave_quota');

  let found = false;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === String(user_id)) {
      quotaSheet.getRange(i + 1, quotaIdx + 1).setValue(Number(allowed_leave_quota));
      found = true;
      break;
    }
  }

  if (!found) {
    quotaSheet.appendRow([user_id, name || 'Karyawan', Number(allowed_leave_quota)]);
  }

  return { success: true, message: 'Jatah cuti berhasil diperbarui' };
}

function getPositions() {
  try {
    ensureUsersDivisionMigration();
    let sheet = getSheet('tbl_position');
    if (!sheet) {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      sheet = ss.insertSheet('tbl_position');
      sheet.appendRow(['position', 'division']);
      const defaults = [
        ['Head Manager', 'Management'],
        ['HR Staff', 'Human Capital'],
        ['Developer', 'Technology'],
        ['Social Media Specialist', 'Marketing'],
        ['Sales Representative', 'Sales']
      ];
      defaults.forEach(p => sheet.appendRow(p));
    }
    
    const lastCol = sheet.getLastColumn();
    if (lastCol < 2) {
      sheet.getRange(1, 2).setValue('division');
    }
    
    const data = sheet.getDataRange().getValues();
    const positions = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        positions.push({
          position: data[i][0],
          division: data[i][1] || 'Umum'
        });
      }
    }
    return { success: true, positions };
  } catch(e) {
    return { 
      success: true, 
      positions: [
        { position: 'Head Manager', division: 'Management' },
        { position: 'HR Staff', division: 'Human Capital' },
        { position: 'Developer', division: 'Technology' },
        { position: 'Social Media Specialist', division: 'Marketing' },
        { position: 'Sales Representative', division: 'Sales' }
      ] 
    };
  }
}

function addPosition(body) {
  const { position, division } = body;
  if (!position || !division) return { success: false, message: 'Posisi dan Divisi wajib diisi' };
  try {
    const sheet = getSheet('tbl_position');
    const lastCol = sheet.getLastColumn();
    if (lastCol < 2) {
      sheet.getRange(1, 2).setValue('division');
    }
    
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === position.toLowerCase()) {
        sheet.getRange(i + 1, 2).setValue(division);
        return { success: true, message: 'Jabatan berhasil diperbarui' };
      }
    }
    sheet.appendRow([position, division]);
    return { success: true, message: 'Jabatan berhasil ditambahkan' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function deletePosition(body) {
  const { position } = body;
  if (!position) return { success: false, message: 'Nama posisi wajib ditentukan' };
  try {
    const sheet = getSheet('tbl_position');
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === position.toLowerCase()) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Jabatan berhasil dihapus' };
      }
    }
    return { success: false, message: 'Jabatan tidak ditemukan' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function ensureUsersDivisionMigration() {
  try {
    const sheet = getSheet(SHEET.USERS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim());
    let divIdx = headers.indexOf('division');
    
    if (divIdx === -1) {
      sheet.getRange(1, headers.length + 1).setValue('division');
      divIdx = headers.length;
      
      const posMap = {};
      try {
        const posSheet = getSheet('tbl_position');
        if (posSheet) {
          const posData = posSheet.getDataRange().getValues();
          for (let i = 1; i < posData.length; i++) {
            if (posData[i][0]) {
              posMap[posData[i][0]] = posData[i][1] || 'Umum';
            }
          }
        }
      } catch(pe) {}
      
      const posIdx = headers.indexOf('position');
      if (posIdx !== -1) {
        for (let i = 1; i < data.length; i++) {
          const userPos = data[i][posIdx];
          const userDiv = posMap[userPos] || 'Umum';
          sheet.getRange(i + 1, divIdx + 1).setValue(userDiv);
        }
      }
    }
  } catch (e) {
    Logger.log('Migration failed: ' + e.message);
  }
}

function registerEmployee(body) {
  const { name, email, password_pin, position, profile_pic_base64 } = body;
  if (!name || !email || !password_pin || !position) {
    return { success: false, message: 'Semua kolom wajib diisi' };
  }

  // Cek duplikat email
  const users = sheetToObjects(getSheet(SHEET.USERS));
  if (users.find(u => String(u.email).toLowerCase() === String(email).toLowerCase())) {
    return { success: false, message: 'Email sudah terdaftar' };
  }

  const sheet = getSheet(SHEET.USERS);
  const newId = getNextUserId();

  let profilePicUrl = '';
  if (profile_pic_base64) {
    const photoData = uploadBase64ToDrive(profile_pic_base64, `profile_${newId}_${Date.now()}.jpg`, 'foto_profil');
    if (photoData.url && !photoData.url.startsWith('ERROR')) {
      profilePicUrl = photoData.url;
    }
  }

  // Cari divisi dari jabatan
  let division = 'Umum';
  try {
    const posSheet = getSheet('tbl_position');
    if (posSheet) {
      const posData = posSheet.getDataRange().getValues();
      for (let i = 1; i < posData.length; i++) {
        if (posData[i][0] === position) {
          division = posData[i][1] || 'Umum';
          break;
        }
      }
    }
  } catch (e) {}

  ensureUsersDivisionMigration();
  sheet.appendRow([newId, name, email, password_pin, 'Employee', position, profilePicUrl, 'Pending', division]);
  
  try {
    const quotaSheet = getSheet(SHEET.QUOTAS);
    if (quotaSheet) {
      quotaSheet.appendRow([newId, name, 12, 12]);
    }
  } catch (err) {
    Logger.log('Error initializing quota: ' + err.message);
  }

  return { success: true, message: 'Pendaftaran berhasil. Menunggu persetujuan HR.' };
}

function getDivisions() {
  try {
    let sheet = getSheet('tbl_division');
    if (!sheet) {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      sheet = ss.insertSheet('tbl_division');
      sheet.appendRow(['division']);
      const defaults = ['Management', 'Human Capital', 'Technology', 'Marketing', 'Sales', 'Umum'];
      defaults.forEach(d => sheet.appendRow([d]));
    }
    const data = sheet.getDataRange().getValues();
    const divisions = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        divisions.push(data[i][0]);
      }
    }
    return { success: true, divisions };
  } catch (e) {
    return { success: true, divisions: ['Management', 'Human Capital', 'Technology', 'Marketing', 'Sales', 'Umum'] };
  }
}

function addDivision(body) {
  const { division } = body;
  if (!division) return { success: false, message: 'Nama divisi wajib diisi' };
  try {
    let sheet = getSheet('tbl_division');
    if (!sheet) {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      sheet = ss.insertSheet('tbl_division');
      sheet.appendRow(['division']);
    }
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === division.toLowerCase()) {
        return { success: false, message: 'Divisi sudah terdaftar' };
      }
    }
    sheet.appendRow([division]);
    return { success: true, message: 'Divisi berhasil ditambahkan' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function deleteDivision(body) {
  const { division } = body;
  if (!division) return { success: false, message: 'Nama divisi wajib ditentukan' };
  try {
    const sheet = getSheet('tbl_division');
    if (!sheet) return { success: false, message: 'Sheet divisi tidak ditemukan' };
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === division.toLowerCase()) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Divisi berhasil dihapus' };
      }
    }
    return { success: false, message: 'Divisi tidak ditemukan' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ============ TASK MANAGEMENT & PRODUCTIVITY SYSTEM ============

function getTasksSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('tbl_tasks');
  const requiredHeaders = [
    'task_id', 'user_id', 'date', 'task_name', 'category', 
    'target_goals', 'start_time', 'end_time', 'output', 
    'status', 'attachment_url', 'notes', 'others', 'score'
  ];
  if (!sheet) {
    sheet = ss.insertSheet('tbl_tasks');
    sheet.appendRow(requiredHeaders);
  } else {
    // Robust auto-migration: append missing columns if any
    const data = sheet.getDataRange().getValues();
    const currentHeaders = data[0].map(h => String(h).trim());
    requiredHeaders.forEach(header => {
      if (!currentHeaders.includes(header)) {
        const lastCol = sheet.getLastColumn();
        sheet.getRange(1, lastCol + 1).setValue(header);
      }
    });
  }
  return sheet;
}

function getTasks(params) {
  const { user_id, date, start_date, end_date } = params;
  const sheet = getTasksSheet();
  const tasks = sheetToObjects(sheet);
  const users = sheetToObjects(getSheet(SHEET.USERS));

  let records = tasks.map(t => {
    const user = users.find(u => u.user_id === t.user_id);
    return {
      ...t,
      name: user ? user.name : 'Unknown',
      position: user ? user.position : '',
      profile_pic_url: user ? (user.profile_pic_url || '') : '',
      date: formatDate(t.date)
    };
  });

  if (user_id) {
    records = records.filter(r => String(r.user_id).trim() === String(user_id).trim());
  }
  if (date) {
    records = records.filter(r => formatDate(r.date) === date);
  }
  if (start_date) {
    records = records.filter(r => formatDate(r.date) >= start_date);
  }
  if (end_date) {
    records = records.filter(r => formatDate(r.date) <= end_date);
  }

  return { success: true, tasks: records.reverse() };
}

function createTask(body) {
  const { 
    user_id, 
    date, 
    task_name, 
    category, 
    target_goals, 
    start_time, 
    end_time, 
    output, 
    status, 
    notes, 
    others, 
    attachment_base64, 
    attachment_filename 
  } = body;
  
  if (!user_id || !task_name || !target_goals || !start_time || !end_time || !output) {
    return { success: false, message: 'ID Karyawan, Nama Tugas, Target, Waktu Mulai, Waktu Selesai, dan Output wajib diisi' };
  }

  let attachmentUrl = '';
  if (attachment_base64) {
    const filename = attachment_filename || `task_${user_id}_${new Date().getTime()}.jpg`;
    const uploadRes = uploadBase64ToDrive(attachment_base64, filename, 'task_attachments');
    if (uploadRes.id) {
      attachmentUrl = uploadRes.url;
    }
  }

  const sheet = getTasksSheet();
  const newId = generateId('TSK');
  const taskDate = date || getTodayString();
  const taskStatus = status || 'Pending';
  const finalCategory = category || 'Other';
  const score = body.score || '';

  sheet.appendRow([
    newId,
    user_id,
    taskDate,
    task_name,
    finalCategory,
    target_goals,
    start_time,
    end_time,
    output,
    taskStatus,
    attachmentUrl,
    notes || '',
    others || '',
    score
  ]);

  return { success: true, task_id: newId, message: 'Tugas berhasil dibuat!' };
}

function updateTask(body) {
  const { 
    task_id, 
    task_name, 
    category, 
    target_goals,
    start_time,
    end_time,
    output,
    date, 
    notes, 
    status, 
    others,
    score, 
    attachment_base64, 
    attachment_filename 
  } = body;
  if (!task_id) return { success: false, message: 'Task ID wajib dilampirkan' };

  const sheet = getTasksSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  
  const idIdx = headers.indexOf('task_id');
  const nameIdx = headers.indexOf('task_name');
  const categoryIdx = headers.indexOf('category');
  const dateIdx = headers.indexOf('date');
  const notesIdx = headers.indexOf('notes');
  const statusIdx = headers.indexOf('status');
  const scoreIdx = headers.indexOf('score');
  const attIdx = headers.indexOf('attachment_url');
  
  const targetGoalsIdx = headers.indexOf('target_goals');
  const startTimeIdx = headers.indexOf('start_time');
  const endTimeIdx = headers.indexOf('end_time');
  const outputIdx = headers.indexOf('output');
  const othersIdx = headers.indexOf('others');
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]).trim() === String(task_id).trim()) {
      const rowNum = i + 1;
      
      if (task_name !== undefined) sheet.getRange(rowNum, nameIdx + 1).setValue(task_name);
      if (category !== undefined) sheet.getRange(rowNum, categoryIdx + 1).setValue(category);
      if (date !== undefined) sheet.getRange(rowNum, dateIdx + 1).setValue(date);
      if (notes !== undefined) sheet.getRange(rowNum, notesIdx + 1).setValue(notes);
      if (status !== undefined) sheet.getRange(rowNum, statusIdx + 1).setValue(status);
      if (score !== undefined) sheet.getRange(rowNum, scoreIdx + 1).setValue(score);
      
      if (target_goals !== undefined && targetGoalsIdx !== -1) sheet.getRange(rowNum, targetGoalsIdx + 1).setValue(target_goals);
      if (start_time !== undefined && startTimeIdx !== -1) sheet.getRange(rowNum, startTimeIdx + 1).setValue(start_time);
      if (end_time !== undefined && endTimeIdx !== -1) sheet.getRange(rowNum, endTimeIdx + 1).setValue(end_time);
      if (output !== undefined && outputIdx !== -1) sheet.getRange(rowNum, outputIdx + 1).setValue(output);
      if (others !== undefined && othersIdx !== -1) sheet.getRange(rowNum, othersIdx + 1).setValue(others);
      
      if (attachment_base64) {
        const filename = attachment_filename || `task_${task_id}_${new Date().getTime()}.jpg`;
        const uploadRes = uploadBase64ToDrive(attachment_base64, filename, 'task_attachments');
        if (uploadRes.id) {
          sheet.getRange(rowNum, attIdx + 1).setValue(uploadRes.url);
        }
      }
      
      return { success: true, message: 'Tugas berhasil diperbarui!' };
    }
  }
  return { success: false, message: 'Tugas tidak ditemukan' };
}

function deleteTask(body) {
  const { task_id } = body;
  if (!task_id) return { success: false, message: 'Task ID wajib dilampirkan' };

  const sheet = getTasksSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const idIdx = headers.indexOf('task_id');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]).trim() === String(task_id).trim()) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Tugas berhasil dihapus!' };
    }
  }
  return { success: false, message: 'Tugas tidak ditemukan' };
}
