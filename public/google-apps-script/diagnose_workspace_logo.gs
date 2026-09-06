/**
 * diagnose_workspace_logo.gs
 * ---------------------------------------------------------------
 * Tempel file ini ke proyek Apps Script ARMS Anda, lalu jalankan
 * fungsi `diagnoseWorkspaceLogo()` dari menu Run.
 *
 * Hasilnya akan muncul di Execution Log (View > Logs) dan
 * menunjukkan:
 *   - apakah ada file Workspace.gs / Crm.gs lama di proyek,
 *   - apakah ada panggilan `loadWorkspaceLogo_` di file HTML mana pun,
 *   - apakah file Code.gs sudah berisi `loadWorkspaceBranding_`.
 *
 * Setelah diagnosis, hapus file ini dari proyek.
 */
function diagnoseWorkspaceLogo() {
  var files = [];
  try {
    var iterator = DriveApp.getFolderById(
      PropertiesService.getScriptProperties().getProperty('ARMS_SCRIPT_FOLDER_ID') || ''
    ).getFiles();
    while (iterator.hasNext()) files.push(iterator.next().getName());
  } catch (error) { console.warn('Tidak dapat membaca folder script: ' + error.message); }

  var htmlFiles = ['Index', 'js_main', 'js_customer', 'js_crm', 'js_operations',
                   'js_letters', 'js_workspace', 'js_proposal', 'js_bulk', 'css_main'];
  var found = { oldBackend: [], oldCaller: [], missing: [], branding: false };
  htmlFiles.forEach(function (name) {
    try {
      var content = HtmlService.createHtmlOutputFromFile(name).getContent();
      if (/loadWorkspaceLogo_?/.test(content)) found.oldCaller.push(name);
    } catch (error) {
      if (/not found|not exist/i.test(error.message)) found.missing.push(name);
    }
  });
  try {
    var backend = HtmlService.createHtmlOutputFromFile('Code').getContent();
    if (/loadWorkspaceBranding_/.test(backend)) found.branding = true;
    if (/loadWorkspaceLogo_?/.test(backend)) found.oldBackend.push('Code');
  } catch (error) { found.missing.push('Code'); }
  if (files.length) {
    files.forEach(function (name) {
      if (/^(Workspace|Crm)\.gs$/i.test(name)) found.oldBackend.push(name);
    });
  }
  console.log('--- DIAGNOSIS WORKSPACE LOGO ---');
  console.log('Files in script folder: ' + (files.length ? files.join(', ') : '(tidak terbaca)'));
  console.log('HTML files calling loadWorkspaceLogo_: ' + (found.oldCaller.length ? found.oldCaller.join(', ') : 'tidak ada'));
  console.log('Backend files defining/containing loadWorkspaceLogo_: ' + (found.oldBackend.length ? found.oldBackend.join(', ') : 'tidak ada'));
  console.log('loadWorkspaceBranding_ present in Code.gs: ' + (found.branding ? 'YA' : 'TIDAK'));
  console.log('HTML files missing from project: ' + (found.missing.length ? found.missing.join(', ') : 'tidak ada'));
  console.log('--- SARAN ---');
  if (found.oldCaller.length || found.oldBackend.length) {
    console.log('Hapus file lama yang tercantum di atas, lalu replace dengan versi dari public/google-apps-script/ di repo.');
  } else if (!found.branding) {
    console.log('Code.gs Anda tidak berisi loadWorkspaceBranding_. Salin ulang Code.gs dari repo.');
  } else if (found.missing.length) {
    console.log('Buat file HTML yang hilang dengan isi persis dari repo.');
  } else {
    console.log('Deployment tampak bersih. Coba clear cache (Ctrl+Shift+R) dan Deploy versi baru.');
  }
}
