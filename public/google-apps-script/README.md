# ARMS - Account Receivables Management System

Paket Google Apps Script Web App dengan database Google Sheets, frontend Vanilla JavaScript, Tailwind CSS CDN, dan tampilan dark mode. Paket ini tidak memerlukan Node.js, Vite, atau React di Google Apps Script.

## Isi Paket

| File | Fungsi |
| --- | --- |
| Code.gs | Satu-satunya file backend: doGet, inisialisasi spreadsheet, CRUD, JOIN, autentikasi, validasi CRM, logo/kop surat, dokumen personel (KTP/SPPI), arsip PDF surat, proposal, impor batch, dan audit read-only |
| Index.html | Shell SPA, sidebar, header, dialog, dan modul aplikasi |
| js_main.html | JavaScript modular, Promise google.script.run, formulir, kalkulasi, ekspor, dan surat |
| js_customer.html | Form debitur, pilihan wilayah bertingkat, dan unggahan foto KTP/STNK |
| js_crm.html | Master klien, form kasus baru, log komunikasi, dan alur log-ke-pembayaran |
| js_operations.html | Status proses debitur, eksekusi unit, rekening, dan mutasi fee |
| js_letters.html | Form penugasan, tautan generator, upload dan unduh PDF surat |
| js_workspace.html | Branding (logo + kop surat), dokumen personel KTP/SPPI, form klien dua langkah, dan reminder SK |
| js_proposal.html | Editor proposal per halaman, pratinjau kertas A4, halaman Tim & Mitra DC dengan foto KTP/SPPI, dan cetak |
| js_bulk.html | Template/pembacaan Excel, CSV, pemeriksaan baris, dan impor bulk |
| css_main.html | Dark mode, form bertahap berbatas viewport, responsive, dan loading |
| appsscript.json | Runtime V8, zona waktu Asia/Jakarta, dan OAuth scopes |

`Index.html` menyertakan file modular menggunakan:

    <?!= HtmlService.createHtmlOutputFromFile('css_main').getContent(); ?>
    <?!= HtmlService.createHtmlOutputFromFile('js_customer').getContent(); ?>
    <?!= HtmlService.createHtmlOutputFromFile('js_crm').getContent(); ?>
    <?!= HtmlService.createHtmlOutputFromFile('js_operations').getContent(); ?>
    <?!= HtmlService.createHtmlOutputFromFile('js_letters').getContent(); ?>
    <?!= HtmlService.createHtmlOutputFromFile('js_workspace').getContent(); ?>
    <?!= HtmlService.createHtmlOutputFromFile('js_proposal').getContent(); ?>
    <?!= HtmlService.createHtmlOutputFromFile('js_bulk').getContent(); ?>
    <?!= HtmlService.createHtmlOutputFromFile('js_main').getContent(); ?>

## Deployment

1. Buat Google Spreadsheet baru untuk database agensi. Jangan gunakan spreadsheet publik.
2. Buka **Extensions > Apps Script**. Gunakan proyek yang terikat ke spreadsheet tersebut.
3. Salin seluruh isi `Code.gs` ke proyek. **Cukup satu file Script.** Jika proyek Anda masih memiliki `Crm.gs` dan `Workspace.gs`, hapus keduanya (klik file > Remove). Isinya sudah digabung ke `Code.gs`; file lama yang tertinggal dapat menimpa fungsi versi baru. Error `loadWorkspaceLogo_ is not defined` muncul bila `Workspace.gs` tidak ada, dan tidak akan muncul lagi pada versi ini.
4. Buat file HTML dengan nama tepat `Index`, `js_main`, `js_customer`, `js_crm`, `js_operations`, `js_letters`, `js_workspace`, `js_proposal`, `js_bulk`, dan `css_main`. Salin seluruh isinya, termasuk tag `<style>` atau `<script>`.
5. Di **Project Settings**, aktifkan **Show appsscript.json manifest file in editor**. Salin konfigurasi `appsscript.json` dari paket.
6. Simpan proyek. Pilih `initializeDatabase` dari dropdown fungsi, lalu klik **Run** sebagai pemilik proyek. Izinkan akses Google yang diminta.
7. Periksa hasil fungsi. Pada keberhasilan, dua belas sheet dibuat (termasuk `Proposals`) dan akun pemilik masuk ke sheet `Users` sebagai `Administrator`. Spreadsheet ID tersimpan dalam Script Property `ARMS_SPREADSHEET_ID`.
8. Pilih **Deploy > New deployment > Web app**. Untuk Google Workspace internal, gunakan **Execute as: Me** dan batasi akses ke organisasi Anda. Jangan memilih akses anonim atau publik.
9. Buka URL `/exec` deployment. Identitas Google yang mengakses harus tersedia dan email tersebut harus tercantum di sheet `Users`.
10. Tambahkan pengguna internal melalui **Pengaturan > Pengguna & akses**. Username harus berupa email Google, bukan nama panggilan.
11. Saat kode berubah, buka **Deploy > Manage deployments > Edit > New version > Deploy**. Simpan URL deployment yang sama.

File README ini adalah dokumentasi, bukan file yang perlu ditambahkan ke editor GAS.

## Memperbarui Deployment Lama

1. Cadangkan spreadsheet. Salin `Code.gs` baru, **hapus `Crm.gs` dan `Workspace.gs`**, tambahkan file HTML `js_proposal`, lalu perbarui `Index`, `js_main`, `js_workspace`, dan `css_main`. Hapus file HTML js_repo dan js_generator yang tidak lagi digunakan. Lengkapi file paket versi sebelumnya jika belum tersedia.
2. Struktur spreadsheet diperbarui otomatis saat aplikasi pertama kali dibuka: sheet `Proposals` dibuat dan kolom `Foto SPPI` + `Nama File SPPI` ditambahkan di ujung sheet `Personnel`. Data lama tidak dihapus atau digeser. Menjalankan `initializeDatabase` sekali lagi sebagai pemilik tetap disarankan. Sheet Clients dan CollectionLogs, kolom relasi pada Cases/Payments/Transactions, serta sheet versi sebelumnya ditambahkan tanpa menghapus data lama. Nama klien lama ditautkan ke master baru dengan kode LEGACY, tanpa membuat kontak/alamat fiktif.
3. Izinkan akses Google Drive, kemudian deploy versi baru. Drive menyimpan dokumen KTP/STNK/SPPI, logo, kop surat, dan PDF surat dalam folder terbatas.
4. Saat mengedit data lama, lengkapi wilayah dan tanggal jatuh tempo. NIK, pekerjaan, serta kontak darurat lama dipertahankan di spreadsheet, tetapi tidak lagi ditampilkan sebagai field form debitur.
5. Lengkapi PIC, nomor telepon, dan alamat klien LEGACY. Tanggal kasus lama dibaca dari Created At; penanggung jawab awal diambil dari SK aktif bila tersedia. Lengkapi personel jika kasus lama belum memiliki penugasan.
6. Jalankan `validateWorkspace()` sebagai Administrator dari editor untuk mendapatkan daftar data yang perlu ditinjau. Fungsi ini read-only dan tidak memperbaiki data secara diam-diam.
7. Sheet SK memperoleh kolom tambahan PDF Surat, Nama File PDF, Ukuran PDF, PDF Uploaded At, dan PDF Upload ID. Kolom Generator Data lama dipertahankan tanpa digunakan pada alur surat baru. Tidak ada tab atau data lama yang dihapus.
8. Setelah deploy, unggah **Kop surat perusahaan** melalui Pengaturan agar cover proposal dicetak dengan banner penuh, lalu lengkapi foto SPPI mitra DC melalui Tim & Mitra.

