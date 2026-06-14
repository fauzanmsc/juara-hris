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


