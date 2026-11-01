# Kimya Lab

Bileşiklerin yaygın adları ve element sınıfları için ezber testi. Sunucu ya da hesap gerektirmez; telefonda "Ana ekrana ekle" ile uygulama gibi açılır, internet olmadan da çalışır.

## Neler var

- **Bileşikler:** formül → yaygın ad, yaygın ad → formül ya da karışık. Yanlış şıklar karışan gruplardan seçilir (sönmüş kireç / sönmemiş kireç / kireç taşı gibi).
- **Element sınıfları:** sembol verilir, şıklar hep aynı yerde: Metal, Yarı metal, Ametal, Soygaz. Cevaptan sonra mini periyodik tabloda yeri görünür.
- **Ayarlar:** soru sayısı (10, 20, hepsi), süre (kapalı, 10, 20, 30 sn), element adını gizleme (zor mod).
- **Akıllı tekrar:** yanlış yapılan soru 3 soru sonra tekrar gelir; çok yanlış yapılanlar ve uzun süredir sorulmayanlar daha sık çıkar.
- **Kayıtlar:** her bileşik ve element için doğru/yanlış sayısı, en çok neyle karıştırıldığı, test geçmişi. "Zayıflarım" butonu sadece yanlış yapılanları sorar.
- **Liste:** karışan bileşikler gruplar halinde, elementler renkli periyodik tabloda.
- Bilgisayarda 1–4 tuşları şık seçer, Enter devam ettirir.

## Bilgisayarda açmak

`index.html` dosyasına çift tıklamak yeterli. Uygulama gibi kurma ve internetsiz çalışma sadece site bir adresten açıldığında (yayında ya da yerel sunucuda) devreye girer:

```bash
python -m http.server 5173
```

Sonra tarayıcıda `http://localhost:5173` adresini aç.

## Listeyi düzenlemek

Her şey `js/data.js` içinde:

- Yeni bileşik: `COMPOUNDS` listesine `["NaNO3", "Şili güherçilesi", "no3"]` gibi bir satır. Üçüncü alan karıştığı gruplar; boş bırakılabilir (`""`).
- Element çıkarmak ya da eklemek: `ELEMENTS` listesindeki satırı sil ya da ekle (sembol, ad, sınıf, atom no, kütle).
- İpuçları `HINTS`, grup adları `FAM_NAMES` içinde.

Arayüz yazıları `js/text.js` içinde.

## Yayınlamak

Klasör olduğu gibi statik site olarak yayınlanır:

- **Netlify Drop:** app.netlify.com/drop sayfasına klasörü sürükle, link hemen çıkar.
- **GitHub Pages:** klasörü bir repoya koy, Settings → Pages → `main` dalı / kök klasör.

Dosyaları güncelledikten sonra `sw.js` içindeki `CACHE` adını bir artır (`kimyalab-v2` gibi), böylece telefonlardaki internetsiz kopya da yenilenir.

## Kayıtlar nerede durur

Telefonun tarayıcısında (localStorage). Tarayıcı verisi silinirse kayıtlar da gider. Telefon değiştirmeden önce İstatistik → **Yedekle** ile dosyaya al, yeni telefonda **Geri yükle** ile aç.

## Arkadaşa sorulacaklar

- Listede olmayan **Brom (Br)** ametal olarak eklendi. İstemezse `js/data.js` içinden satırı silmesi yeterli.
- "Karınca asiti", ders kitaplarındaki gibi **karınca asidi** diye düzeltildi.
- Göztaşı ve Kıbrıs taşı listedeki gibi CuSO₄ ve FeSO₄ olarak duruyor (kristal suyuyla CuSO₄·5H₂O ve FeSO₄·7H₂O).
