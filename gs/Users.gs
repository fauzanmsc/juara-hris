// ============ USERS CRUD ============

function getUsers() {
  ensureUsersDivisionMigration();
  ensurePayrollColumnsMigration();
  const users = sheetToObjects(getSheet(SHEET.USERS));
  const safe = users.map(u => ({
    user_id: u.user_id, 
    name: u.name, 
    email: u.email,
    position: u.position, 
    role: u.role, 
    status: u.status,
    profile_pic_url: formatImageUrl(u.profile_pic_url),
    division: u.division || 'Umum',
    job_level: u.job_level || '',
    group_level: u.group_level || '',
    grade_level: u.grade_level || '',
    base_salary: u.base_salary || '',
    position_allowance: u.position_allowance || '',
    grade_allowance: u.grade_allowance || '',
    group_allowance: u.group_allowance || '',
    bpjs_tk: u.bpjs_tk || '',
    bpjs_kes: u.bpjs_kes || '',
    bank_account: u.bank_account || '',
    bank_number: u.bank_number || ''
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
    const safeName = name ? name.replace(/\s+/g, '') : 'User';
    const photoData = uploadBase64ToDrive(body.profile_pic_base64, `profile_${safeName}_v${Date.now()}.jpg`, 'foto_profil');
    if (photoData.id) {
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
      
      return { success: true, profile_pic_url: formatImageUrl(profilePicUrl) };
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

function ensurePayrollColumnsMigration() {
  try {
    const sheet = getSheet(SHEET.USERS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim());
    const newCols = [
      'job_level', 'group_level', 'grade_level',
      'base_salary', 'position_allowance', 'grade_allowance', 'group_allowance',
      'bpjs_tk', 'bpjs_kes',
      'bank_account', 'bank_number'
    ];
    let added = 0;
    newCols.forEach(col => {
      if (headers.indexOf(col) === -1) {
        sheet.getRange(1, headers.length + 1 + added).setValue(col);
        added++;
      }
    });
  } catch (e) {
    // Abaikan jika error
  }
}

function updateJobDetails(body) {
  const { user_id, job_level, group_level, grade_level } = body;
  const sheet = getSheet(SHEET.USERS);
  ensurePayrollColumnsMigration();
  const headers = sheet.getDataRange().getValues()[0].map(h => String(h).trim());
  
  const idx = {
    user_id: headers.indexOf('user_id'),
    job: headers.indexOf('job_level'),
    group: headers.indexOf('group_level'),
    grade: headers.indexOf('grade_level')
  };

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idx.user_id]) === String(user_id)) {
      sheet.getRange(i+1, idx.job+1).setValue(job_level || '');
      sheet.getRange(i+1, idx.group+1).setValue(group_level || '');
      sheet.getRange(i+1, idx.grade+1).setValue(grade_level || '');
      return { success: true };
    }
  }
  return { success: false, message: 'User tidak ditemukan' };
}

function updateSalaryStructure(body) {
  const { user_id, base_salary, position_allowance, grade_allowance, group_allowance } = body;
  const sheet = getSheet(SHEET.USERS);
  ensurePayrollColumnsMigration();
  const headers = sheet.getDataRange().getValues()[0].map(h => String(h).trim());
  
  const idx = {
    user_id: headers.indexOf('user_id'),
    base: headers.indexOf('base_salary'),
    pos: headers.indexOf('position_allowance'),
    grade: headers.indexOf('grade_allowance'),
    group: headers.indexOf('group_allowance')
  };

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idx.user_id]) === String(user_id)) {
      sheet.getRange(i+1, idx.base+1).setValue(base_salary || '');
      sheet.getRange(i+1, idx.pos+1).setValue(position_allowance || '');
      sheet.getRange(i+1, idx.grade+1).setValue(grade_allowance || '');
      sheet.getRange(i+1, idx.group+1).setValue(group_allowance || '');
      return { success: true };
    }
  }
  return { success: false, message: 'User tidak ditemukan' };
}

function updateDeductions(body) {
  const { user_id, bpjs_tk, bpjs_kes } = body;
  const sheet = getSheet(SHEET.USERS);
  ensurePayrollColumnsMigration();
  const headers = sheet.getDataRange().getValues()[0].map(h => String(h).trim());
  
  const idx = {
    user_id: headers.indexOf('user_id'),
    tk: headers.indexOf('bpjs_tk'),
    kes: headers.indexOf('bpjs_kes')
  };

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idx.user_id]) === String(user_id)) {
      sheet.getRange(i+1, idx.tk+1).setValue(bpjs_tk || '');
      sheet.getRange(i+1, idx.kes+1).setValue(bpjs_kes || '');
      return { success: true };
    }
  }
  return { success: false, message: 'User tidak ditemukan' };
}

function updateBankAccounts(body) {
  const { user_id, bank_account, bank_number } = body;
  const sheet = getSheet(SHEET.USERS);
  ensurePayrollColumnsMigration();
  const headers = sheet.getDataRange().getValues()[0].map(h => String(h).trim());
  
  const idx = {
    user_id: headers.indexOf('user_id'),
    account: headers.indexOf('bank_account'),
    number: headers.indexOf('bank_number')
  };

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idx.user_id]) === String(user_id)) {
      sheet.getRange(i+1, idx.account+1).setValue(bank_account || '');
      sheet.getRange(i+1, idx.number+1).setValue(bank_number || '');
      return { success: true };
    }
  }
  return { success: false, message: 'User tidak ditemukan' };
}
