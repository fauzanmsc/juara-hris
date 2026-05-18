# Implementation Plan - Task & Productivity System Customization

This plan outlines the changes required to upgrade the JEF HRIS task management system. We will customize the task form, simplify the daily task list UI with date navigation and dynamic filters, support direct file preview in-app, implement popups for CRUD operations, and adjust the Admin Dashboard and Google Sheets backend accordingly.

## User Review Required

> [!IMPORTANT]
> **Data Migration & Backward Compatibility:**
> The `tbl_tasks` Google Sheet structure will be adjusted to include the new columns: `target_goals`, `start_time`, `end_time`, `output`, and `others`.
> Existing columns (`task_id`, `user_id`, `date`, `task_name`, `status`, `attachment_url`, `notes`, `score`, and `category`) will be fully preserved. For older tasks, the new fields will show as blank, ensuring 100% backward compatibility.
>
> We will automatically initialize the new columns in Google Script's `setupSheets` and dynamically handle them in App Script backend APIs.

> [!NOTE]
> **Task Completion Toggle & Mapping:**
> The status toggle switch (Selesai vs Belum) will map to:
> - **Selesai** -> `Completed`
> - **Belum** -> `Pending`
> This maintains consistency with JEF HRIS's existing task logic and score computations.

## Proposed Changes

---

### 1. Backend: Google Apps Script
Modify [code.gs](file:///d:/WEB%20APPS/Juara%20Talenta/juara-talenta/Google%20Script/code.gs) to support the new database schema and CRUD operations.

#### [MODIFY] [code.gs](file:///d:/WEB%20APPS/Juara%20Talenta/juara-talenta/Google%20Script/code.gs)
- Update `getTasksSheet()` to include `target_goals`, `start_time`, `end_time`, `output`, and `others` columns.
- Update `getTasks()` API endpoint to fetch and return the new fields.
- Update `createTask()` to accept and write:
  - `target_goals`
  - `start_time`
  - `end_time`
  - `output`
  - `others`
  - `notes` (representing "catatan / issue")
- Update `updateTask()` to support editing the new fields.

---

### 2. Frontend Layout: Employee Task Page
Modify [tasks.html](file:///d:/WEB%20APPS/Juara%20Talenta/juara-talenta/tasks.html) to implement the customized form, direct attachment preview modal, simplified task list, date navigation, filter switches, and insight cards.

#### [MODIFY] [tasks.html](file:///d:/WEB%20APPS/Juara%20Talenta/juara-talenta/tasks.html)
- **Task Form Adjustment (`#section-form`):**
  - Adjust fields to:
    - **Nama Tugas\*** (`#taskName`) - Text Input (Required)
    - **Target / Goals\*** (`#taskTarget`) - Text Input (Required)
    - **Waktu Mulai Dikerjakan\*** (`#taskStartTime`) - 24h Time Input (Required)
    - **Waktu Selesai Dikerjakan\*** (`#taskEndTime`) - 24h Time Input (Required)
    - **Output Yang Dihasilkan\*** (`#taskOutput`) - Text Area/Input (Required)
    - **Status\*** (`#taskStatusToggle`) - Beautiful iOS-style Toggle Switch (Selesai/Belum)
    - **Catatan / Issue** (`#taskNotes`) - Text Area (Optional)
    - **Lainnya** (`#taskOthers`) - Text Area (Optional)
    - **Lampiran** (`#taskFile`) - File Input (Optional)
- **Task History Adjustment (`#section-history`):**
  - **Stats Insight Card:** Add a modern dashboard-style card at the top displaying completion stats (e.g. `2 / 5 Tugas Selesai Hari Ini` with a beautiful progress ring/bar).
  - **Date Navigation Controls:** Replace the standard date range filter with a compact 1-day navigation system:
    - `[ < ]` Arrow Button (1 day backward)
    - `[ 19 Mei 2026 ]` Large Active Date Display (with dynamic Indonesian day/date formatting)
    - `[ > ]` Arrow Button (1 day forward)
  - **Dynamic Filters:** Add a sleek button group filter (e.g. `Semua` | `Belum Selesai` | `Selesai`) to dynamically slice the list.
- **Direct Preview Modals:**
  - Add `#modalPreview` to render direct file previews (supporting images and PDF/docx iframes) directly in-app.
- **Direct Employee CRUD Modals:**
  - Add `#modalViewTask` for viewing full task details in a popup modal.
  - Add `#modalEditTask` containing the exact task form to allow editing existing tasks in a popup modal.

---

### 3. Frontend Layout: Admin Dashboard
Modify [admin.html](file:///d:/WEB%20APPS/Juara%20Talenta/juara-talenta/admin.html) to support the new task fields and direct attachment preview.

#### [MODIFY] [admin.html](file:///d:/WEB%20APPS/Juara%20Talenta/juara-talenta/admin.html)
- **Admin Task Table (`#taskAdminBody`):**
  - Update table headers to display `Tugas`, `Waktu`, `Target/Goals`, `Output`, `Lampiran`, `Status`, `Score`, and `Aksi`.
- **Admin Edit Task Modal (`#modalTask`):**
  - Adjust modal form elements to allow editing `task_name`, `target_goals`, `start_time`, `end_time`, `output`, `status` (toggle/dropdown), `notes`, and `others`.
- **Direct Preview Integration:**
  - Connect the "Lampiran/File" button to open JEF HRIS's global document modal `#modalDoc` with dynamic media formatting, avoiding external tabs.

---

### 4. Logic & Communication Engine: script.js
Modify [script.js](file:///d:/WEB%20APPS/Juara%20Talenta/juara-talenta/js/script.js) to support frontend processing of the new fields, day shifting navigation, dynamic calculations, and popups.

#### [MODIFY] [script.js](file:///d:/WEB%20APPS/Juara%20Talenta/juara-talenta/js/script.js)
- **Employee Task Logic (`tasks.html` controller):**
  - Implement day-shifting calculations (incrementing/decrementing selected date).
  - Form submit handler to process new parameters (`target_goals`, `start_time`, `end_time`, `output`, `status`, `notes`, `others`).
  - Render employee task list with:
    - Simplified cards displaying **just the task name**, time range, and status badge.
    - Quick actions: **View Detail Modal**, **Edit Detail Modal**, and **Delete Task**.
  - Compute stats (completed / total count) dynamically to update the stats insight card.
- **Admin Task Logic (`admin.html` controller):**
  - Update `loadAdminTasks()` to parse, render, and filter the new columns in the admin table.
  - Adjust `openEditTaskModal()` and `saveAdminTask()` to handle the updated fields.

## Verification Plan

### Automated / Browser Verification
We will run and test the application using the browser subagent:
1. Open the local JEF HRIS dev site.
2. Log in as an employee, create new tasks with time ranges (e.g. `10:00` - `12:00`), status toggle (`Belum`/`Selesai`), target, output, and optional file.
3. Verify that the task shows in the employee history list on the current date, showing the simplified card display.
4. Shift the date using left/right buttons and check date-specific filtering.
5. Click **View Detail** and **Edit Detail** to verify CRUD popups function correctly.
6. Open attachment preview and confirm the in-app modal opens without opening new tabs.
7. Log in as Admin and verify the Admin Task Management panel displays all the new fields correctly and allows admin edits.

### Manual Verification
- Verify that Google Sheet columns in `tbl_tasks` are created and populated properly with the correct schema format.
