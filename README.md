# Prime Siege — Pertahanan Faktor (V13)

Permainan strategi matematik untuk murid Tingkatan 1. Pemain mempertahankan meriam dengan memilih faktor perdana yang tepat untuk menewaskan raksasa nombor.

## Kemas kini V9
- Semua teks antara muka, arahan, butang, label, nama raksasa dan paparan keputusan menggunakan Bahasa Melayu.
- Kelajuan pergerakan raksasa ditingkatkan untuk semua tahap kesukaran. Kelajuan turut meningkat mengikut aras dan apabila pemain membuat tembakan yang salah.
- Animasi raksasa ditambah baik menjadi kitaran larian: langkah kaki berselang-seli dengan jarak hayunan lebih luas, hayunan tangan bertentangan, lantunan badan dan condongan ketika berlari.
- Muzik latar perang sinematik asli dijana melalui Web Audio API, dengan lapisan bunyi seakan-akan alat muzik bertali dan loyang, rentak dram medan serta dentuman timpani. Muzik ini bukan rakaman atau lagu daripada filem tertentu.
- Kesan bunyi permainan, ngauman raksasa, tembakan dan letupan meriam dikekalkan.

## Cara menjalankan permainan
1. Ekstrak fail ZIP.
2. Buka `index.html` menggunakan pelayar moden seperti Chrome, Edge atau Firefox.
3. Masukkan nama pemain dan pilih tahap kesukaran.
4. Tekan **MULA MISI**. Muzik dan kesan bunyi akan bermula selepas interaksi pertama dengan permainan, tertakluk pada tetapan audio pelayar.
5. Pilih peluru nombor perdana yang membahagi nombor raksasa semasa dengan tepat. Peluru pengalih perhatian tidak perlu digunakan.

## Tahap kesukaran
- **Rendah:** raksasa bergerak lebih perlahan berbanding tahap lain, tetapi lebih pantas berbanding versi terdahulu.
- **Sederhana:** raksasa bergerak lebih pantas dan semakin laju mengikut aras.
- **Tinggi:** raksasa bergerak paling pantas dan memerlukan tindak balas yang cepat.

## Rekod skor
Carta kedudukan disimpan secara setempat pada pelayar/peranti menggunakan `localStorage`. Rekod tidak disegerakkan secara automatik antara peranti atau pelayar.


## Kemas kini V13
- Kelajuan pergerakan raksasa diperlahankan lagi kira-kira 10% berbanding V12 untuk semua tahap kesukaran. Pecutan akibat tembakan salah dikekalkan.
- Bermula aras 5, setiap gelombang mengandungi lebih daripada satu raksasa. Bilangan meningkat mengikut aras sehingga lima raksasa.
- Setiap raksasa mempunyai nombor dan nama tersendiri yang dipaparkan di atas/bawah model raksasa.
- Meriam menerima bekalan peluru faktor perdana yang dikira daripada pemfaktoran semua nombor dalam gelombang. Peluru yang betul digunakan pada raksasa aktif; baki bekalan mencukupi untuk menewaskan semua raksasa tanpa mengisi semula antara sasaran.
- Raksasa seterusnya mengambil giliran sebagai sasaran selepas raksasa sebelumnya ditewaskan.


## PRIME SIEGE V14
- Kelajuan raksasa dipulihkan kepada tetapan asal V9 bagi semua tahap, termasuk pecutan selepas tembakan salah.
- Visual bandar dipertingkatkan dengan bangunan runtuh, jambatan rosak, kenderaan musnah, asap, api, debu dan lampu pencarian.
- Meriam diberi perincian perisai, kesan haba muncung dan animasi recoil ketika menembak.
- Raksasa diberi kontras tekstur, bayang anggota badan dan kesan mata/serangan yang lebih jelas.
- Mengekalkan sistem nombor unik setiap raksasa serta bekalan peluru mencukupi daripada V13.
