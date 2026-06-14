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
    profile_pic_url: formatImageUrl(u.profile_pic_url),
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