Form debitur menggunakan tiga bagian dan registrasi klien menggunakan dua bagian, dengan tinggi terbatas viewport. Form surat menyediakan tautan generator di tab baru serta form terpisah untuk mengunggah PDF final.

## Identitas Dan Akses

- Backend memverifikasi `Session.getActiveUser().getEmail()` pada setiap endpoint data. Email yang kosong atau tidak terdaftar ditolak, tanpa fallback ke identitas pemilik.
- Identitas aktif paling dapat diandalkan pada deployment internal Google Workspace dalam domain yang sama. Pembatasan akun Google dan kebijakan organisasi dapat memengaruhi ketersediaannya.
- Jika identitas aktif kosong, jangan menonaktifkan validasi backend. Gunakan deployment **Execute as: User accessing the web app**, berikan izin spreadsheet kepada pengguna yang diperlukan, dan minta mereka mengotorisasi aplikasi. Pilihan ini membuat pengguna yang mendapat izin edit spreadsheet juga memiliki akses langsung ke database.
- `Administrator`: seluruh CRUD, pengguna, pengaturan, dan penghapusan.
- `Supervisor`: CRUD operasional dan laporan, termasuk penghapusan; tidak mengubah pengguna atau pengaturan.
- `Collector`: baca/tambah/edit data operasional; tidak menghapus data, mengelola pengguna/pengaturan, atau mengubah rekening/mutasi. Rekening dapat dilihat, tetapi mutasi dikelola Administrator/Supervisor.
- Backend mempertahankan minimal satu Administrator dan melarang penghapusan akun aktif. Jangan memberi izin edit spreadsheet kepada pengguna yang tidak dipercaya.
- Paket ini adalah aplikasi internal satu agensi. Tidak ada pemisahan multi-tenant atau pembatasan akses per kasus.

## Skema Spreadsheet

Kolom inti mengikuti urutan yang diminta. Jangan mengubah nama tab, urutan header, atau ID secara manual.

| Sheet | Kolom Inti |
| --- | --- |
| Users | ID, Username, Role |
| Clients | ID, Kode Perusahaan Klien, Nama Perusahaan Lengkap, Industri, Contact Person, No Phone WhatsApp, Email, Alamat Domisili Kantor, Alamat Lengkap, Kabupaten Kota ID, Kabupaten Kota, Kecamatan ID, Kecamatan, Kelurahan Desa, Created At |
| Customers | ID, Nama, NIK, No Kontak, Alamat, Pekerjaan, Kontak Darurat, Detail Kendaraan, Angsuran, Denda, Total Angsuran |
| Cases | ID, No Kasus, Klien, Tipe Klien, Customer_ID, No Kontrak, Principal Outstanding, Overdue Days, DPD Bucket, Asset Summary |
| CollectionLogs | ID, No Log, Case_ID, Tipe Aktivitas Kanal, Tanggal Aktivitas, Personnel_ID, Pihak Dihubungi, Outcome, Action Plan, Next Action, Laporan Rinci, Ada Pembayaran, Created At, Updated At |
| Personnel | ID, Nama, Tipe (Karyawan/Mitra DC), Rekening Bank |
| SK | ID, No SK, Case_ID, Personnel_ID, Tanggal Terbit, Status |
| Payments | ID, No Kuitansi, Case_ID, Amount, Gross Fee, Company Revenue, Partner Commission, Total Manual Splits, Bukti Transfer |
| Executions | ID, No Penarikan, Case_ID, Personnel_ID, Tanggal, Lokasi, Metode, Referensi Kuasa, No BAST, Status, Dasar Fee, Fee Rate, Partner Rate, Gross Fee, Company Revenue, Partner Commission, Catatan |
| Accounts | ID, Nama Rekening, Bank, Nomor Rekening, Atas Nama, Saldo Awal |
| Transactions | ID, No Transaksi, Account_ID, Tanggal, Jenis, Kategori, Sumber, Source_ID, Case_ID, Klien, Nominal, Referensi, Keterangan |
| Proposals | ID, No Proposal, Judul, Client_ID, Nama Klien, Diajukan Kepada, Tanggal, Tempat, Status, Halaman, Mitra, Lampiran, Penandatangan, Jabatan Penandatangan, Contact Person, No Telepon, Email, Catatan, Created At, Updated At |

Kolom tambahan ditempatkan setelah kolom inti untuk mempertahankan data formulir:

- Customers: `No Kontrak`, `Kabupaten Kota ID`, `Kabupaten Kota`, `Kecamatan ID`, `Kecamatan`, `Kelurahan Desa`, `Alamat Lengkap`, `Tanggal Jatuh Tempo`, `Foto KTP`, `Nama File KTP`, `Foto STNK`, `Nama File STNK`, `Merk Type`, `Nomor Polisi`.
- Cases: `Status`, `Created At`, `Payment Closed`, `Client_ID`, `Layanan`, `Personnel_ID`, `Tanggal Dibuat`, `Jatuh Tempo Acuan`.
- Personnel: `Posisi Jabatan`, `NIK`, `Foto KTP`, `Nama File KTP`, `Foto SPPI`, `Nama File SPPI`.
- Proposals: `Halaman`, `Mitra`, dan `Lampiran` menyimpan JSON array dalam satu sel. `Halaman` dibatasi 45.000 karakter agar tetap di bawah limit 50.000 karakter per sel Google Sheets; proposal yang lebih panjang ditolak dengan pesan yang jelas.
- SK: `Tempat`, `Penandatangan`, `Perwakilan Klien`, `Alamat Klien`, `Berlaku Sampai`, `Generator Data` (legacy), `Catatan Update`, `Updated At`, `PDF Surat`, `Nama File PDF`, `Ukuran PDF`, `PDF Uploaded At`, `PDF Upload ID`.
- CollectionLogs: `SK_ID` untuk relasi laporan pada penugasan tertentu.
- Payments: `Tanggal`, `Fee Rate`, `Partner Rate`, `Manual Details`, `CollectionLog_ID`.
- Transactions: `Client_ID` ditambahkan setelah kolom Keterangan.

`Manual Details` menyimpan array JSON berisi `id`, `label`, `amount`, `mode`, dan `partnerPercent`. `Total Manual Splits` menyimpan total seluruh biaya tambahan manual, termasuk baris 100% perusahaan.

Inisialisasi bersifat idempoten: sheet yang sudah ada tidak dihapus. Header lama divalidasi sebelum kolom tambahan ditulis. Data NIK, nomor kontak, rekening, nomor dokumen, dan tanggal diperlakukan sebagai teks agar tidak kehilangan angka nol di depan.

## API

