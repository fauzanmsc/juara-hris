// ============ LEVEL JABATAN ============

function getLevels() {
  try {
    const data = sheetToObjects(getSheet(SHEET.LEVEL_JABATAN));
    return { success: true, data: data };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function addLevel(body) {
  try {
    const sheet = getSheet(SHEET.LEVEL_JABATAN);
    const id = generateId('LVL');
    const createdAt = getTodayString();
    
    // schema: level_id, level_name, nominal, created_at
    sheet.appendRow([
      id,
      body.level_name || '',
      body.nominal || 0,
      createdAt
    ]);
    
    return { success: true, message: 'Level jabatan berhasil ditambahkan', level_id: id };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function updateLevel(body) {
  try {
    const sheet = getSheet(SHEET.LEVEL_JABATAN);
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return { success: false, message: 'Data kosong' };
    
    const headers = data[0].map(h => String(h).trim());
    const idIdx = headers.indexOf('level_id');
    const nameIdx = headers.indexOf('level_name');
    const nomIdx = headers.indexOf('nominal');
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx]) === String(body.level_id)) {
        const row = i + 1;
        if (body.level_name !== undefined) sheet.getRange(row, nameIdx + 1).setValue(body.level_name);
        if (body.nominal !== undefined) sheet.getRange(row, nomIdx + 1).setValue(body.nominal);
        return { success: true, message: 'Data level jabatan diperbarui' };
      }
    }
    return { success: false, message: 'Level jabatan tidak ditemukan' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function deleteLevel(body) {
  try {
    const sheet = getSheet(SHEET.LEVEL_JABATAN);
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return { success: false, message: 'Data kosong' };
    
    const headers = data[0].map(h => String(h).trim());
    const idIdx = headers.indexOf('level_id');
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx]) === String(body.level_id)) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Level jabatan dihapus' };
      }
    }
    return { success: false, message: 'Level jabatan tidak ditemukan' };
  } catch (err) {
    return { success: false, message: err.message };
  }
}
