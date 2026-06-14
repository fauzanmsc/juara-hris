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

function editLeave(body) {
  const { request_id, type, start_date, end_date, reason, status, attachment_base64, attachment_name, existing_attachment_url } = body;
  if (!request_id) return { success: false, message: 'request_id tidak ditemukan' };

  const sheet = getSheet(SHEET.LEAVE);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: false, message: 'Sheet pengajuan kosong' };

  const headers = data[0].map(h => String(h).trim());
  const idIdx = headers.indexOf('request_id');
  const typeIdx = headers.indexOf('type');
  const startIdx = headers.indexOf('start_date');
  const endIdx = headers.indexOf('end_date');
  const reasonIdx = headers.indexOf('reason');
  const statusIdx = headers.indexOf('status');
  const attIdx = headers.indexOf('attachment_url');
  const approvedByIdx = headers.indexOf('approved_by');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIdx]) === String(request_id)) {
      const rowNum = i + 1;

      try {
        if (type !== undefined && typeIdx !== -1) sheet.getRange(rowNum, typeIdx + 1).setValue(type);
        if (start_date !== undefined && startIdx !== -1) sheet.getRange(rowNum, startIdx + 1).setValue(start_date);
        if (end_date !== undefined && endIdx !== -1) sheet.getRange(rowNum, endIdx + 1).setValue(end_date);
        if (reason !== undefined && reasonIdx !== -1) sheet.getRange(rowNum, reasonIdx + 1).setValue(reason);
        if (status !== undefined && statusIdx !== -1) sheet.getRange(rowNum, statusIdx + 1).setValue(status);

        // Handle attachments: new upload takes precedence, otherwise preserve existing or clear
        if (attachment_base64) {
          const ext = (attachment_name || 'doc').split('.').pop();
          const fname = `leave_${request_id}_${new Date().getTime()}.${ext}`;
          const uploadRes = uploadBase64ToDrive(attachment_base64, fname, 'dokumen_cuti');
          if (uploadRes && uploadRes.url) {
            if (attIdx !== -1) {
              sheet.getRange(rowNum, attIdx + 1).setValue(uploadRes.url);
              try { sheet.getRange(rowNum, attIdx + 1).insertFileChip(uploadRes.id); } catch(e) {}
            }
          }
        } else if (existing_attachment_url !== undefined) {
          if (attIdx !== -1) sheet.getRange(rowNum, attIdx + 1).setValue(existing_attachment_url || '');
        }

        return { success: true, updated: true, request_id: request_id };
      } catch (err) {
        return { success: false, message: 'Gagal memperbarui pengajuan: ' + err.message };
      }
    }
  }

  return { success: false, message: 'Pengajuan tidak ditemukan' };
}

function getPendingLeaves() {
  const leaves = sheetToObjects(getSheet(SHEET.LEAVE));
  const users = sheetToObjects(getSheet(SHEET.USERS));

  const enriched = leaves.map(l => {
    const user = users.find(u => String(u.user_id).trim() === String(l.user_id).trim());
    return { ...l, user_name: user ? user.name : 'Unknown', profile_pic_url: user ? formatImageUrl(user.profile_pic_url || '') : '', start_date: formatDate(l.start_date), end_date: formatDate(l.end_date) };
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
      profile_pic_url: formatImageUrl(user.profile_pic_url || ''),
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
    const safeName = name ? name.replace(/\s+/g, '') : 'User';
    const photoData = uploadBase64ToDrive(profile_pic_base64, `profile_${safeName}_v${Date.now()}.jpg`, 'foto_profil');
    if (photoData.id) {
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

