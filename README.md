# ARMS

Aplikasi operasional agensi penagihan: dashboard, CRM debitur, kasus piutang, surat tugas/kuasa, pembayaran, pembagian fee, laporan, tim, dan pengaturan.

## Pratinjau Web

Entry point React: `src/App.tsx`. Menggunakan Vite, Tailwind CSS v4, Lucide, dan Framer Motion.

Mode pratinjau menggunakan data fiktif Juni 2025 dengan persistence lokal. Koneksi Google tidak disimulasikan sebagai koneksi aktif. Tautan paket GAS tersedia di **Pengaturan > Integrasi & database**. Data demo dapat dicadangkan atau direset dari halaman yang sama.

## Google Apps Script

Paket deployment lengkap ada di `public/google-apps-script/`:

- `Code.gs`
- `Crm.gs`
- `Workspace.gs`
- `Index.html`
- `js_main.html`
- `js_customer.html`
- `js_crm.html`
- `js_operations.html`
- `js_letters.html`
- `js_workspace.html`
- `js_bulk.html`
- `css_main.html`
- `appsscript.json`
- `README.md`

Frontend GAS menggunakan HTML, Vanilla JavaScript, dan Tailwind CDN, tanpa React build. Backend menginisialisasi sebelas sheet, menyediakan CRUD berelasi, menghitung ulang keuangan, dan memverifikasi akses Google. Panduan pemasangan, skema, aturan fee, keterbatasan, dan checklist uji tersedia di `public/google-apps-script/README.md`.

## Pembaruan Form Debitur

Form debitur mencakup nomor kontrak, nama, kabupaten/kota, kecamatan, kelurahan/desa, alamat lengkap, tanggal jatuh tempo, foto KTP/STNK, angsuran, total angsuran, denda, nomor handphone, merk/type, dan nomor polisi. Total tetap mengikuti perhitungan sebelumnya: angsuran + denda.

Pilihan wilayah menggunakan referensi Emsifa v2 dengan input manual jika jaringan tidak tersedia. Foto JPG/PNG/WebP maksimal 2 MB disimpan ke IndexedDB pada demo dan ke folder privat Google Drive pada GAS. Cadangan JSON demo hanya berisi metadata; unduh foto secara terpisah dari detail debitur sebelum reset.

Form Tambah Debitur dibagi menjadi tiga bagian: Debitur & domisili, Angsuran & kendaraan, dan Dokumen. Tinggi dialog dibatasi viewport; header, navigasi, dan footer tetap terlihat. Seluruh parameter dipertahankan.

## Proses Dan Keuangan

- Clients & Creditors Master mencatat kode unik, perusahaan/pemberi kuasa, industri, PIC, kontak, email opsional, dan alamat wilayah bertingkat.
- New Recovery Case memilih Client_ID, Customer_ID, layanan, serta Personnel_ID. Kontrak, principal, agunan, dan hari tunggakan dihitung ulang dari data sumber di backend.
- Hari tunggakan = maksimum 0 atau selisih hari kalender antara jatuh tempo debitur dan tanggal pembuatan asli kasus, menggunakan Asia/Jakarta. Tanggal acuan tidak bergeser saat kasus diedit.
- Collections & Communications Log menyimpan aktivitas, tanggal, PIC, pihak dihubungi, outcome, action plan, next action, dan laporan rinci. Target wajib untuk Promise to Pay.
- Simpan & Catat Pembayaran menyimpan log dahulu, lalu membuka form pembayaran pada kasus yang sama dengan CollectionLog_ID. Satu log hanya boleh memiliki satu kuitansi; perubahan atau penghapusan relasi yang masih digunakan ditolak.

- Menu Debitur menampilkan status serta indikator proses dari relasi kasus, pembayaran, dan penarikan unit.
- Kasus lunas atau berstatus Selesai tidak masuk pilihan Catat Pembayaran. Pembayaran sebagian tetap dapat dilanjutkan. Pelunasan menutup kasus otomatis; koreksi pembayaran membuka kembali kasus yang ditutup otomatis.
- Eksekusi / Tarik Unit mencatat petugas, tanggal, metode, lokasi, referensi kuasa, BAST, status, dasar fee, persentase fee, dan hak mitra. Unit selesai ditarik tidak otomatis melunasi piutang.
- Rekening mencatat bank/kas, saldo awal, mutasi pemasukan/pengeluaran, dan sumber fee. Saldo hanya berubah oleh mutasi aktual, bukan perhitungan hak fee.
- Fee dari pembayaran atau penarikan selesai dapat dicatat bertahap, dengan batas akumulasi sebesar hak fee. Fee multifinance dan tambahan kasus selesai dapat dicatat manual dengan referensi.

## Surat Dan PDF

Modul Surat Tugas & Kuasa tidak lagi memuat generator, iframe, atau build GitHub. Tautan **Buka Generator Surat** di samping **Simpan Penugasan** membuka `https://generator-surat-new.vercel.app/` pada tab baru, tanpa mengirim data ARMS otomatis.