Setiap endpoint data mengembalikan objek JSON-serializable dengan struktur:

    { status: 'success' | 'error', data: object | array, message: string }

`doGet(e)` merupakan pengecualian karena harus mengembalikan HtmlOutput.

- Users: `getUsers`, `addUser(data)`, `updateUser(id, data)`, `deleteUser(id)`.
- Clients: `getClients`, `addClient(data)`, `updateClient(id, data)`, `deleteClient(id)`.
- Customers: `getCustomers`, `addCustomer(data)`, `updateCustomer(id, data)`, `deleteCustomer(id)`.
- Impor debitur: `importCustomers(rows, batchId)`, maksimal 300 baris, tidak menimpa data.
- Dokumen debitur: `getCustomerDocument(customerId, 'ktp' | 'stnk')`, dengan verifikasi pengguna dan folder file.
- Cases: `getCases`, `addCase(data)`, `updateCase(id, data)`, `deleteCase(id)`.
- CollectionLogs: `getCollectionLogs`, `addCollectionLog(data)`, `updateCollectionLog(id, data)`, `deleteCollectionLog(id)`.
- Personnel: `getPersonnel`, `addPersonnel(data)`, `updatePersonnel(id, data)`, `deletePersonnel(id)`.
- Dokumen personel: `getPersonnelFile(personnelId, 'ktp' | 'sppi')` mengembalikan foto KTP atau sertifikat SPPI hanya setelah otorisasi dan verifikasi folder. `getPersonnelFiles([id, ...])` (maks. 12 ID) mengembalikan foto KTP + SPPI sekaligus untuk halaman Tim & Mitra pada proposal; file di atas 1,5 MB dilewati dengan pesan agar payload tetap ringan.
- Proposals: `getProposals`, `addProposal(data)`, `updateProposal(id, data)`, `deleteProposal(id)`.
- SK: `getSK`, `addSK(data)`, `updateSK(id, data)`, `deleteSK(id)`.
- PDF SK: `uploadSKPdf(letterId, upload, uploadId, expectedPdfUrl)` dan `getSKPdf(letterId)`.
- Payments: `getPayments`, `addPayment(data)`, `updatePayment(id, data)`, `deletePayment(id)`.
- Executions: `getExecutions`, `addExecution(data)`, `updateExecution(id, data)`, `deleteExecution(id)`.
- Accounts: `getAccounts`, `addAccount(data)`, `updateAccount(id, data)`, `deleteAccount(id)`.
- Transactions: `getTransactions`, `addTransaction(data)`, `updateTransaction(id, data)`, `deleteTransaction(id)`.
- Workspace (satu workspace tunggal): `getBootstrap`, `getSettings`, `updateSettings(data)`. `updateSettings` menerima `logo`/`logoName` dan `letterhead`/`letterheadName` sebagai data URL; server menyimpan file di Drive dan hanya menyimpan ID file pada Script Property `ARMS_SETTINGS`. `getBootstrap` mengembalikan `settings.logo` dan `settings.letterhead` siap pakai, serta array `proposals`.
- Audit Administrator: `validateWorkspace()` menghasilkan `{ valid, checkedRecords, issues, message }` di dalam properti `data` pada envelope standar.

Nama properti JSON dan pemetaan ke header spreadsheet tersedia di `ARMS_SCHEMA` pada `Code.gs`. Contoh: `name` dipetakan ke `Nama`, `customerId` ke `Customer_ID`, dan `principal` ke `Principal Outstanding`.

`getCases()` menambahkan `customerName`, `customerNik`, dan `personnelName` dari relasi Customers, SK, dan Personnel. Data tanggal diserialisasikan sebagai string, bukan objek Date.

Pemanggilan frontend menggunakan `rpc(method, ...args)`, yaitu Promise yang membungkus `.withSuccessHandler()` dan `.withFailureHandler()`. Indikator loading dan penonaktifan kontrol mencegah klik ganda selama request. Tidak ada retry otomatis pada mutasi data.

## Aturan Bisnis

1. Total Angsuran = Angsuran + Denda. Dihitung di frontend, dihitung ulang di backend, dan disimpan.
2. Principal Outstanding selalu diambil dari Total Angsuran debitur yang dipilih. Field UI disabled dan nilai kiriman klien tidak dipercaya oleh backend.
3. Edit keuangan debitur menyinkronkan principal seluruh kasus terkait. Total baru tidak boleh di bawah jumlah pembayaran yang sudah diterima pada kasus mana pun.
4. DPD bucket dibuat dari overdue days: 0-30, 31-60, 61-90, atau lebih dari 90. Bucket pertama memakai label `1-30 hari` dan mencakup nilai 0 untuk akun yang belum terlambat.
5. Klien MULTIFINANCE, PERBANKAN, dan FINTECH menggunakan Surat Tugas; PERORANGAN menggunakan Surat Kuasa. Nomor penugasan internal dibuat otomatis di server menggunakan urutan bulanan yang dilindungi Script Lock.
6. Pembayaran tidak mengubah principal awal. Sisa piutang = principal - jumlah pembayaran kasus. Pembayaran melebihi sisa piutang ditolak.
7. Pelunasan menutup kasus otomatis dan menandai Payment Closed. Koreksi/hapus pembayaran membuka kembali kasus yang ditutup otomatis jika masih ada piutang. Kasus yang ditutup manual tetap mengikuti keputusan penutupan manual. Kasus lunas/Selesai tidak tersedia untuk pembayaran baru; transaksi lama tetap dapat dikoreksi.
8. Debitur, kasus, atau personel yang masih memiliki relasi tidak dapat dihapus. Hapus relasinya lebih dahulu setelah memastikan kebijakan retensi dan pembukuan memperbolehkan.
9. Nomor kontrak debitur wajib dan unik. Nama, alamat domisili lengkap, tanggal jatuh tempo, serta nomor handphone wajib diisi. Foto dan spesifikasi kendaraan dapat ditambahkan saat tersedia.
10. Kecamatan difilter berdasarkan kabupaten/kota. Mengganti wilayah induk mengosongkan pilihan turunannya. Kelurahan/desa diisi sebagai teks. Input wilayah manual tersedia jika referensi belum dimuat atau wilayah tidak ditemukan.
11. Status proses debitur dihitung dari seluruh kasusnya: Baru, Dalam penagihan, Pembayaran sebagian, Tarik unit, Unit ditarik, Berhasil, atau Ditunda. Berhasil berarti seluruh kasus selesai/lunas; pembayaran sebagian tidak disembunyikan.

## Clients & Creditors Master

- Empat industri: MULTIFINANCE, PERBANKAN, FINTECH, PERORANGAN. Klien PERORANGAN merupakan pemberi kuasa.
- Kode perusahaan wajib dan unik tanpa membedakan huruf besar/kecil. Nama lengkap, Contact Person, telepon, serta alamat kantor/domisili wajib. Email opsional, tetapi harus valid jika diisi.
- Alamat terdiri dari Kabupaten/Kota, Kecamatan, Kelurahan/Desa, dan rincian jalan. Pilihan wilayah mengikuti referensi yang sama dengan form debitur; tersedia input manual saat jaringan tidak tersedia.
- Kasus menyimpan Client_ID, bukan hanya nama teks. Perubahan nama/industri klien disinkronkan ke kasus dan identitas mutasi terkait.
- Klien yang masih dipakai kasus atau transaksi tidak dapat dihapus. Master hasil migrasi menampilkan data yang perlu dilengkapi, bukan kontak fiktif.

