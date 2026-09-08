# ARMS

Aplikasi operasional agensi penagihan: dashboard, CRM debitur, kasus piutang, surat tugas/kuasa, pembayaran, pembagian fee, laporan, tim, dan pengaturan.

## Pratinjau Web

Entry point React: `src/App.tsx`. Menggunakan Vite, Tailwind CSS v4, Lucide, dan Framer Motion.

Mode pratinjau menggunakan data fiktif Juni 2025 dengan persistence lokal. Koneksi Google tidak disimulasikan sebagai koneksi aktif. Tautan paket GAS tersedia di **Pengaturan > Integrasi & database**. Data demo dapat dicadangkan atau direset dari halaman yang sama.

## Google Apps Script

Paket deployment lengkap ada di `public/google-apps-script/`:

- `Code.gs` (satu-satunya file backend: inti + CRM + workspace + proposal)
- `Index.html`
- `js_main.html`
- `js_customer.html`
- `js_crm.html`
- `js_operations.html`
- `js_letters.html`
- `js_workspace.html`
- `js_proposal.html`
- `js_bulk.html`
- `css_main.html`
- `appsscript.json`
- `README.md`

Frontend GAS menggunakan HTML, Vanilla JavaScript, dan Tailwind CDN, tanpa React build. Backend menginisialisasi dua belas sheet (termasuk `Proposals`), menyediakan CRUD berelasi, menghitung ulang keuangan, dan memverifikasi akses Google. Seluruh fungsi server berada di satu file `Code.gs` sehingga deployment tidak lagi gagal karena file `Crm.gs`/`Workspace.gs` tertinggal (penyebab error `loadWorkspaceLogo_ is not defined`). Panduan pemasangan, skema, aturan fee, keterbatasan, dan checklist uji tersedia di `public/google-apps-script/README.md`.

## Pembaruan Form Debitur

Form debitur mencakup nomor kontrak, nama, kabupaten/kota, kecamatan, kelurahan/desa, alamat lengkap, tanggal jatuh tempo, foto KTP/STNK, angsuran, total angsuran, denda, nomor handphone, merk/type, dan nomor polisi. Total tetap mengikuti perhitungan sebelumnya: angsuran + denda. Ditambahkan pula **Sudah Dibayar** dan **Total Angsuran Belum Dibayar** yang dihitung otomatis dari pembayaran pada kasus debitur; nilai ini juga tampil pada tabel, detail, dan ekspor CSV debitur.

Pilihan wilayah hanya menampilkan **Kabupaten Banyumas, Purbalingga, Cilacap, dan Banjarnegara** lengkap dengan seluruh kecamatannya. Data kecamatan disertakan langsung di aplikasi (statis), sehingga tidak bergantung pada jaringan dan form langsung siap digunakan; input manual tetap tersedia. Foto JPG/PNG/WebP maksimal 2 MB disimpan ke IndexedDB pada demo dan ke folder privat Google Drive pada GAS. Cadangan JSON demo hanya berisi metadata; unduh foto secara terpisah dari detail debitur sebelum reset.

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

Form penugasan dilengkapi **payload surat otomatis** yang disusun seluruhnya dari database: identitas debitur (nama, NIK, kontrak, telepon, pekerjaan, kontak darurat, alamat domisili), kendaraan jaminan, kreditur/klien, identitas agensi, dan **mitra DC sebagai penagih** (nama, NIK, jabatan, jenis personel, rekening). Dropdown petugas menampilkan Mitra DC lebih dahulu. Tidak ada isian surat yang perlu diketik ulang.

Blok **Rincian angsuran debitur** pada form dan panel payload diisi otomatis dari data debitur serta pembayaran kasusnya: **Angsuran / bulan**, **Angsuran belum dibayar** (total angsuran dikurangi akumulasi pembayaran, lengkap dengan perkiraan banyaknya angsuran), **Denda**, **Tanggal jatuh tempo terakhir pembayaran**, dan **Jumlah hari keterlambatan** terhadap tanggal hari ini (Asia/Jakarta). Nilai berubah sendiri saat data debitur atau pembayaran diperbarui.