Simpan penugasan terlebih dahulu, buat surat di generator eksternal, lalu unggah dokumen final melalui form **Upload PDF Surat Tugas / Kuasa** di bawahnya. PDF maksimal 5 MB, diperiksa ekstensi, MIME, ukuran, header PDF, dan penanda akhir dokumen. PDF dapat diganti atau diunduh dari halaman penugasan, tabel surat, dan detail surat.

Versi demo menyimpan file PDF di IndexedDB pada browser. Versi GAS menyimpan file di folder Google Drive terbatas dan metadata di sheet SK. Nomor penugasan tidak berubah saat PDF diunggah. File lama hanya dibersihkan setelah unggahan baru tersimpan. Relasi kasus dan petugas tidak dapat diganti jika SK sudah memiliki PDF atau laporan.

Pengunggahan memakai ID request dan pemeriksaan referensi PDF sebelumnya untuk menghindari duplikasi atau penggantian dokumen yang sudah berubah. Kolom Generator Data lama tetap dipertahankan untuk kompatibilitas, tetapi tidak lagi dipakai. Pemeriksaan PDF merupakan validasi format dasar, bukan antivirus atau verifikasi keabsahan isi surat.

## Impor, Branding, Dan Tim

- Tombol **Import Bulk Debitor** tersedia pada menu Debitur. Template `.xlsx`, pembacaan `.xlsx`/`.csv`, validasi seluruh baris, dan unduh error tersedia. Maksimal 5 MB / 300 baris. Tidak menimpa data lama.
- Kontrak, telepon, dan NIK harus berupa teks agar angka nol awal tidak hilang. Formula ditolak. Total dihitung ulang dan diperiksa. Impor GAS menulis satu rentang setelah semua baris valid, dengan Script Lock dan ID batch untuk mencegah retry duplikat.
- Tombol **Upload Logo** di kiri Pengaturan menerima PNG/JPG/WebP maksimal 2 MB, lalu mengecilkan gambar untuk identitas workspace. Nama perusahaan tampil di samping logo. Logo tidak dikirim otomatis ke generator eksternal.
- Tim & Mitra memiliki posisi/jabatan, NIK opsional, dan Upload KTP. Nama pada dropdown tidak diberi akhiran Mitra DC. Jenis personel tetap dipertahankan pada data untuk kompatibilitas.
- Register Client / Pemberi Kuasa menggunakan dua bagian dengan tinggi terbatas viewport, body scroll, serta header/footer tetap terlihat.

## Reminder SK

Dashboard menampilkan reminder untuk SK aktif: belum ada laporan, laporan perlu diperbarui, masa berlaku habis, atau kasus selesai tetapi SK masih aktif. Interval awal 3 hari dapat diubah menjadi 1-30 hari pada Pengaturan. Gunakan **Buat laporan** untuk Collections Log yang terhubung ke SK, atau **Update SK** untuk status/catatan. Perhitungan memakai tanggal hari ini (Asia/Jakarta), bukan filter grafik dashboard. Tidak mengirim notifikasi WhatsApp/email otomatis.

Untuk memperbarui GAS lama, tambahkan `js_letters.html`, perbarui Code.gs, Workspace.gs, Index.html, js_main.html, dan CSS. Hapus file HTML js_repo dan js_generator yang tidak lagi dipakai. Jalankan ulang `initializeDatabase()` untuk kolom PDF Surat, Nama File PDF, Ukuran PDF, PDF Uploaded At, serta PDF Upload ID, lalu deploy versi baru. Data lama tidak dihapus.

Cadangan JSON/CSV hanya berisi metadata, bukan file PDF atau foto. Unduh dokumen sebelum reset demo atau menghapus data browser. Unggahan PDF tidak mengubah status penugasan atau menandai reminder laporan sebagai selesai.

## Validasi

Validasi dilakukan pada form, lapisan penyimpanan, dan backend GAS: kode duplikat, relasi tidak ditemukan, tanggal tidak valid, riwayat kasus yang sudah terikat, nominal, pembagian fee, serta kuitansi ganda untuk log. Mutasi GAS menggunakan Script Lock. Jika server mengonfirmasi penyimpanan namun refresh gagal, ID hasil simpan dipertahankan untuk mencegah retry membuat baris baru.

Fungsi admin `validateWorkspace()` pada `Crm.gs` menjalankan audit read-only relasi, kode klien, perhitungan tunggakan, dan pembagian fee. Hasil berisi `valid`, `checkedRecords`, dan daftar `issues`; tidak mengubah data. Jalankan setelah migrasi sebelum menggunakan data operasional. Pengujian langsung GAS membutuhkan deployment di akun Google Anda.

Build produksi menggunakan script proyek `npm run build`. Runtime GAS, otorisasi akun, dan pencetakan fisik perlu diverifikasi setelah deployment di akun pengguna.