## New Recovery Case

1. Pilih Client / Creditor dari master, lalu pilih debitur terdaftar.
2. Nomor Kontrak / Bukti Hutang selalu diambil dari data debitur. Principal Outstanding berasal dari Total Angsuran.
3. Pilih layanan: Penagihan Piutang, Mediasi & Penyelesaian, atau Eksekusi / Tarik Unit.
4. Hari Tunggakan = `max(0, tanggal pembuatan kasus - tanggal jatuh tempo debitur)` dalam hari kalender. Zona tanggal adalah Asia/Jakarta. Tanggal jatuh tempo mendatang menghasilkan 0, bukan nilai negatif.
5. Tanggal pembuatan asli tidak berubah ketika kasus diedit. DPD dan Jatuh Tempo Acuan dihitung ulang terhadap tanggal asli jika jatuh tempo debitur dikoreksi. Nilai DPD lama mungkin berubah saat migrasi karena perhitungan sebelumnya menggunakan input manual.
6. Assign To Personnel / Mitra disimpan langsung sebagai Personnel_ID pada Cases. Surat, log, dan penarikan menggunakan penanggung jawab ini sebagai pilihan awal; PIC setiap aktivitas masih dapat dipilih berbeda.
7. Agunan diambil dari Merk/Type serta Nomor Polisi debitur. Form tidak mengizinkan edit manual field turunan; backend mengabaikan nilai turunan kiriman klien dan menghitung ulang dari sumber.
8. Kasus duplikat untuk Client_ID, Customer_ID, dan kontrak yang sama ditolak. Klien/debitur tidak dapat diganti jika sudah ada log, surat, pembayaran, eksekusi, atau mutasi terkait.

## Collections & Communications Log

- Cari berkas dengan mengetik nomor kasus, kontrak, nama debitur, atau klien, lalu pilih hasil yang cocok.
- Kanal: Kunjungan Lapangan, WhatsApp & Chat, Eksekusi Unit, Penarikan aset jaminan.
- Isi tanggal aktivitas, PIC, pihak yang ditemui/dihubungi, outcome, Action Plan, Target Janji Bayar / Next Action, dan laporan rinci.
- Outcome yang tersedia mengikuti daftar form: Promise to Pay; Pembayaran Titipan / Pelunasan; Sepakat Mediasi Kantor; Unit Ditemukan / Teridentifikasi; Unit Berhasil Ditarik / Diserahterimakan; Debitur Tidak di Rumah / Nomor Tidak Aktif; Menolak Bayar / Tidak Kooperatif.
- Tanggal log harus valid, tidak di masa mendatang, dan tidak sebelum kasus dibuat. Next Action tidak boleh sebelum tanggal aktivitas. Target tanggal wajib untuk Promise to Pay. Laporan minimal 10, maksimal 5000 karakter.
- Centang **Ya, ada pembayaran**, lalu pilih **Simpan & Catat Pembayaran**. Sistem menyimpan log sebelum membuka form pembayaran dengan Case_ID dan CollectionLog_ID yang sama. Jika batal mengisi pembayaran, log tetap ada dengan status Belum dicatat.
- Satu log hanya boleh ditautkan ke satu kuitansi. Jika kuitansi sudah ada, tombol membuka pembayaran tersebut, bukan membuat baru. Kasus lunas tidak menerima pembayaran baru.
- Outcome pembayaran atau penarikan tidak langsung mengubah saldo, status pelunasan, atau BAST. Nominal wajib dicatat di Payments; penarikan resmi wajib dicatat di Executions dengan dokumen yang sesuai.
- Aktivitas pertama pada kasus Aktif mengubah statusnya menjadi Dalam Proses. Proses debitur juga dapat menampilkan Janji bayar atau Mediasi dari log terbaru, selama tidak ada status pembayaran/eksekusi yang lebih tinggi.
- Detail kasus menampilkan klien master dan riwayat komunikasi. Detail log memiliki tautan ke kasus, debitur, surat, pembayaran, serta penarikan. Filter menampilkan seluruh aktivitas, tindak lanjut yang jatuh tempo, atau pembayaran belum dicatat.
- Log dengan pembayaran terhubung tidak dapat dihapus atau dipindah ke kasus lain. Penanda pembayaran juga tidak dapat dinonaktifkan. Koreksi/hapus kuitansi dahulu sesuai kebijakan pembukuan.

## Validasi Ulang

- Form, lapisan penyimpanan React, dan fungsi server melakukan validasi ulang. Seluruh mutasi GAS tetap memakai Script Lock untuk mencegah benturan penomoran dan pemeriksaan duplikat.
- Server memverifikasi setiap ID relasi, field wajib, nilai enum, tanggal, kode klien, nominal, sumber fee, serta kesesuaian log dengan pembayaran.
- `validateWorkspace()` memeriksa data yang tersimpan tanpa menulis: ID/kode duplikat, Client_ID/Customer_ID/PIC yang hilang, kontrak/principal/DPD tidak sinkron, pembayaran melebihi piutang, pembagian fee tidak seimbang, dan kuitansi ganda pada log.
- Jika server sudah mengonfirmasi penyimpanan tetapi refresh gagal, ID hasil simpan dipertahankan. Percobaan berikutnya memperbarui ID tersebut, bukan membuat baris baru. Jika respons mutasi sendiri terputus sebelum konfirmasi, muat ulang dan periksa data terlebih dahulu sebelum mengirim ulang.
- Validasi tidak menjamin layanan Google atau jaringan selalu tersedia. Gunakan cadangan, riwayat versi, dan checklist uji sebelum operasional.

## Perhitungan Fee

- Gross Fee = round(Pembayaran x Fee Rate / 100).
- Komisi Mitra Dasar = round(Gross Fee x Partner Rate / 100).
- Pendapatan Perusahaan Dasar = Gross Fee - Komisi Mitra Dasar.
- Biaya manual `company`: seluruh nominal menjadi pendapatan perusahaan.
- Biaya manual `split`: round(Nominal x Partner Percent / 100) menjadi hak mitra; sisanya menjadi hak perusahaan.
- Pendapatan Perusahaan + Komisi Mitra = Gross Fee + Total Biaya Manual.
- Pembulatan dilakukan ke rupiah penuh. Biaya tambahan tidak mengurangi pokok piutang dan tidak ditambahkan ke nominal pembayaran debitur.

Contoh uji:

| Parameter | Nilai |
| --- | --- |
| Pembayaran | Rp 10.000.000 |
| Fee Rate | 20% |
| Partner Rate | 40% |
| Manual A, 100% perusahaan | Rp 100.000 |
| Manual B, split mitra 50% | Rp 200.000 |
| Gross Fee | Rp 2.000.000 |
| Total Manual | Rp 300.000 |
| Pendapatan Perusahaan | Rp 1.400.000 |
| Komisi Mitra | Rp 900.000 |