Panel **Payload Surat & PDF (Otomatis)** menampilkan seluruh sumber data per kelompok, daftar isian yang masih perlu diperiksa, pratinjau dokumen A4, serta tombol **Cetak / Simpan PDF** (dialog cetak browser), **Salin Payload JSON**, **Unduh JSON**, dan **Generator Eksternal**. Payload memakai versi `arms.letter-payload/1`; blok `suratTugas` memakai nama field generator eksternal sehingga dapat ditempel apa adanya ke sana. Saat **Simpan Penugasan**, payload ikut disimpan pada kolom `Generator Data` sheet SK (maksimal 60.000 karakter, divalidasi sebagai objek JSON di frontend maupun backend).

Simpan penugasan terlebih dahulu, buat surat di generator eksternal atau cetak langsung dari ARMS, lalu unggah dokumen final melalui form **Upload PDF Surat Tugas / Kuasa** di bawahnya. PDF maksimal 5 MB, diperiksa ekstensi, MIME, ukuran, header PDF, dan penanda akhir dokumen. PDF dapat diganti atau diunduh dari halaman penugasan, tabel surat, dan detail surat.

Versi demo menyimpan file PDF di IndexedDB pada browser. Versi GAS menyimpan file di folder Google Drive terbatas dan metadata di sheet SK. Nomor penugasan tidak berubah saat PDF diunggah. File lama hanya dibersihkan setelah unggahan baru tersimpan. Relasi kasus dan petugas tidak dapat diganti jika SK sudah memiliki PDF atau laporan.

Pengunggahan memakai ID request dan pemeriksaan referensi PDF sebelumnya untuk menghindari duplikasi atau penggantian dokumen yang sudah berubah. Kolom Generator Data kini dipakai untuk menyimpan payload surat otomatis; nilai lama tetap terbaca dan tidak dihapus saat payload baru kosong. Pemeriksaan PDF merupakan validasi format dasar, bukan antivirus atau verifikasi keabsahan isi surat.

## Impor, Branding, Dan Tim

- Tombol **Import Bulk Debitor** tersedia pada menu Debitur. Template `.xlsx`, pembacaan `.xlsx`/`.csv`, validasi seluruh baris, dan unduh error tersedia. Maksimal 5 MB / 300 baris. Tidak menimpa data lama.
- Kontrak, telepon, dan NIK harus berupa teks agar angka nol awal tidak hilang. Formula ditolak. Total dihitung ulang dan diperiksa. Impor GAS menulis satu rentang setelah semua baris valid, dengan Script Lock dan ID batch untuk mencegah retry duplikat.
- Pengaturan memakai satu workspace tunggal. Tombol **Upload Logo** menerima PNG/JPG/WebP maksimal 2 MB, dan blok **Kop surat perusahaan** menerima banner kop (disarankan lebar 1600 px, maks. 1 MB) yang dipakai pada cover proposal serta dokumen cetak. Nama perusahaan tampil di samping logo. Logo tidak dikirim otomatis ke generator eksternal.
- Tim & Mitra memiliki posisi/jabatan, NIK opsional, Upload KTP, dan Upload SPPI (opsional). Kedua dokumen dapat diunduh dari tabel maupun detail personel. Nama pada dropdown tidak diberi akhiran Mitra DC. Jenis personel tetap dipertahankan pada data untuk kompatibilitas.
- Register Client / Pemberi Kuasa menggunakan dua bagian dengan tinggi terbatas viewport, body scroll, serta header/footer tetap terlihat.

## Proposal Kerja Sama

Menu **Proposal** menyusun proposal kerja sama yang dapat diedit per halaman dan disimpan pada sheet `Proposals` (satu baris = satu proposal, isi halaman berupa JSON).

