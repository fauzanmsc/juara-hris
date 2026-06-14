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
    var h = String(val.getHours()).padStart(2, '0');
    var m = String(val.getMinutes()).padStart(2, '0');
    return h + ':' + m;
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

function formatImageUrl(url) {
  if (!url) return '';
  if (url.includes('lh3.googleusercontent.com')) return url;
  
  let id = '';
  const matchId = url.match(/id=([^&]+)/);
  if (matchId) {
    id = matchId[1];
  } else {
    const matchD = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (matchD) id = matchD[1];
  }
  
  if (id) {
    return `https://lh3.googleusercontent.com/d/${id}`;
  }
  return url;
}

