function getNotifications(params) {
  const { user_id, role } = params;
  const attendance = sheetToObjects(getSheet(SHEET.ATTENDANCE));
  const leaves = sheetToObjects(getSheet(SHEET.LEAVE));
  const users = sheetToObjects(getSheet(SHEET.USERS));

  let notifications = [];

  if (role === 'Admin' || role === 'Super Admin') {
    // 1. Leave Requests (Pending)
    const pendingLeaves = leaves.filter(l => l.status === 'Pending');
    pendingLeaves.forEach(l => {
      const user = users.find(u => String(u.user_id) === String(l.user_id));
      notifications.push({
        id: `leave_${l.leave_id}`,
        type: 'Pengajuan',
        title: `Pengajuan ${l.leave_type} Baru`,
        body: `${user ? user.name : 'Seseorang'} mengajukan ${l.leave_type} dari ${formatDate(l.start_date)} s/d ${formatDate(l.end_date)}. Menunggu persetujuan Anda.`,
        time: new Date(l.timestamp || new Date()).getTime(),
        timeStr: l.timestamp ? new Date(l.timestamp).toLocaleString('id-ID') : 'Baru saja',
        is_read: false,
        icon: 'bi-calendar-plus-fill',
        color: '#f59e0b'
      });
    });

    // 2. Today's Attendance
    const today = getTodayString();
    const todayAtt = attendance.filter(a => formatDate(a.date) === today);
    todayAtt.forEach(a => {
      const user = users.find(u => String(u.user_id) === String(a.user_id));
      if (a.clock_in_time) {
        notifications.push({
          id: `in_${a.user_id}_${a.date}`,
          type: 'Kehadiran',
          title: 'Absen Masuk',
          body: `${user ? user.name : 'Seseorang'} telah melakukan Clock In pada ${formatTimeVal(a.clock_in_time)} dengan status: ${a.status_in}.`,
          time: new Date(`${formatDate(a.date)}T${formatTimeVal(a.clock_in_time)}`).getTime(),
          timeStr: `${formatTimeVal(a.clock_in_time)}`,
          is_read: false,
          icon: 'bi-box-arrow-in-right',
          color: '#22c55e'
        });
      }
      if (a.clock_out_time) {
        notifications.push({
          id: `out_${a.user_id}_${a.date}`,
          type: 'Kehadiran',
          title: 'Absen Pulang',
          body: `${user ? user.name : 'Seseorang'} telah melakukan Clock Out pada ${formatTimeVal(a.clock_out_time)}.`,
          time: new Date(`${formatDate(a.date)}T${formatTimeVal(a.clock_out_time)}`).getTime(),
          timeStr: `${formatTimeVal(a.clock_out_time)}`,
          is_read: false,
          icon: 'bi-box-arrow-right',
          color: '#ef4444'
        });
      }
    });

    // Sort descending
    notifications.sort((a, b) => b.time - a.time);
    
    // Take top 30
    notifications = notifications.slice(0, 30);
  } else {
    // Employee logic (Responses to leaves, etc)
    const myLeaves = leaves.filter(l => String(l.user_id) === String(user_id));
    myLeaves.forEach(l => {
      if (l.status === 'Approved' || l.status === 'Rejected') {
        notifications.push({
          id: `leave_${l.leave_id}`,
          type: 'Pengajuan',
          title: `Pengajuan ${l.leave_type} ${l.status === 'Approved' ? 'Disetujui' : 'Ditolak'}`,
          body: `Pengajuan ${l.leave_type} Anda tanggal ${formatDate(l.start_date)} telah ${l.status === 'Approved' ? 'disetujui' : 'ditolak'}.`,
          time: new Date(l.timestamp || new Date()).getTime(),
          timeStr: l.timestamp ? new Date(l.timestamp).toLocaleString('id-ID') : 'Baru saja',
          is_read: false,
          icon: l.status === 'Approved' ? 'bi-check-circle-fill' : 'bi-x-circle-fill',
          color: l.status === 'Approved' ? '#22c55e' : '#ef4444'
        });
      }
    });
    notifications.sort((a, b) => b.time - a.time);
    notifications = notifications.slice(0, 20);
  }

  return { success: true, notifications };
}