- Template awal mengikuti contoh proposal jasa penagihan: cover, surat permohonan, company profile, daftar isi, BAB 1-9 (ringkasan eksekutif, profil, latar belakang, ruang lingkup, infrastruktur, kepatuhan, struktur tim & SDM, skema imbal jasa, penutup).
- Setiap halaman dapat dipilih, diedit, ditambah, diduplikasi, dipindahkan, atau dihapus. Isi halaman disusun dari blok: kop surat, judul bagian, paragraf, daftar butir, tabel label-nilai, tabel, Tim & Mitra DC, dan tanda tangan.
- Blok **Tim & Mitra DC** menampilkan data mitra (nama, jabatan, jenis personel, NIK opsional, rekening) beserta foto KTP dan foto sertifikat SPPI yang diambil dari Google Drive melalui menu Tim & Mitra.
- Token teks tersedia di seluruh isian: `{agensi}`, `{klien}`, `{nomor}`, `{kota}`, `{tanggal}`, `{penandatangan}`, `{jabatan}`, `{kontak}`, `{telepon}`, `{email}`, `{alamat}`.
- Kop surat dicetak penuh pada bagian atas cover, melewati batas margin kertas (full bleed) seperti contoh proposal. Bila kop belum diunggah, aplikasi mencetak kop teks otomatis dari identitas workspace.
- Pratinjau kertas A4 tersedia di samping editor; tombol **Cetak / Simpan PDF** memakai dialog cetak browser (pilih "Save as PDF", ukuran A4, margin default/None).

## Reminder SK

Dashboard menampilkan reminder untuk SK aktif: belum ada laporan, laporan perlu diperbarui, masa berlaku habis, atau kasus selesai tetapi SK masih aktif. Interval awal 3 hari dapat diubah menjadi 1-30 hari pada Pengaturan. Gunakan **Buat laporan** untuk Collections Log yang terhubung ke SK, atau **Update SK** untuk status/catatan. Perhitungan memakai tanggal hari ini (Asia/Jakarta), bukan filter grafik dashboard. Tidak mengirim notifikasi WhatsApp/email otomatis.

Untuk memperbarui GAS lama: salin `Code.gs` baru, **hapus file `Crm.gs` dan `Workspace.gs`** dari proyek (isinya sudah digabung), tambahkan file HTML `js_proposal`, lalu perbarui `Index.html`, `js_main.html`, `js_workspace.html`, dan `css_main.html`. Struktur sheet diperbarui otomatis saat aplikasi dibuka (kolom `Foto SPPI`/`Nama File SPPI` pada Personnel dan sheet `Proposals` ditambahkan di ujung, data lama tidak dihapus); menjalankan `initializeDatabase()` sekali lagi tetap disarankan.

Cadangan JSON/CSV hanya berisi metadata, bukan file PDF atau foto. Unduh dokumen sebelum reset demo atau menghapus data browser. Unggahan PDF tidak mengubah status penugasan atau menandai reminder laporan sebagai selesai.

## Kecepatan Simpan

- Mode demo tidak lagi menunda penyimpanan secara buatan (delay 450/350 ms dihapus); data langsung divalidasi dan ditulis ke penyimpanan lokal.
- Mode GAS tidak memuat ulang seluruh workspace setelah setiap simpan. Record dari server langsung digabungkan ke state lokal dan relasi (principal case, status pembayaran, status kasus) disinkronkan ulang setempat; tombol **Muat Ulang Data** tetap tersedia untuk sinkronisasi penuh.
- Backend `Code.gs` menyinkronkan hanya record yang berubah (kasus debitur terkait, satu kasus, atau satu pembayaran) alih-alih memindai seluruh tabel, dan menyingkat `SpreadsheetApp.flush()` menjadi sekali per penyimpanan.
- Daftar kabupaten/kecamatan kini statis sehingga form wilayah terbuka tanpa menunggu jaringan.

## Validasi

Validasi dilakukan pada form, lapisan penyimpanan, dan backend GAS: kode duplikat, relasi tidak ditemukan, tanggal tidak valid, riwayat kasus yang sudah terikat, nominal, pembagian fee, serta kuitansi ganda untuk log. Mutasi GAS menggunakan Script Lock. Jika server mengonfirmasi penyimpanan namun refresh gagal, ID hasil simpan dipertahankan untuk mencegah retry membuat baris baru.

Fungsi admin `validateWorkspace()` pada `Code.gs` menjalankan audit read-only relasi, kode klien, perhitungan tunggakan, pembagian fee, kelengkapan dokumen mitra (KTP/SPPI), dan integritas halaman proposal. Hasil berisi `valid`, `checkedRecords`, dan daftar `issues`; tidak mengubah data. Jalankan setelah migrasi sebelum menggunakan data operasional. Pengujian langsung GAS membutuhkan deployment di akun Google Anda.

Build produksi menggunakan script proyek `npm run build`. Runtime GAS, otorisasi akun, dan pencetakan fisik perlu diverifikasi setelah deployment di akun pengguna.