Backend menghitung ulang semuanya sebelum menyimpan. Mengubah nilai ringkasan melalui DevTools tidak dapat memalsukan angka keuangan.

## Surat Dan Arsip PDF

1. Buka **Surat Tugas & Kuasa > Buat Surat**, pilih debitur, kasus, dan personel, lalu lengkapi parameter penugasan.
2. Klik **Simpan Penugasan** untuk memperoleh nomor internal ARMS.
3. Tautan **Buka Generator Surat** di samping Simpan Penugasan membuka `https://generator-surat-new.vercel.app/` pada tab baru. Tidak ada iframe, pengambilan build GitHub, autofill, atau pengiriman data otomatis dari ARMS.
4. Buat dokumen di generator dan simpan hasilnya sebagai PDF. Isi dan nomor pada PDF harus diperiksa operator agar sesuai dengan penugasan.
5. Kembali ke ARMS. Gunakan form **Upload PDF Surat Tugas / Kuasa** di bawah form penugasan. Pilih file `.pdf`, maksimal 5 MB, lalu klik **Upload PDF Surat**.
6. Memilih file hanya membaca dan memvalidasinya di browser. File baru dikirim ke backend ketika tombol upload ditekan. Form upload tidak aktif jika penugasan belum tersimpan atau masih memiliki perubahan yang belum disimpan.
7. Setelah berhasil, nama file, ukuran, serta tanggal unggah tampil. **Unduh PDF** tersedia pada form upload, tabel surat, dan detail surat.
8. Untuk mengganti file, pilih PDF pengganti lalu klik **Ganti PDF Surat**. File lama dipindahkan ke Trash setelah referensi PDF baru tersimpan. Unduh salinan lama dahulu jika diperlukan untuk arsip.

Validasi frontend dan backend memeriksa ekstensi, MIME, ukuran, base64, header `%PDF-x.x`, serta penanda `%%EOF` di bagian akhir. Ini adalah pemeriksaan format dasar, bukan pemindaian malware, parsing lengkap PDF, atau verifikasi keabsahan hukum surat. Unggah hanya dokumen dari sumber yang dipercaya.

File PDF disimpan di folder Drive terbatas yang sama dengan dokumen ARMS. Sheet SK hanya menyimpan URL, nama, ukuran, tanggal unggah, dan ID upload. Base64 tidak disimpan di sel. `getSKPdf` memverifikasi pengguna, penugasan, keanggotaan folder, tipe file, dan ukuran sebelum mengembalikan data.

Upload memiliki ID request unik untuk mencegah retry menghasilkan file ganda; backend juga membandingkan referensi PDF sebelumnya agar dokumen yang telah diperbarui pengguna lain tidak tertimpa tanpa diketahui. Mutasi menggunakan Script Lock.

Metadata PDF hanya dapat diubah melalui endpoint upload, bukan CRUD SK biasa. Kasus dan petugas pada SK yang sudah memiliki PDF atau laporan tidak dapat diganti. Pembaruan PDF tidak mengubah status, Catatan Update, atau Updated At penugasan, sehingga tidak menyelesaikan reminder laporan secara otomatis.

Pada demo React, PDF disimpan di IndexedDB pada browser. Reset demo menghapus file lokal. Cadangan JSON/CSV hanya memuat metadata, bukan isi PDF: unduh PDF terpisah sebelum reset. Pada GAS, penghapusan SK yang diizinkan juga memindahkan PDF terkait ke Trash. Administrator tetap perlu mengatur retensi serta pengosongan Trash sesuai kebijakan organisasi.

## Impor Bulk Debitor

1. Pada menu Debitur pilih **Import Bulk Debitor > Template .xlsx**.
2. Isi sheet Debitur dan hapus baris contoh. Maksimal 300 baris per file, ukuran 5 MB. Format yang didukung `.xlsx` dan `.csv`; ekspor Google Sheets ke salah satu format tersebut.
3. Kolom: No. Kontrak, Nama, Kabupaten/Kota, Kecamatan, Kelurahan / Desa, Alamat Lengkap, Tanggal Jatuh Tempo, Angsuran, Denda, Total Angsuran (Rp), Nomor Handphone, Merk/Type, Nomor Polisi, NIK (Opsional).
4. Kontrak, telepon, serta NIK harus bertipe Text. Tanggal menerima YYYY-MM-DD, DD/MM/YYYY, atau sel Date Excel. Formula tidak diterima; gunakan Paste Values.
5. Nama, kontrak, domisili lengkap, jatuh tempo, angsuran, dan nomor handphone wajib. Denda kosong dianggap 0. Total opsional, tetapi jika diisi harus sama dengan Angsuran + Denda.
6. Periksa ringkasan/error per baris. Seluruh baris harus valid sebelum tombol Impor aktif. File kesalahan dapat diunduh.
7. Server memeriksa ulang semua baris, menolak nomor kontrak duplikat, lalu menulis satu rentang di bawah Script Lock. Tidak menimpa atau mengubah debitur lama. Batch ID yang sama mencegah retry membuat data ganda.
8. Foto tidak diimpor dari spreadsheet; unggah melalui Edit Debitur setelah impor. Data wilayah impor disimpan sebagai teks yang harus diverifikasi operator.

ExcelJS 4.4.0 dimuat dari CDN hanya saat fitur Excel digunakan di GAS. Versi React membundelnya sebagai dependency. Gunakan file terpercaya milik organisasi, bukan workbook tidak dikenal.

## Logo, Kop Surat, Dan Dokumen Personel

Aplikasi memakai **satu workspace tunggal**: satu identitas agensi, satu logo, satu kop surat, dan satu spreadsheet database. Tidak ada pemilihan atau pemisahan multi-workspace.

- Tombol Upload Logo berada di kiri Pengaturan. Nama perusahaan ditampilkan di samping logo pada workspace. Logo tidak dikirim otomatis ke generator eksternal.
- Logo JPG/PNG/WebP maksimal 2 MB diubah menjadi gambar maksimal 320 px dan 180.000 karakter dataURL. Versi GAS menyimpan file di folder Drive terbatas dan hanya menyimpan ID file dalam Script Properties, bukan base64 besar.
- Blok **Kop surat perusahaan** pada Pengaturan menerima banner kop (JPG/PNG/WebP, diperkecil otomatis ke lebar maksimal 1600 px dan 1,2 juta karakter dataURL). Kop surat dipakai pada cover proposal dan dicetak penuh melewati batas margin atas kertas. Bila belum ada kop, aplikasi mencetak kop teks otomatis dari nama agensi, alamat, telepon, dan email.
- Field default proposal (kota pembuatan, contact person, telepon, email) tersedia pada Pengaturan dan mengisi token `{kota}`, `{kontak}`, `{telepon}`, `{email}`.
- Tim & Mitra memiliki Posisi / Jabatan, NIK opsional, Upload KTP, dan **Upload SPPI (opsional)**. Nama personel di dropdown tidak diberi akhiran Mitra DC. Jenis Karyawan/Mitra tetap tersimpan untuk kompatibilitas.
- KTP dan SPPI maksimal 2 MB per file. GAS menyimpan keduanya di folder Drive terotorisasi; file lama dipindahkan ke Trash setelah perubahan berhasil disimpan. Kedua dokumen dapat diunduh dari kolom "KTP / SPPI" pada tabel Tim & Mitra maupun dari detail personel.
- Foto tidak diekstraksi melalui OCR; NIK opsional tetap dapat dicatat pada data personel dan ditampilkan di lampiran proposal bila diaktifkan.
- `validateWorkspace()` menandai Mitra DC yang belum memiliki foto KTP atau SPPI agar lampiran proposal lengkap sebelum dikirim.

