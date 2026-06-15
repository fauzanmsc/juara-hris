// ============ CLOCK IN ============

function clockIn(body) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return { success: false, message: 'Sistem sedang memproses absensi Anda. Silakan tunggu.' };
  }
  
  try {
    const { user_id, lat, lng, photo_base64, client_time } = body;
    const today = getTodayString();
    const now = new Date();
    const timeStr = client_time || Utilities.formatDate(now, 'GMT+7', 'HH:mm:ss');
    const dayName = Utilities.formatDate(now, 'GMT+7', 'EEEE'); // 'Monday', 'Tuesday', ...
    const isSaturday = (dayName === 'Saturday');

    const locationCheck = validateAttendanceLocation(lat, lng);
    if (!locationCheck.valid) return { success: false, message: locationCheck.message };
    const distanceMeters = Math.round(locationCheck.distance);

    // Cek sudah clock in hari ini
    const attendance = sheetToObjects(getSheet(SHEET.ATTENDANCE));
    const todayAtt = attendance.find(a => String(a.user_id).trim() === String(user_id).trim() && formatDate(a.date) === today);
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
  } finally {
    lock.releaseLock();
  }
}


// ============ CLOCK OUT ============

function clockOut(body) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return { success: false, message: 'Sistem sedang memproses absensi Anda. Silakan tunggu.' };
  }

  try {
    const { user_id, lat, lng, photo_base64, client_time } = body;
    const today = getTodayString();
    const now = new Date();
    const timeStr = client_time || Utilities.formatDate(now, 'GMT+7', 'HH:mm:ss');
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
  } finally {
    lock.releaseLock();
  }
}


// ============ ATTENDANCE LOG ============

