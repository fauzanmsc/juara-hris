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
      profile_pic_url: formatImageUrl(user.profile_pic_url || ''),
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
    const sundayEnabled = getConfigVal('sunday_attendance_enabled', 'false') === 'true';
    if (!sundayEnabled) {
      return { success: false, lock_type: 'holiday', message: 'Libur Operasional (Hari Kerja: Senin - Sabtu)' };
    }
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
      max_radius_meters: getConfigVal('max_radius_meters', '200'),
      radius_enabled: getConfigVal('radius_enabled', 'true')
    }
  };
}