## Proposal Kerja Sama

Menu **Proposal** menyusun proposal kerja sama jasa penagihan yang dapat diedit per halaman, mengikuti struktur contoh proposal (surat permohonan, company profile, daftar isi, BAB 1-9).

- Satu proposal = satu baris pada sheet `Proposals`. Kolom `Halaman`, `Mitra`, dan `Lampiran` menyimpan JSON array; seluruh teks divalidasi dan dibatasi panjangnya di server.
- Editor menampilkan tiga panel: informasi proposal (judul, nomor, klien dari master atau manual, kepada, tanggal, tempat, status, penandatangan, contact person, lampiran, catatan internal), daftar halaman, dan isi halaman terpilih. Pratinjau kertas A4 berada di sisi kanan dan diperbarui saat mengetik.
- Halaman dapat ditambah (isi atau daftar isi), diduplikasi, dipindahkan, dan dihapus. Halaman pertama selalu menjadi cover.
- Isi halaman disusun dari blok: kop surat, judul bagian (H1/H2/H3), paragraf, daftar butir (bullet/bernomor), tabel label-nilai, tabel bebas, Tim & Mitra DC, dan tanda tangan. Setiap blok dapat dipindahkan atau dihapus.
- Blok **Tim & Mitra DC** mengambil personel dari Tim & Mitra dan menampilkan nama, jabatan, jenis personel, NIK (opsional), rekening, serta **foto KTP dan foto sertifikat SPPI**. Tombol "Muat foto mitra" mengambil dokumen dari Drive (maks. 12 mitra per request); foto juga dimuat otomatis sebelum mencetak.
- Token teks pada seluruh isian: `{agensi}`, `{klien}`, `{nomor}`, `{kota}`, `{tanggal}`, `{penandatangan}`, `{jabatan}`, `{kontak}`, `{telepon}`, `{email}`, `{alamat}`.
- **Cetak / Simpan PDF** memakai dialog cetak browser: ukuran A4, margin default atau None, dan "Save as PDF". Kop surat pada cover dicetak full-bleed (menyentuh tepi atas dan sisi kertas) seperti contoh proposal. Proposal harus disimpan terlebih dahulu agar nomor dan data mitra tercetak benar.
- Personel yang masih dipakai pada sebuah proposal tidak dapat dihapus; lepaskan dari halaman Tim & Mitra terlebih dahulu. Mengganti nama klien pada master menyinkronkan `Nama Klien` pada proposal tanpa mengubah isi halaman.

## Reminder Laporan SK

- Dashboard memeriksa SK aktif yang memiliki nomor dan sudah terbit. Draft, Selesai, dan Dicabut tidak mendapat reminder laporan.
- Interval default 3 hari, dapat diubah ke 1-30 hari di Pengaturan. Tanggal acuan memakai Asia/Jakarta saat ini, bukan filter periode grafik.
- Reminder mempertimbangkan laporan terakhir yang terhubung SK_ID, atau log lama pada kasus/PIC yang sama setelah SK diterbitkan. Catatan Update SK yang diisi juga memperbarui tanggal acuan.
- SK dengan masa berlaku habis atau kasus selesai tetapi status surat masih aktif meminta Update SK.
- Tombol Buat laporan membuka Collections Log dengan SK_ID, kasus, dan personel terkait. Pengguna wajib mengisi isi laporan. SK yang sudah terhubung laporan tidak dapat dihapus; gunakan status Selesai/Dicabut.
- Ini adalah reminder dalam aplikasi, bukan pengiriman WhatsApp/email otomatis.

## Eksekusi / Tarik Unit

- Catat kasus, petugas, tanggal, lokasi, metode, referensi kuasa/dokumen sah, serta nomor BAST. BAST wajib saat status Selesai.
- Status: Dijadwalkan, Dalam Proses, Selesai, Dibatalkan. Satu kasus hanya memiliki satu penugasan penarikan yang tidak dibatalkan.
- Gross fee = round(Dasar Fee x Fee Rate / 100). Hak mitra = round(Gross Fee x Partner Rate / 100); hak perusahaan = sisanya.
- Dasar fee merupakan nilai yang disepakati klien dan dapat disesuaikan; tidak selalu identik dengan pokok pinjaman.
- Penarikan selesai tidak otomatis melunasi piutang. Status proses debitur menjadi Unit ditarik selama kasus belum selesai.
- Fee penarikan selesai muncul di daftar Fee belum dicatat. Penugasan belum selesai tidak dianggap sebagai penerimaan kas.

## Rekening Dan Mutasi

1. Tambahkan rekening bank atau kas beserta nomor/kode, atas nama, dan saldo awal.
2. Catat Pemasukan/Pengeluaran aktual, tanggal, sumber, nominal, kategori, referensi, dan keterangan.
3. Sumber `multifinance` mencatat fee langsung dari klien; `manual` untuk biaya operasional/pihak lain; `case` untuk fee tambahan dari kasus selesai.
4. Sumber `payment` dan `execution` terhubung ke fee pembayaran atau penarikan selesai. Pemasukan dibatasi gross fee + biaya manual yang belum dicatat; pengeluaran dibatasi hak komisi mitra yang belum dibayar. Batas ini berlaku akumulatif lintas rekening.
5. Catat biaya operasional umum menggunakan sumber manual, bukan sumber komisi agar tidak salah pembagian.
6. Saldo = Saldo Awal + Pemasukan - Pengeluaran. Saldo dapat negatif jika riwayat belum lengkap; aplikasi tidak melakukan transfer bank.
7. Nomor referensi yang sama pada rekening dan arah mutasi yang sama ditolak. Sumber yang masih memiliki mutasi tidak dapat dihapus/dipindahkan, atau diturunkan fee-nya di bawah jumlah yang sudah dicatat.
8. Filter mutasi berdasarkan rekening, jenis, bulan, dan kata kunci; ekspor CSV tersedia. Catat masuk dari tab Fee belum dicatat untuk menautkan sumber tanpa input ulang.

Hak fee pada pembayaran dan laporan tidak identik dengan kas diterima. Tidak ada pemasukan otomatis ke rekening dari pembayaran pokok debitur. Fee klien langsung dan fee tambahan kasus selesai merupakan pencatatan manual; verifikasi invoice agar tidak mencatat biaya yang sama dua kali melalui sumber berbeda.

## Bukti Transfer

Field Bukti Transfer menerima tautan HTTPS ke file yang sudah diunggah secara terpisah. Untuk bukti transfer, aplikasi tidak mengunggah file atau mengubah izin berbagi. Unggahan langsung tersedia untuk foto debitur/personel, logo, serta PDF penugasan pada modul masing-masing.

