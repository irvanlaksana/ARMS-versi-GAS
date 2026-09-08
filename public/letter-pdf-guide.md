# Surat Tugas & Kuasa

1. Pilih debitur dan kasus. Dropdown **Mitra DC / petugas penagih** menampilkan Mitra DC lebih dahulu, lalu lengkapi parameter penugasan (tanggal terbit, tempat, penandatangan, perwakilan klien, masa berlaku).
2. Blok **Rincian angsuran debitur** terisi otomatis dan terkunci: angsuran per bulan, angsuran belum dibayar (beserta perkiraan banyaknya angsuran), denda, tanggal jatuh tempo terakhir, dan jumlah hari keterlambatan. Nilai diambil dari data debitur serta akumulasi pembayaran kasusnya.
3. Panel **Payload Surat & PDF (Otomatis)** merangkum seluruh sumber data (penugasan & agensi, kreditur, data debitur, rincian angsuran, kendaraan, mitra DC penagih), menandai isian yang masih kurang, dan menampilkan pratinjau dokumen A4.
4. Klik **Simpan Penugasan** untuk memperoleh nomor internal ARMS. Payload JSON ikut tersimpan pada kolom `Generator Data`.
5. Cetak dokumen dari ARMS melalui **Cetak / Simpan PDF** (pilih "Save as PDF", ukuran A4, margin None), atau gunakan **Salin Payload JSON** / **Unduh JSON** bila ingin menyusun dokumen di aplikasi lain.
6. Tautan **Generator Eksternal** / **Buka Generator Surat** membuka `https://generator-surat-new.vercel.app/` pada tab baru. Data ARMS tidak dikirim otomatis ke situs tersebut; tempel payload JSON bila diperlukan.
7. Kembali ke ARMS dan gunakan form **Upload PDF Surat Tugas / Kuasa** pada penugasan yang sesuai. Pilih PDF maksimal 5 MB, periksa nama file, lalu klik **Upload PDF Surat**. Memilih file saja belum menyimpannya.
8. Gunakan **Unduh PDF** untuk mengambil dokumen tersimpan, atau pilih PDF pengganti dan konfirmasi melalui **Ganti PDF Surat**.

Penugasan wajib disimpan sebelum unggahan. Jika parameter penugasan sedang diedit, simpan perubahan dahulu. PDF lama baru diganti setelah unggahan baru berhasil; unduh salinannya bila masih diperlukan.

Payload selalu mengikuti data terkini: memperbaiki data debitur, pembayaran, atau data mitra pada menu masing-masing langsung mengubah isi surat pada cetakan berikutnya. Perbaiki catatan "perlu diperiksa" pada panel payload sebelum mencetak agar NIK, kontrak, alamat, dan nominal tidak kosong pada dokumen.

File pada mode demo disimpan di browser. File pada GAS berada di Google Drive terbatas dan hanya diakses oleh pengguna workspace yang terotorisasi. Cadangan JSON/CSV tidak memuat isi dokumen. Validasi PDF memeriksa format dasar, bukan keabsahan hukum atau pemindaian malware.
