# Ngalam

Website pribadi statis untuk Quiz 1 EF234301 Pemrograman Web (D), Institut Teknologi Sepuluh Nopember, 2026. Berisi profil pemilik dan catatan tentang Kota Malang: sejarah, kuliner, dan tempat wisatanya.

Dibuat oleh Faeyzar Ahnaf Musyarri NRP 5025251117.

## Halaman

Website ini berupa satu halaman dengan URL terpisah untuk tiap section:

| URL | Section |
|---|---|
| `/quiz1` | Beranda |
| `/quiz1/profile` | Profil |
| `/quiz1/hometown` | Kota |
| `/quiz1/food` | Kuliner |
| `/quiz1/tourist` | Wisata |

Semua alamat di bawah `/quiz1/` dilayani oleh `quiz1/index.html` lewat aturan rewrite di `_redirects` (Netlify). Router JavaScript di `quiz1/assets/js/main.js` membaca alamat itu lalu menggulir ke section yang sesuai.

## Struktur sumber HTML

HTML ditulis terpisah per section di folder `src/`, lalu digabung menjadi `quiz1/index.html`:

```
src/index.html              kerangka halaman
src/partials/               header, footer, lightbox
src/sections/               home, profile, hometown, food, tourist
```

Setelah mengedit file di `src/`, jalankan:

```bash
node build.js
```

Netlify menjalankan perintah yang sama saat deploy (lihat `netlify.toml`).

## Menjalankan di komputer sendiri

```bash
npx netlify-cli dev
```

## Sumber data

| Fakta | Sumber |
|---|---|
| Deskripsi kuliner | [Wonderful Indonesia: 11 Makanan Khas Malang](https://www.indonesia.travel/gb/en/travel-ideas/gastronomy/makanan-khas-malang) |
| Depot Hok Lay, Bakso President, Puthu Lanang | [Kanal24: Kuliner Legendaris Malang](https://kanal24.co.id/10-kuliner-legendaris-malang-wajib-dicoba/), [Pemkot Malang: Puthu Lanang](https://malangkota.go.id/2021/03/08/puthu-lanang-jajanan-dari-celaket-melegenda-sejak-1935/) |
| Penduduk, kecamatan, ketinggian, julukan | [Wikipedia: Kota Malang](https://id.wikipedia.org/wiki/Kota_Malang) |
| Prasasti Dinoyo, Kanjuruhan, gemeente 1914 | [Pemkot Malang: Sejarah Malang](https://malangkota.go.id/sejarah-malang/) |
| Semboyan dan lambang kota | [Pemkot Malang: Makna Lambang](https://malangkota.go.id/makna-lambang/) |
| Makna warna Topeng Malangan | [Kanal24: Belajar Topeng Malangan](https://kanal24.co.id/belajar-topeng-malangan-kenali-karakter-makna-warna-hingga-pesan-kehidupan/) |
| Kayutangan Heritage | [Pikiran Rakyat: Kampung Heritage Kayutangan](https://www.pikiran-rakyat.com/gaya-hidup/pr-018904131/kampung-heritage-kayutangan-daya-tarik-jam-buka-dan-tiket-masuk) |
| Alun-Alun Tugu | [Kelurahan Sumbersari: Sejarah Alun-Alun Tugu](https://kelsumbersari.malangkota.go.id/sejarah-alun-alun-tugu-malang/) |
| Coban Rondo | [Salsa Wisata: Coban Rondo 2026](https://salsawisata.com/air-terjun-coban-rondo/), [Trip.com](https://us.trip.com/travel-guide/attraction/pujon/coban-rondo-waterfall-pujon-61237122/) |
| Gunung Bromo | [Desk Jabar: Harga Tiket Masuk Bromo 2026](https://deskjabar.pikiran-rakyat.com/gaya-hidup/pr-11310238757/harga-tiket-masuk-bromo-2026-terbaru-rincian-lengkap-untuk-wisatawan-lokal-dan-asing?page=all), [Bigtravelindo: Tiket Bromo 2026](https://bigtravelindo.com/harga-tiket-masuk-bromo-terbaru-2026/) |