## Foto KTP Dan STNK

- Pilih foto JPG, PNG, atau WebP, maksimal 2 MB per file. File dibaca dan diperiksa sebelum tombol Simpan dapat digunakan.
- File baru baru dikirim saat menyimpan debitur, menggunakan payload `ktpUpload` / `stnkUpload` berisi `name`, `mimeType`, dan `dataUrl`. Batal form tidak membuat file di Drive.
- Backend memvalidasi ukuran, MIME, dan signature gambar; membuat file dalam folder `ARMS - Dokumen Debitur`; lalu menyimpan URL dan nama file ke sheet Customers. Data base64 tidak disimpan ke sel spreadsheet.
- Folder dibuat privat saat unggahan pertama. ID folder tersimpan dalam Script Property `ARMS_DOCUMENTS_FOLDER_ID`. Aplikasi tidak memberi akses publik atau mengirim dokumen ke layanan wilayah.
- Dokumen dapat diunduh melalui detail debitur. `getCustomerDocument` memverifikasi akses pengguna, relasi customer, jenis file, dan bahwa file masih berada di folder ARMS.
- Mengganti atau menghapus foto dilakukan setelah menyimpan form. File lama dipindahkan ke Trash setelah data tersimpan. Menghapus debitur juga membersihkan file terkait. Administrator perlu memeriksa log jika pembersihan gagal dan mengatur retensi serta pengosongan Trash sesuai kebijakan organisasi.
- Untuk deployment **Execute as: User accessing the web app**, pemilik harus menyiapkan folder terlebih dahulu dan memberikan izin yang sesuai pada folder hanya kepada pengguna internal yang diperlukan. Pilihan deployment ini juga memberikan akses Drive langsung kepada pengguna tersebut.
- Foto di demo React disimpan di IndexedDB pada perangkat, bukan Google Drive. Cadangan JSON/CSV menyimpan metadata atau referensi, bukan isi file foto. Unduh foto melalui detail debitur sebelum menghapus data browser atau mereset demo.

## Referensi Wilayah

Daftar kabupaten/kota dan kecamatan dimuat dari `https://www.emsifa.com/api-wilayah-indonesia/v2`. Format respons menggunakan `{ data: [...] }`. Aplikasi hanya meminta kode wilayah, tidak mengirim nama, alamat lengkap, foto, nomor kontrak, atau data debitur ke layanan tersebut. Daftar awal terbatas untuk Jakarta disertakan sebagai fallback, dengan input manual untuk wilayah lain saat offline. Referensi ini bukan pengganti verifikasi alamat resmi.

## Keamanan Dan Operasional

- Hanya gunakan deployment internal terautentikasi. Jangan menerbitkan spreadsheet atau web app untuk akses anonim.
- Frontend GAS tidak menyimpan database ke localStorage. Versi pratinjau React yang terpisah menggunakan localStorage hanya untuk data demo fiktif, bukan data operasional.
- NIK lama tetap tersimpan untuk kompatibilitas, tetapi tidak lagi diminta oleh form debitur baru. Nilai input di-escape saat dirender ke HTML. Ekspor CSV dan penulisan spreadsheet melindungi dari formula injection.
- Script Lock melindungi penomoran dan perubahan data bersamaan. Google Sheets bukan database transaksional; backup, kontrol perubahan, dan monitoring tetap diperlukan.
- Endpoint bukan sistem akuntansi audit-proof. Batasi izin edit/hapus sesuai kebijakan, lindungi spreadsheet, dan aktifkan riwayat versi Google Sheets. Audit trail permanen, immutable ledger, enkripsi tingkat aplikasi, dan akses per kasus belum disediakan.
- Data pribadi harus diproses sesuai persetujuan, tujuan penggunaan, kewajiban perlindungan data, dan hukum yang berlaku.
- Batasi panjang teks sesuai template generator. Periksa ukuran kertas dan hasil di dialog cetak generator sebelum mencetak alamat atau aset yang panjang.
- Saat volume besar, pertimbangkan pagination server-side dan penyimpanan database terkelola. Implementasi ini membaca tabel ke memori dan cocok untuk workspace internal berskala kecil sampai menengah, dengan batas kuota GAS.

## Checklist Verifikasi Setelah Deployment

