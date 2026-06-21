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
    ],

    tbl_lebel_jabatan: [
      'level_id',
      'level_name',
      'nominal',
      'created_at'
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
  } else if (val.includes('lh3.googleusercontent.com/d/')) {
    try {
      const id = val.split('lh3.googleusercontent.com/d/')[1].split('/')[0].split('?')[0];
      range.insertFileChip(id);
    } catch(err) {}
  }
}