function getAttendanceLog(params) {
  params = params || {};
  const start_date = params.start_date || '';
  const end_date = params.end_date || '';
  const name = params.name || '';
  const status = params.status || '';
  const user_id = params.user_id || '';

  const attendance = sheetToObjects(getSheet(SHEET.ATTENDANCE));
  const users = sheetToObjects(getSheet(SHEET.USERS));
  const config = getAllConfig();

  const userMap = {};
  users.forEach(u => {
    userMap[String(u.user_id).trim()] = u;
  });

  function normalizeConfigValue(value, defaultVal) {
    if (value === '' || value === null || value === undefined) return defaultVal;
    if (Object.prototype.toString.call(value) === '[object Date]') {
      return Utilities.formatDate(value, 'GMT+7', 'HH:mm');
    }
    return String(value).trim() || defaultVal;
  }

  function timeToMinutes(value) {
    const match = String(value || '').match(/^(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return (parseInt(match[1], 10) * 60) + parseInt(match[2], 10);
  }

  function safeDate(value) {
    if (!value) return '';
    return formatDate(value);
  }

  const weekdayStartMinutes = timeToMinutes(normalizeConfigValue(config.weekday_start, '10:00'));
  const saturdayStartMinutes = timeToMinutes(normalizeConfigValue(config.saturday_start, '09:00'));
  const weekdayEndMinutes = timeToMinutes(normalizeConfigValue(config.weekday_end, '19:00'));
  const saturdayEndMinutes = timeToMinutes(normalizeConfigValue(config.saturday_end, '17:00'));
  const toleranceMinutes = parseInt(normalizeConfigValue(config.tolerance_minutes, '15'), 10) || 0;
  const weekdayDeadline = (weekdayStartMinutes !== null ? weekdayStartMinutes : 600) + toleranceMinutes;
  const saturdayDeadline = (saturdayStartMinutes !== null ? saturdayStartMinutes : 540) + toleranceMinutes;
  const weekdayEnd = weekdayEndMinutes !== null ? weekdayEndMinutes : 1140;
  const saturdayEnd = saturdayEndMinutes !== null ? saturdayEndMinutes : 1020;

  function isSaturday(dateStr) {
    return new Date(dateStr + 'T00:00:00').getDay() === 6;
  }

  function normalizeStatusIn(rawStatus, dateStr, clockInStr) {
    if (!clockInStr) return rawStatus || '';
    const clockMinutes = timeToMinutes(clockInStr);
    if (clockMinutes === null) return rawStatus || '';
    const deadline = isSaturday(dateStr) ? saturdayDeadline : weekdayDeadline;
    return clockMinutes <= deadline ? 'Tepat Waktu' : 'Terlambat';
  }

  function normalizeStatusOut(rawStatus, dateStr, clockOutStr) {
    if (!clockOutStr) return rawStatus || '';
    const clockMinutes = timeToMinutes(clockOutStr);
    if (clockMinutes === null) return rawStatus || '';
    const endMinutes = isSaturday(dateStr) ? saturdayEnd : weekdayEnd;
    return clockMinutes >= endMinutes ? 'Normal' : 'Pulang Cepat';
  }

  const nameQuery = String(name || '').trim().toLowerCase();
  const records = [];

  attendance.forEach(a => {
    const dateStr = safeDate(a.date);
    if (!dateStr) return;
    if (user_id && String(a.user_id).trim() !== String(user_id).trim()) return;
    if (start_date && dateStr < start_date) return;
    if (end_date && dateStr > end_date) return;

    const user = userMap[String(a.user_id).trim()];
    const employeeName = user ? (user.name || 'Unknown') : 'Unknown';
    if (nameQuery && String(employeeName).toLowerCase().indexOf(nameQuery) === -1) return;

    const clockInStr = formatTimeVal(a.clock_in_time);
    const clockOutStr = formatTimeVal(a.clock_out_time);
    const statusIn = normalizeStatusIn(a.status_in, dateStr, clockInStr);
    const statusOut = normalizeStatusOut(a.status_out, dateStr, clockOutStr);
    if (status) {
      const statusArr = String(status).split(',').map(s => s.trim().toLowerCase());
      if (!statusArr.includes(String(statusIn).trim().toLowerCase())) return;
    }

    records.push({
      ...a,
      name: employeeName,
      position: user ? (user.position || '') : '',
      profile_pic: user ? formatImageUrl(user.profile_pic_url || '') : '',
      date: dateStr,
      clock_in_time: clockInStr,
      clock_out_time: clockOutStr,
      status_in: statusIn,
      status_out: statusOut
    });
  });

  records.sort((a, b) => {
    const dateCompare = String(b.date || '').localeCompare(String(a.date || ''));
    if (dateCompare !== 0) return dateCompare;
    return String(b.clock_in_time || '').localeCompare(String(a.clock_in_time || ''));
  });

  // Calculate Analytics for Top 3 with indexed lookups to keep the page fast.
  const activeEmployees = users.filter(u => u.role === 'Employee' && u.status === 'Active');
  const leaves = sheetToObjects(getSheet(SHEET.LEAVE));
  const holidays = sheetToObjects(getSheet(SHEET.HOLIDAYS));
  const uniqueDateMap = {};
  const presentMap = {};
  const lateCountMap = {};

  attendance.forEach(a => {
    const dateStr = safeDate(a.date);
    if (!dateStr) return;
    const uid = String(a.user_id).trim();
    uniqueDateMap[dateStr] = true;
    presentMap[uid + '|' + dateStr] = true;

    const clockInStr = formatTimeVal(a.clock_in_time);
    const statusIn = normalizeStatusIn(a.status_in, dateStr, clockInStr);
    if (statusIn === 'Terlambat') {
      lateCountMap[uid] = (lateCountMap[uid] || 0) + 1;
    }
  });

  const approvedLeavesByUser = {};
  leaves.forEach(l => {
    if (l.status !== 'Approved') return;
    const uid = String(l.user_id).trim();
    if (!approvedLeavesByUser[uid]) approvedLeavesByUser[uid] = [];
    approvedLeavesByUser[uid].push({
      ...l,
      _start: safeDate(l.start_date),
      _end: safeDate(l.end_date || l.start_date)
    });
  });

  const holidayRanges = holidays.map(h => {
    const start = safeDate(h.start_date || h.date);
    const end = safeDate(h.end_date || h.start_date || h.date) || start;
    return { start: start, end: end };
  }).filter(h => h.start && h.end);

  function isHolidayDate(dateStr) {
    return holidayRanges.some(h => dateStr >= h.start && dateStr <= h.end);
  }

  const uniqueDates = Object.keys(uniqueDateMap).sort();
  const employeeAnalytics = activeEmployees.map(emp => {
    const uid = String(emp.user_id).trim();
    const empLeaves = approvedLeavesByUser[uid] || [];

    const sickPermitDays = empLeaves.reduce((sum, l) => {
      if (l.type !== 'Sakit' && l.type !== 'Izin') return sum;
      if (!l._start || !l._end) return sum;
      const start = new Date(l._start + 'T00:00:00');
      const end = new Date(l._end + 'T00:00:00');
      const days = Math.round((end - start) / (24 * 3600 * 1000)) + 1;
      return sum + (isNaN(days) ? 0 : days);
    }, 0);

    let absentDays = 0;
    uniqueDates.forEach(dStr => {
      const dt = new Date(dStr + 'T00:00:00');
      if (dt.getDay() === 0) return;
      if (isHolidayDate(dStr)) return;
      if (presentMap[uid + '|' + dStr]) return;

      const wasOnLeave = empLeaves.some(l =>
        l._start && l._end && l._start <= dStr && l._end >= dStr
      );
      if (wasOnLeave) return;

      absentDays++;
    });

    return {
      user_id: emp.user_id,
      name: emp.name,
      position: emp.position || 'Employee',
      profile_pic_url: formatImageUrl(emp.profile_pic_url || ''),
      sick_permit_days: sickPermitDays,
      absent_days: absentDays,
      late_count: lateCountMap[uid] || 0
    };
  });

  const topAbsent = [...employeeAnalytics]
    .sort((a, b) => b.absent_days - a.absent_days)
    .slice(0, 3)
    .filter(x => x.absent_days > 0);

  const topSickPermit = [...employeeAnalytics]
    .sort((a, b) => b.sick_permit_days - a.sick_permit_days)
    .slice(0, 3)
    .filter(x => x.sick_permit_days > 0);

  const topLate = [...employeeAnalytics]
    .sort((a, b) => b.late_count - a.late_count)
    .slice(0, 3)
    .filter(x => x.late_count > 0);

  return { 
    success: true, 
    records: records,
    analytics: {
      top_absent: topAbsent,
      top_sick_permit: topSickPermit,
      top_late: topLate
    }
  };
}


// ============ ATTENDANCE TREND (Chart Data) ============

function getAttendanceTrend(params) {
  params = params || {};
  const range = params.range || 'monthly'; // weekly | monthly | yearly
  const today = new Date();
  const todayStr = Utilities.formatDate(today, 'GMT+7', 'yyyy-MM-dd');

  const attendance = sheetToObjects(getSheet(SHEET.ATTENDANCE));
  const users = sheetToObjects(getSheet(SHEET.USERS));
  const holidays = sheetToObjects(getSheet(SHEET.HOLIDAYS));

  // Only count Employee role
  const employeeIds = new Set();
  users.forEach(u => {
    if (u.role === 'Employee' && u.status === 'Active') employeeIds.add(String(u.user_id).trim());
  });

  // Build holiday set
  const holidaySet = new Set();
  holidays.forEach(h => {
    const s = h.start_date ? formatDate(h.start_date) : (h.date ? formatDate(h.date) : '');
    const e = h.end_date ? formatDate(h.end_date) : s;
    if (!s) return;
    let cur = new Date(s + 'T00:00:00');
    const end = new Date((e || s) + 'T00:00:00');
    while (cur <= end) {
      holidaySet.add(Utilities.formatDate(cur, 'GMT+7', 'yyyy-MM-dd'));
      cur.setDate(cur.getDate() + 1);
    }
  });

  // Determine date range
  let startDate, endDate;
  if (range === 'weekly') {
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startDate = new Date(monday);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    endDate = friday > today ? today : friday;
  } else if (range === 'monthly') {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    endDate = new Date(today);
  } else {
    startDate = new Date(today.getFullYear(), 0, 1);
    endDate = new Date(today);
  }
  // Build per-date counts — deduplicate: 1 employee = 1 count per day
  // Use status_in directly from database for 100% data consistency
  const dateCounts = {};
  const seenPerDay = {};

  attendance.forEach(a => {
    const uid = String(a.user_id).trim();
    if (!employeeIds.has(uid)) return; // Only count employees
    const dateStr = formatDate(a.date);
    if (!dateStr) return;

    // Deduplicate: only count first record per employee per day
    const dedupKey = uid + '|' + dateStr;
    if (seenPerDay[dedupKey]) return;
    seenPerDay[dedupKey] = true;

    const dt = new Date(dateStr + 'T00:00:00');
    const day = dt.getDay();
    if (day === 0 || day === 6) return; // skip Sat/Sun
    if (holidaySet.has(dateStr)) return; // skip holidays

    const statusIn = String(a.status_in || '').trim();
    if (!dateCounts[dateStr]) dateCounts[dateStr] = { tepat: 0, terlambat: 0 };
    if (statusIn === 'Terlambat') {
      dateCounts[dateStr].terlambat++;
    } else if (statusIn === 'Tepat Waktu') {
      dateCounts[dateStr].tepat++;
    }
  });

  // Build labels and data arrays
  if (range === 'yearly') {
    // Aggregate by month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    const year = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed
    const labels = [];
    const tepatData = [];
    const terlambatData = [];

    for (let m = 0; m <= currentMonth; m++) {
      labels.push(months[m]);
      let tepat = 0, terlambat = 0;
      Object.keys(dateCounts).forEach(dStr => {
        const d = new Date(dStr + 'T00:00:00');
        if (d.getFullYear() === year && d.getMonth() === m) {
          tepat += dateCounts[dStr].tepat;
          terlambat += dateCounts[dStr].terlambat;
        }
      });
      tepatData.push(tepat);
      terlambatData.push(terlambat);
    }

    return { success: true, labels, tepat: tepatData, terlambat: terlambatData };
  } else {
    // Daily labels
    const labels = [];
    const tepatData = [];
    const terlambatData = [];
    let cur = new Date(startDate);

    while (cur <= endDate) {
      const dStr = Utilities.formatDate(cur, 'GMT+7', 'yyyy-MM-dd');
      const day = cur.getDay();
      // Skip weekends
      if (day !== 0 && day !== 6 && !holidaySet.has(dStr)) {
        if (range === 'weekly') {
          const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
          labels.push(dayNames[day]);
        } else {
          labels.push(String(cur.getDate()).padStart(2, '0'));
        }
        const c = dateCounts[dStr] || { tepat: 0, terlambat: 0 };
        tepatData.push(c.tepat);
        terlambatData.push(c.terlambat);
      }
      cur.setDate(cur.getDate() + 1);
    }

    return { success: true, labels, tepat: tepatData, terlambat: terlambatData };
  }
}