1. Jalankan inisialisasi dua kali. Data harus tetap utuh dan tidak ada tab duplikat.
2. Tambahkan debitur dengan Angsuran Rp 10.000.000 dan Denda Rp 250.000. Sheet Customers harus menyimpan Total Angsuran Rp 10.250.000.
3. Pilih debitur itu pada kasus. Principal harus Rp 10.250.000 dan tidak dapat diedit.
4. Ubah denda debitur. Principal pada kasus terkait harus ikut berubah setelah request selesai.
5. Buat personel dan terbitkan Surat Tugas untuk MULTIFINANCE, lalu Surat Kuasa untuk PERORANGAN. Keduanya harus memperoleh nomor unik dan parameter berbeda.
6. Uji contoh fee di atas, pastikan sisa piutang cukup, lalu verifikasi nilai pada sheet Payments dan JSON Manual Details.
7. Coba pembayaran di atas sisa piutang, nomor kontrak debitur duplikat, dan penghapusan debitur yang masih memiliki kasus. Semua harus ditolak dengan pesan yang jelas.
8. Coba klik Simpan berulang saat loading. Hanya satu aksi UI yang diproses.
9. Uji akses dengan email yang tidak terdaftar dan Collector yang mencoba menghapus data. Server harus menolak.
10. Pastikan tidak ada generator tertanam pada halaman surat. Klik Buka Generator Surat di samping Simpan Penugasan; URL yang dituju harus tepat dan terbuka di tab baru tanpa parameter pribadi.
11. Pilih kabupaten/kota, periksa daftar kecamatan, lalu ganti kota. Pilihan kecamatan dan kelurahan lama harus dikosongkan. Uji juga mode input manual saat offline.
12. Unggah KTP dan STNK, simpan, muat ulang, lalu unduh foto dari detail debitur. Ganti satu foto tanpa mengubah foto lainnya. File dengan format tidak didukung atau ukuran di atas 2 MB harus ditolak.
13. Perkecil tinggi jendela sampai 500 px. Navigasi dan footer form debitur harus tetap dapat diakses; bagian isi bergulir tanpa menutupi tombol. Pindah antarbagian dan pastikan seluruh nilai tetap ada.
14. Bayar sebagian kasus: proses menjadi Pembayaran sebagian dan masih dapat dipilih. Lunasi sisanya: proses menjadi Berhasil dan kasus hilang dari pilihan pembayaran baru. Koreksi pembayaran pada kasus yang ditutup otomatis harus mengembalikannya jika masih ada sisa piutang.
15. Buat tarik unit dengan dasar fee Rp 20.000.000, fee 10%, hak mitra 40%: gross fee Rp 2.000.000, perusahaan Rp 1.200.000, mitra Rp 800.000. Penyelesaian wajib memiliki BAST.
16. Buat rekening bersaldo Rp 1.000.000. Catat masuk Rp 2.000.000 dan keluar Rp 800.000. Saldo harus Rp 2.200.000. Penerimaan melebihi hak fee sumber dan referensi duplikat harus ditolak.
17. Coba menghapus rekening atau sumber fee yang masih dipakai mutasi. Backend harus menolak. Uji hak Collector yang hanya dapat melihat rekening, bukan mengubah mutasi.
18. Daftarkan klien untuk keempat industri. Coba kode yang sama dengan variasi huruf besar/kecil, email salah, atau kecamatan dari kota berbeda; penyimpanan harus ditolak.
19. Buat New Recovery Case. Kontrak, principal, dan agunan harus sama dengan data debitur. PIC langsung tampil pada daftar kasus, tim, dan pilihan awal log/surat/penarikan.
20. Uji hari tunggakan pada tanggal jatuh tempo yang sama (0), mendatang (0), serta selisih 2024-02-28 sampai 2024-03-01 (2). Edit kasus tanpa mengubah jatuh tempo tidak boleh menggeser tanggal acuan pembuatan.
21. Coba menyimpan kasus untuk klien, debitur, dan kontrak yang sama. Coba mengganti creditor/debitur pada kasus yang sudah memiliki log; keduanya harus ditolak.
22. Buat log pada seluruh kanal. Outcome Promise to Pay wajib memiliki target. Tanggal aktivitas mendatang, Next Action sebelum aktivitas, dan laporan kurang dari 10 karakter harus ditolak.
23. Simpan log dengan pembayaran, lalu klik Simpan & Catat Pembayaran. Kasus pada pembayaran harus sama; setelah kuitansi disimpan, log menampilkan Tercatat dan tombol membuka kuitansi yang sama. Pembayaran kedua pada log yang sama harus ditolak.
24. Batalkan form pembayaran setelah log disimpan. Log harus tetap tersedia pada filter Pembayaran belum dicatat; pokok piutang belum berubah.
25. Ganti nama klien, nomor kontrak, atau data kendaraan debitur. Tinjau sinkronisasi kasus, log terkait, surat, dan rekening. Periksa juga larangan menghapus klien/PIC/log yang masih mempunyai relasi.
26. Jalankan `validateWorkspace()` dan tinjau seluruh `issues`, terutama data migrasi LEGACY. Jalankan dua kali untuk memastikan audit tidak membuat perubahan data.
27. Impor dua debitur valid dari template. Uji satu baris invalid, formula, kontrak duplikat, tanggal salah, telepon numerik, serta total yang tidak sesuai; tidak boleh ada baris baru sampai seluruh data valid. Ulangi batch yang sama untuk memastikan tidak duplikat.
28. Upload logo dan ubah nama perusahaan. Muat ulang aplikasi, periksa sidebar dan Pengaturan. Hapus/ganti logo dan pastikan file serta data lama ditangani.
29. Upload/ganti KTP personel dan isi Posisi/Jabatan. Muat ulang, unduh KTP, lalu periksa nama dropdown tanpa akhiran dan detail jabatan yang tersimpan.
30. Uji Register Client pada jendela tinggi 500 px. Kedua langkah dan tombol footer harus dapat diakses tanpa dialog keluar viewport.
31. Terbitkan SK dengan acuan laporan lewat interval. Reminder harus muncul. Buat laporan dari tombol reminder atau isi Catatan Update pada SK; acuan reminder harus berubah. SK Dicabut/Selesai tidak muncul.
32. Simpan penugasan, pilih PDF valid di bawah 5 MB, lalu upload. Muat ulang, pastikan nama/ukuran/tanggal tersimpan dan unduhan berisi file yang sama.
33. Coba file bukan PDF, PDF kosong/tanpa penanda akhir, MIME tidak sesuai, dan file di atas 5 MB. Harus muncul error tanpa perubahan pada file yang sudah tersimpan.
34. Ganti PDF, periksa bahwa dokumen sebelumnya baru dibersihkan setelah metadata baru tersimpan. Ulangi upload dengan ID request yang sama dan pastikan tidak membuat file ganda. Request dengan referensi PDF lama harus ditolak.
35. Pastikan upload PDF tidak mengubah status atau Updated At laporan SK. Coba mengganti kasus/personel pada penugasan yang telah memiliki PDF atau laporan; backend harus menolak.
36. Buka aplikasi setelah mengganti `Code.gs` tanpa menjalankan `initializeDatabase`. Aplikasi harus tetap termuat; sheet `Proposals` dan kolom `Foto SPPI`/`Nama File SPPI` pada Personnel ditambahkan otomatis tanpa mengubah data lama.
37. Pastikan error `loadWorkspaceLogo_ is not defined` tidak muncul lagi. Bila masih muncul, file `Workspace.gs` lama masih ada di proyek dan perlu dihapus karena seluruh backend kini berada di `Code.gs`.
38. Unggah kop surat perusahaan pada Pengaturan, muat ulang aplikasi, lalu periksa pratinjau dan hasil cetak: gambar menyentuh tepi atas kertas dan melewati margin kiri-kanan pada cover.
39. Unggah foto SPPI untuk satu Mitra DC (KTP sudah ada), simpan, muat ulang, lalu unduh keduanya dari tabel Tim & Mitra dan dari detail personel. Personel tanpa SPPI tetap dapat disimpan.
40. Buat proposal baru dari template, ganti judul/klien/tanggal, tambah satu halaman isi, pindah urutannya, duplikasi, lalu hapus. Pratinjau kertas harus mengikuti setiap perubahan tanpa kehilangan teks.
41. Pilih dua Mitra DC pada blok Tim & Mitra, klik "Muat foto mitra", lalu cetak. Foto KTP dan SPPI harus tampil pada lampiran; mitra tanpa SPPI menampilkan keterangan "Belum diunggah".
42. Simpan proposal, muat ulang aplikasi, buka kembali, lalu ubah status menjadi Terkirim dan simpan. Nomor proposal tidak boleh berubah dan baris pada sheet `Proposals` tidak boleh bertambah.
43. Coba menyimpan proposal tanpa judul, dengan tanggal tidak valid, dengan nomor duplikat, atau dengan mitra yang tidak dikenal. Semua harus ditolak dengan pesan yang jelas.
44. Hapus personel yang masih dipakai sebuah proposal. Backend harus menolak sampai mitra dilepas dari halaman Tim & Mitra.

Paket sumber telah disiapkan, tetapi akses akun Google, otorisasi, deployment, dan tes di lingkungan GAS harus dilakukan pada organisasi Anda. Keberhasilan build frontend React tidak memverifikasi runtime layanan Google. Versi demo React pada `src/` tidak ikut diubah pada pembaruan proposal ini; aplikasi yang di-deploy adalah paket `public/google-apps-script/`.

## Referensi

- HTML templates: https://developers.google.com/apps-script/guides/html/templates
- Komunikasi client/server: https://developers.google.com/apps-script/guides/html/communication
- Deployment web app: https://developers.google.com/apps-script/guides/web
- Google Drive folder: https://developers.google.com/apps-script/reference/drive/folder
- Referensi wilayah: https://github.com/emsifa/api-wilayah-indonesia