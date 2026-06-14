// ============ ENTRY POINTS ============

function doGet(e) {
  const action = e.parameter.action || '';
  try {
    let result;
    switch(action) {
      case 'preflight':      result = preflightCheck(e.parameter); break;
      case 'employeeDashboard': result = getEmployeeDashboard(e.parameter); break;
      case 'adminDashboard': result = getAdminDashboard(e.parameter); break;
      case 'getUsers':       result = getUsers(); break;
      case 'getPendingLeaves': result = getPendingLeaves(); break;
      case 'getAttendance':  result = getAttendanceLog(e.parameter); break;
      case 'leaveHistory':   result = getLeaveHistory(e.parameter.user_id); break;
      case 'getLeaveReport':  result = getLeaveReport(e.parameter); break;
      case 'getPositions':   result = getPositions(); break;
      case 'getDivisions':   result = getDivisions(); break;
      case 'getConfig':
        result = {
          success: true,
          config: getAllConfig(),
          holidays: getHolidays().holidays
        };
        break;
      case 'getHolidays':    result = getHolidays(); break;
      case 'getTasks':       result = getTasks(e.parameter); break;
      case 'getAttendanceTrend': result = getAttendanceTrend(e.parameter); break;
      default:               result = { success: false, message: 'Action tidak dikenali' };
    }
    return jsonResponse(result);
  } catch(err) {
    return jsonResponse({ success: false, message: err.message });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action || '';
    let result;
    switch(action) {
      case 'login':          result = login(body); break;
      case 'clockIn':        result = clockIn(body); break;
      case 'clockOut':       result = clockOut(body); break;
      case 'submitLeave':    result = submitLeave(body); break;
      case 'decideLeave':    result = decideLeave(body); break;
      case 'editLeave':      result = editLeave(body); break;
      case 'deleteLeave':    result = deleteLeaveRequest(body); break;
      case 'addUser':        result = addUser(body); break;
      case 'updateUser':     result = updateUser(body); break;
      case 'updateUserStatus': result = updateUserStatus(body); break;
      case 'saveConfig':     result = saveConfig(body); break;
      case 'addHoliday':     result = addHoliday(body); break;
      case 'deleteHoliday':  result = deleteHoliday(body); break;
      case 'updateLeaveQuota': result = updateLeaveQuota(body); break;
      case 'registerEmployee': result = registerEmployee(body); break;
      case 'addPosition':    result = addPosition(body); break;
      case 'deletePosition': result = deletePosition(body); break;
      case 'addDivision':    result = addDivision(body); break;
      case 'deleteDivision': result = deleteDivision(body); break;
      case 'createTask':     result = createTask(body); break;
      case 'updateTask':     result = updateTask(body); break;
      case 'deleteTask':     result = deleteTask(body); break;
      default:               result = { success: false, message: 'Action tidak dikenali' };
    }
    return jsonResponse(result);
  } catch(err) {
    return jsonResponse({ success: false, message: err.message });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}


