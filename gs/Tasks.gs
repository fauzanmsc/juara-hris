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
      profile_pic_url: user ? formatImageUrl(user.profile_pic_url || '') : '',
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
