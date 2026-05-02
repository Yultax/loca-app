# LOCA — Cave2Cloud Smart Potato Storage Intelligence
**Master Spec v2.0 — Domain-Rich**
*Kapadokya Hackathon 2026 — Cave2Cloud teması*

---

## 0. Bu Dosya Hakkında

Bu dosya projenin tek doğru kaynağıdır. v1 teknik iskelete odaklanmıştı — bu sürüm domain feature'larını öne çıkarıyor, çünkü jüriyi etkileyecek olan Claude Code'un yazdığı temiz TypeScript değil, sistemin **ne çözdüğü**. Teknik bölümler dosyanın 2. yarısında.

**Kullanım:** Repoda `docs/SPEC.md` olarak duracak. Claude Code başlatıldığında ilk komut "`docs/SPEC.md`'yi oku, Phase 1'i implement et" olacak.

---

## 1. Vizyon ve Pozisyonlama

### One-liner (TR)
**LOCA**, patates depolarındaki her loca'yı sensör + görüntü işleme + AI tahmini ile izleyerek fire oranını %10-15'ten %3-5'e düşüren, satış zamanlamasını borsa verisi + döviz kuru + lojistik karbon maliyeti üçgeninde optimize eden ve havalandırmayı dış hava koşullarına göre otonom yöneten **endüstriyel zeka katmanı**.

### Cave2Cloud Bağlantısı
- **Cave**: Kapadokya yeraltı depoları (Bor, Derinkuyu, Eskil, Ürgüp). Doğa Tohumculuk 1996'da bölgenin ilk modern yeraltı depo öncüsü, bugün 6 depo / 72.140 ton kapasite.
- **Cloud**: Sensörler → realtime database → AI karar motoru → web dashboard. Yer altındaki ürünün dijital ikizini global pazara açan katman.
- **Slogan**: *"Yer altının zekası, üreticinin cebinde."*

### Hangi Tema Kategorisinde Yarışıyoruz
**Birincil:** Kategori 3 (Akıllı Tedarik Zinciri Sistemleri) + Kategori 5 (Doğal Mağara Yaşam ve Depolama Alanları İçin Akıllı Çözümler)
**İkincil bağ:** Kategori 1 (Dijital İhracat) — CBAM uyumlu karbon raporu sayesinde AB ihracatı.

### Etki Hipotezi
Türkiye'de yıllık ~5 milyon ton patates üretiliyor; Niğde-Nevşehir hattı bunun %44'ünü temsil ediyor. Sektör ortalaması fire %10-15. **%5'lik bir fire azalması = ~110.000 ton/yıl, 2 milyar TL+ ekonomik kurtarma** + ihracatta CBAM uyumu için karbon karnesi avantajı.

---

## 2. Hero User Stories (Demo'da Görülecek)

Bunlar jüriye anlatılacak ana akışlar. Her biri için gerçek bir UI durumu hazırlanacak.

### US-1: Sat-veya-Bekle Karar Asistanı (HERO FEATURE)

**Kullanıcı:** Niğde'de 8000 ton kapasiteli depo işleten Mehmet Yılmaz.

**Senaryo:** Mehmet sabah dashboard'a girer. Loca A3'te 14 ton Lady Rosetta (cipslik) var, 73 gündür depoda. Sistem ona şunu gösterir:

> 🤖 LOCA Tavsiyesi: **ŞİMDİ SAT** (Doğa Frost Aksaray)
>
> **Şimdi sat:** 14 ton × 0.62 € = 8.680 € → 328.380 ₺ (TCMB EUR/TRY: 37.82, son güncelleme 14:23)
> **14 gün bekle:** Tahmini fiyat +%3 = 0.638 € ama fire +%5.6 → net 8.435 € = 318.700 ₺ (**−2.96%**)
> **7 gün bekle:** +%1.4 fiyat, +%2.8 fire → net **−1.42%**
>
> Sebep: Lady Rosetta dormancy süresi 110 gün, kalan 37 gün. Loca CO₂ trendi son 48 saatte +%18 (filizlenme erken sinyali). Sıcaklık ortalaması 9.2°C, sprout-trigger eşiği 11°C — hala güvenli ama sınırlanan zaman.
>
> **Lojistik karbon:** Aksaray Doğa Frost tesisine 45.1 km × 14 ton × 0.100 = 63.1 kg CO₂ → CBAM gölge fiyat 5.05 € (191 ₺).

Mehmet "Şimdi Sat" butonuna basar → otomatik teklif PDF'i oluşturulur (mock), Doğa Frost satış temsilcisine gönderim simüle edilir.

### US-2: Otonom Havalandırma + Dış Hava Koşulu

**Senaryo:** Loca A7'de sıcaklık 11.2°C'ye fırladı (Lady Rosetta için sprout-trigger eşiği). Klasik sistem otomatik kepenk açar. **LOCA daha akıllı**:

1. Önce dış hava verisini çeker (Open-Meteo API, ücretsiz, key gerektirmez): Nevşehir şu an 6.4°C, %62 nem, rüzgar 8 km/s.
2. **Karar matrisi:**
   - Dış sıcaklık < iç sıcaklık − 2°C? ✅ (4.8°C fark)
   - Dış nem < iç nem? ✅ (depo %91, dış %62 → iç nem korunur)
   - Yağış var mı? ❌ → kepenk açılabilir
3. Kepenk röle sinyali gönderilir (mock röle, gerçek sistemde Modbus/RS485).
4. 18 dakika sonra Loca A7 sıcaklığı 8.4°C'ye iner, kepenk kapatılır.

Eğer dış hava +14°C olsaydı sistem **kepenk açmaz**, onun yerine "İçeriden hava daha soğuk, dışarısı sıcak. Kepenk kapalı tutulacak. Alternatif: chiller devreye al." önerisi yapardı.

**Demo'da:** Bir butonla anomali tetikle → hava verisi çekilir → karar matrisi ekranda görünür → animasyon → sıcaklık düşer.

### US-3: Ürün-Depo Uygunluk Denetçisi (Cross-Product Storage)

**Senaryo:** Mehmet'in 3 deposu var. Eskil deposunun 2 lokası boşaldı, içine limon koymayı düşünüyor. LOCA uyarı verir:

> ⚠️ **Uygunsuz Depolama Önerisi**
>
> Eskil-Loca-B2: Son 6 ay boyunca patates depolandı.
>
> **Sorun:** Patates etilen gazı yayar. Etilen birikimi limonun sararma/olgunlaşma sürecini hızlandırır ve raf ömrünü %30-40 düşürür. Loca'da ortalama 12 ppb etilen rezidüsü ölçüldü.
>
> **Öneri:** Bu loca'yı limon yerine **kuru bakliyat (nohut, mercimek)** veya **aynı patates sezonu** için kullanın. Limon depolamak istiyorsanız Bor-Loca-C1 (etilen rezidüsü <2 ppb) uygundur.
>
> [Detaylı Kontrol Et] [Bor-C1'i Rezerve Et]

Bu özellik LOCA'yı sıradan bir depo monitoring uygulamasından **ürün-depo uygunluk istihbaratı**na taşıyor — jüri için yenilikçilik puanı.

### US-4: Sözleşmeli Ekim Akışı (Doğa Frost / Doğa Tohumculuk modeli)

**Senaryo:** Doğa Tohumculuk yazılımı kendi sözleşmeli çiftçi ağında kullanır:

1. **Tohum dağıtımı:** 5 çiftçiye Lady Rosetta tohumu verildi (Mart 2026). Sistemde her çiftçinin koordinatı + ekilen alan kayıtlı.
2. **Hasat planlaması:** Eylül 2026 hasat öngörülüyor. Sistem her çiftçinin tarlasından **hangi depoya gönderilirse** karbon ayak izinin minimum olduğunu hesaplar.
3. **Gerçek dünya kararı:** Çiftçi Hasan Çelik (Aksaray, 80 hektar) → en yakın Eskil Deposu (35 km, 280 kg CO₂) **vs** Bor Deposu (165 km, 1.310 kg CO₂). Sistem Eskil'i önerir, ama Eskil'de yer yoksa karşılaştırmalı kar/zarar tablosu gösterir.
4. **Geri satın alım:** Hasattan 4 ay sonra Doğa Frost Aksaray tesisi alımı yapar — sistem buyer eşleşmesi otomatik.
5. **Karbon karnesi:** Sözleşme süresince toplam karbon ayak izi raporu (CBAM uyumu, BRC sertifikası destek dökümanı).

### US-5: Hasat Zamanı + FIFO + Loca İçi Konum Optimizasyonu

**Senaryo:** Adana'dan Ödemiş'e kadar farklı hasat zamanları var:
- Adana: yılda 2 hasat (Mayıs, Ekim)
- Niğde-Nevşehir: yılda 1 hasat (Eylül-Ekim)
- Ödemiş (İzmir): yılda 2 hasat farklı zamanda

Eğer **aynı depoda farklı hasat tarihli partiler varsa**:
1. Sistem her big-bag'in `harvestDate`'ini takip eder.
2. **FIFO görsel önerisi:** Loca planında her big-bag farklı renkte (eski hasat = kırmızıya yakın, yeni = yeşile yakın). Çıkış sırası önerilir.
3. **Loca içi konum:** Daha eski parti → koridor tarafına (kolay tahliye); yeni parti → arka duvar tarafına. Konum atama otomatik.
4. **Cipslik vs yemeklik ayrımı:** Sistem aynı locada karışık niteliği önermez — "Bu loca cipslik için ideal sıcaklık aralığında, yemeklik koymayın" uyarısı.

---

## 3. Domain Feature Listesi (Detaylı)

Aşağıdaki her feature implement edilecek veya en azından demo'da gösterilebilecek bir mock'u olacak.

### F-1: Çoklu Depo + Çoklu Loca + Çoklu Big-Bag Hiyerarşisi
- Bir kullanıcı 1-N depoya sahip olabilir (Doğa Tohumculuk: 6 depo).
- Her depo 8-20 loca içerir (gerçek dünya: bir depo ortalama 12 loca).
- Her loca 10-50 big-bag tutar (each ~1 ton).
- Her big-bag içinde 1 sensör paketi (sıcaklık + nem + CO₂ + amonyum + etilen) + 1 termal kamera + 1 RGB kamera.
- Hiyerarşik drill-down: Depo seçici → Loca grid → Big-bag listesi → Sensör + kamera detay.

### F-2: Çoklu Patates Çeşidi Veritabanı
- Sistemde 14+ çeşit kayıtlı, her birinin ayrı sıcaklık/nem/dormancy profili.
- Türkiye'de yetiştirilen ana çeşitler: Agria, Marabel, Hermes, Lady Rosetta, Granola, Marfona, Innovator, Russet Burbank, Van Gogh, Shepody, Milva.
- **Yerli çeşitler bonus puan için:** Niğde Sarısı, Saruhan, Nahita (Niğde Patates Araştırma Enstitüsü) + Doğa Tohumculuk'un çeşitleri (Zirve, Doruk, Kutup, Bahar, Volkan, Kaya, İlkmor) — bu liste CEO görüşmesinde gerçek değerlerle güncellenecek.
- Veri kaynağı: Mentörden gelen notlar + meijerpotato.com profili + Niğde Patates Araştırma Enstitüsü dökümanları + agrowy.com tablo değerleri.
- Her çeşit için: optimum sıcaklık aralığı, optimum nem, dormancy süresi, sprout-trigger sıcaklığı, kullanım amacı (seed/table/crisping/french_fry/baking), pazar fiyatı (TL/kg, mock).

### F-3: Sensör Veri Birlikte Çalışması (Multi-Sensor Fusion)
- Tek başına sıcaklık ölçmek yetersiz. Sistemde **sıcaklık + nem + CO₂ + amonyum + etilen** birlikte çalışıyor.
- **Risk skorlama mantığı:**
  ```
  fireRisk = w1×tempDeviation + w2×humidityDeviation + w3×co2Trend
           + w4×ammoniaSpike + w5×ethyleneTrend + w6×daysInStorage/dormancyDays
  ```
- Amonyum spike = patates çürümesi başlangıcı (proteinli ürün çürümesinin erken indikatörü).
- Etilen trend = filizlenme öncesi metabolik aktivite artışı.
- Demo'da: bir locada amonyum 5 ppm'den 18 ppm'e çıkıyor → fire risk skoru 23'ten 67'ye fırlar → "Kritik" alarm.

### F-4: Görüntü İşleme — Filiz + Toprak + Boyut Tespiti
**Strateji:** 24 saatte gerçek YOLO train edilmeyecek (intihar). Bunun yerine:
- 6-8 statik patates fotoğrafı önceden hazırlanır (filiz var/yok karışık)
- Bounding box overlay'leri **CSS ile** çizilir, ML çıktısı taklit edilir
- Modal'da "Tespit edildi: 12 patates, 3 filiz başlangıcı, %4 toprak rezidüsü, 2 buruz işareti, ortalama boy 52mm" gibi metrikler
- Termal kamera mock: aynı görselin filtre uygulanmış versiyonu (CSS `hue-rotate`)
- "Bu modülün gerçek implementasyonu YOLOv8 + custom dataset (Niğde-Nevşehir bölgesinden 2.000 etiketli görüntü) ile yapılacaktır" — bu cümle README'de ve sunumda.

### F-5: Otonom Havalandırma Kontrolü + Dış Hava
- **Open-Meteo API** (ücretsiz, key gerektirmez) ile real-time dış hava verisi: sıcaklık, nem, rüzgar, yağış.
- **Karar matrisi (`lib/ventilation-decision.ts`):**
  ```
  if (içSıcaklık > sproutTriggerTemp - 1) {
    if (dışSıcaklık < içSıcaklık - 2 && !yağış && dışNem < içNem + 5) {
      → kepenk_aç(targetTemp)
    } else if (chillerVar) {
      → chiller_devrede()
    } else {
      → uyarı("Doğal havalandırma uygun değil, manuel müdahale gerekli")
    }
  }
  ```
- Kepenk açıldıktan sonra hedef sıcaklığa ulaşana kadar her 30 saniyede bir koşullar yeniden değerlendirilir.
- **Action log:** `actions` tablosuna her otomatik karar yazılır → izlenebilirlik, BRC/ISO uyumluluk için kritik.

### F-6: Sat-veya-Bekle Karar Motoru (HERO)
- **Girdi:** loca seçili, içeriği (variety, ton, days in storage, fire risk skoru), dönüş senaryoları (now / 7d / 14d).
- **İşlem:**
  1. Mevcut piyasa fiyatı (mock borsa verisi: 5 hal × günlük fiyat)
  2. Fiyat tahmin modeli: variety-specific seasonality (Hasat sonrası 2 ay düşük, Mart-Mayıs zirve, Haziran-Eylül yeni hasat baskısı düşer)
  3. Fire artış tahmini: günlük %0.4 baseline + risk skoru çarpanı
  4. Lojistik karbon (US-1'deki gibi)
  5. **Döviz dönüşümü:** alıcı EUR ile ödüyorsa, EUR/TRY trendi de hesaba katılır → "EUR güçleniyor, 14 gün beklemenin döviz kazancı +%1.2 olabilir, ama fire kaybı bunu yutuyor"
- **Çıktı:** Net kar tablosu + AI reasoning bullet list + tek tıkla teklif gönderimi (mock).

### F-7: Lojistik Optimize + Bonus Zincir (Kural 1+2+3)
- **Akış:** Çiftçi tarlasından depoya + depodan alıcıya iki bağımsız rota.
- Her rota için:
  - Nominatim ile geocoding (alıcı adres → koordinat)
  - OpenRouteService ile kara rota (HGV profili = TIR)
  - Mesafe × ağırlık × 0.100 = kg CO₂
  - **Toprak yüzdesi etkisi:** Eğer big-bag'lerde %5+ toprak rezidüsü tespit edildiyse, "boşa taşınan toprak" ekstra CO₂ olarak gösterilir
  - CBAM gölge fiyat (80 €/ton CO₂) → EUR maliyet
  - TCMB EUR/TRY canlı kur → TL karşılığı
- **Bonus:** Jüri "Kuralları zincirleyin" istiyor; sistem tek bir "Sevkiyat Yap" tıklamasında üç kuralı sırayla tetikleyip ekranda animasyonla gösterir.

### F-8: Cross-Product Storage Uygunluğu
- Her loca için "**residue profile**": son N ay hangi ürün depolandı, hangi gaz/madde rezidüleri tespit edildi.
- Ürün eşleşme matrisi:

  | Önceki ürün | Sonraki ürün | Uygun mu | Sebep |
  |---|---|---|---|
  | Patates | Limon | ❌ | Etilen birikimi, raf ömrü -%30 |
  | Patates | Soğan | ⚠️ | Karşılıklı koku transferi |
  | Patates | Patates (farklı çeşit) | ✅ | Sıcaklık aralığı eşleşmeli |
  | Patates | Kuru bakliyat | ✅ | Etilen toleransı yüksek |
  | Patates | Elma | ❌ | Etilen + nem uyuşmazlığı |
  | Limon | Patates | ⚠️ | Sıcaklık aralığı farkı (limon 12-15°C) |

- Demo'da: kullanıcı "Yeni ürün ekle" → ürün seçer → uygunluk kontrolü çalışır → uyarı veya yeşil ışık.

### F-9: FIFO + Loca İçi Konum Optimizasyonu
- Her big-bag'in `position`'u var: `{ row, col, distanceFromCorridor }`.
- Yeni big-bag eklendiğinde sistem önerir:
  - Eski hasat parti varsa **arka tarafa** (yeni big-bag koridor tarafına)
  - Sıcaklık olarak sensitive variety varsa **havalandırma akışına en yakın yere**
  - Ağır big-bag'ler **alta**, hafif olanlar üste (max 3 sıra istif)
- Visualization: Loca'ya tıklanınca büyütülmüş 2D plan, big-bag'ler kutu olarak görünür, FIFO sırası ok ile gösterilir.

### F-10: Karbon Karnesi (CBAM Uyumu)
- Her sözleşmeli ekim partisinin "doğum-mezar" karbon raporu:
  - Tohum ekimi → tarla işlemleri (mock: hektar başına 220 kg CO₂)
  - Hasat → depo (gerçek API)
  - Depolama (kWh × elektrik şebekesi karbon yoğunluğu) (mock)
  - Depo → işleme tesisi (gerçek API)
- PDF export butonu (kütüphane: `@react-pdf/renderer`).
- Bu özellik AB ihracatı için CBAM uyumlu; jüri için "gerçek dünya etkisi" puanını artırır.

---

## 4. Üç Zorunlu Kuralın Bağlantı Noktaları

| Kural | Nerede Çalışıyor | Nasıl Tetikleniyor |
|---|---|---|
| 🌍 Kural 1 — Karbon | F-7 lojistik motoru, F-10 karbon karnesi | Her sevkiyat kararında, çiftçi atamasında, depo seçiminde |
| 💱 Kural 2 — TCMB | F-6 karar motoru (EUR alıcılar için), F-7 zinciri | Status bar'da sürekli görünür, fiyat hesaplarına 60 sn cache ile akar |
| 🗺️ Kural 3 — Coğrafi | F-8 ürün-depo uygunluğu (mesafe filtre) + F-1 alıcı eşleşmesi | "En yakın 5 alıcı" / "En uygun depo" filtreleri Nominatim + ORS ile |

**Bonus zincir:** F-6 + F-7 = aynı UI flow'da üçü birden tetiklenir. Sat butonuna basınca: ORS rota → CO₂ hesabı → CBAM EUR maliyeti → TCMB ile TL → karar tablosu.

---

## 5. Ekranlar ve Kullanıcı Akışı

### Ana Dashboard (`app/page.tsx`)
3 sütunlu grid + sticky status bar.

**Status Bar:**
```
[LOCA logo] | TCMB USD/TRY: 34.51 ↑0.04 | EUR/TRY: 37.82 ↑0.11 | 14:23 |
🟢 412 sensör aktif | 36 loca izleniyor | Sistem: Optimal | [🔔 3]
```

**Sol — Depo & Loca Görünümü:**
- 5 depo tab'ı (Bor / Derinkuyu / Eskil / Doğa-1 / Doğa-2)
- Üstten görünüş, koridor ortada, sağlı sollu loca hücreleri
- Her loca: variety adı + ton + fire risk yüzdesi + status rengi
- Tıklayınca seçili `selectedLocaId` state'i değişir, orta sütun güncellenir
- Sağ üstte "Yeni Loca Ekle" butonu

**Orta — Loca Detay + Karar Paneli:**
- Üstte info: variety, ton, fill date, days in storage, dormancy kalan gün
- 3 sensör grafiği (sıcaklık + nem + CO₂/amonyum/etilen)
- Big-bag listesi (her birinin sıcaklık/nem/toprak%/filiz sayısı, tıklanınca CV mock modal)
- **Sat / Bekle Decision Panel** (Hero feature, 3 kart yan yana)
- AI reasoning bullet list

**Sağ — Harita + Karbon + Aksiyonlar:**
- Leaflet harita: çiftçi/depo/alıcı pin'leri + ORS rotası
- Carbon Chain Card (3 kuralın canlı hesabı)
- Otonom kontrol log: son 10 sistem aksiyonu (kepenk açıldı, anomali algılandı, vb.)

**Anomali toast/alert:** demo'da timer ile tetiklenir.

### Yan Sayfalar
- `/depots` — depo yönetimi, yeni depo/loca ekleme
- `/varieties` — patates çeşidi kütüphanesi, her birinin profil sayfası
- `/contracts` — sözleşmeli ekim listesi, çiftçi-buyer eşleşmeleri, karbon karnesi PDF
- `/buyers` — alıcı listesi, fiyat geçmişi, siparişler

Hackathonda yan sayfalar **bare-bones** (sadece liste + detay). Hero akışı ana dashboardda.

### Mobil/Tablet
Demo laptop'ta yapılacak. `lg:` breakpoint altında dikey stack, mobil kullanılabilir ama jüri tablet'te bakmaz büyük ihtimalle. Bu konuda 30 dakikadan fazla zaman harcanmasın.

---

## 6. Veri Modelleri

`lib/types.ts` — domain modeli.

```typescript
export type PotatoUseType = 'seed' | 'table' | 'crisping' | 'french_fry' | 'baking';
export type LocaStatus = 'optimal' | 'warning' | 'critical';
export type DecisionAction = 'sell_now' | 'hold' | 'transfer';
export type ProductType = 'potato' | 'lemon' | 'apple' | 'onion' | 'legume' | 'cheese';
export type SensorAction = 'damper_open' | 'damper_close' | 'chiller_on' | 'chiller_off' | 'alert';

export interface PotatoVariety {
  id: string;
  name: string;
  origin: 'native' | 'imported' | 'doga_seed';
  useType: PotatoUseType;
  optimalTempC: [number, number];
  optimalHumidity: [number, number];
  optimalCo2ppm: [number, number];
  dormancyDays: number;
  sproutTriggerTempC: number;
  ammoniaThresholdPpm: number;
  ethyleneThresholdPpb: number;
  marketPriceTRY: number;
  pricesByMarket: Record<string, number>;
  notes: string;
  imageUrl?: string;
}

export interface Depot {
  id: string;
  ownerId: string;
  name: string;
  city: string;
  district: string;
  coordinates: [number, number];
  capacityTon: number;
  hasChiller: boolean;
  hasDamperControl: boolean;
  locas: Loca[];
}

export interface Loca {
  id: string;
  number: string;
  depotId: string;
  varietyId: string | null;
  productType: ProductType;
  capacityTon: number;
  currentLoadTon: number;
  bigBags: BigBag[];
  status: LocaStatus;
  fireRiskScore: number;
  fillDate: string | null;
  position: { row: number; col: number; side: 'left' | 'right' };
  residueProfile: ResidueProfile;
}

export interface ResidueProfile {
  lastProducts: Array<{ productType: ProductType; emptyDate: string }>;
  ethyleneRemnant: number;
  ammoniaRemnant: number;
  cleaningDate: string | null;
}

export interface BigBag {
  id: string;
  locaId: string;
  variety: string;
  weightKg: number;
  soilPercent: number;
  harvestDate: string;
  farmerId: string;
  contractId: string | null;
  positionInLoca: { row: number; col: number; tier: number };
  sensors: SensorReading;
  cvAnalysis: CVAnalysis;
  bruiseRiskScore: number;
}

export interface SensorReading {
  tempC: number;
  humidity: number;
  co2ppm: number;
  ammoniaPpm: number;
  ethylenePpb: number;
  thermalAvgC?: number;
  lastUpdate: string;
}

export interface CVAnalysis {
  potatoCount: number;
  sproutCount: number;
  bruiseCount: number;
  soilCoverage: number;
  averageSizeMm: number;
  sizeDistribution: { seed: number; table: number; baking: number };
  imageUrl: string;
  thermalImageUrl: string;
  analysisTime: string;
}

export interface Farmer {
  id: string;
  name: string;
  farmName: string;
  city: string;
  coordinates: [number, number];
  totalAreaHectare: number;
  varieties: string[];
  contractIds: string[];
}

export interface Contract {
  id: string;
  farmerId: string;
  buyerId: string;
  varietyId: string;
  plantingDate: string;
  estimatedHarvestDate: string;
  estimatedYieldTon: number;
  pricePerKg: number;
  paymentCurrency: 'TRY' | 'EUR' | 'USD';
  carbonReportUrl?: string;
}

export interface Buyer {
  id: string;
  name: string;
  type: 'processor' | 'wholesale_market' | 'export_broker';
  city: string;
  coordinates: [number, number];
  paymentCurrency: 'TRY' | 'EUR' | 'USD';
  acceptsVarieties: string[];
  pricePerKg: number;
  pricingHistory: Array<{ date: string; price: number }>;
}

export interface CarbonChain {
  segments: Array<{
    label: string;
    origin: { name: string; coords: [number, number] };
    destination: { name: string; coords: [number, number] };
    distanceKm: number;
    weightTon: number;
    soilWasteTon?: number;
    mode: 'truck' | 'rail' | 'sea' | 'air';
    emissionFactor: number;
    co2kg: number;
  }>;
  totalCO2kg: number;
  cbamCostEUR: number;
  cbamCostTRY: number;
  fxRate: { pair: string; rate: number; updatedAt: string };
  routeGeoJSON: GeoJSON.FeatureCollection;
}

export interface SellDecision {
  locaId: string;
  variety: string;
  weightTon: number;
  recommendation: DecisionAction;
  scenarios: Array<{
    label: string;
    days: number;
    estimatedPriceTRY: number;
    estimatedPriceEUR?: number;
    fireIncreasePct: number;
    fxImpactPct: number;
    netRevenueTRY: number;
    netRevenueEUR?: number;
    deltaVsNow: number;
  }>;
  carbonChain: CarbonChain;
  aiReasoning: string[];
}

export interface VentilationDecision {
  locaId: string;
  trigger: 'temp_high' | 'co2_high' | 'humidity_high' | 'manual';
  internalConditions: SensorReading;
  externalConditions: { tempC: number; humidity: number; precipitation: boolean; windKmh: number };
  decision: SensorAction;
  reasoning: string;
  estimatedDurationMin: number;
}

export interface ProductCompatibility {
  fromProduct: ProductType;
  toProduct: ProductType;
  compatible: 'yes' | 'caution' | 'no';
  reason: string;
  alternativeAction?: string;
}
```

---

## 7. Seed Data

Patates çeşitleri (12+), depolar (5), çiftçiler (5), alıcılar (5), sözleşmeler (8). Detaylı seed data dosyaları `lib/seed/` altında. Her depo için 8-20 loca, her loca için 10-50 big-bag random generated ama deterministic seed ile (her demo'da aynı).

**Yerli + Doğa Tohumculuk çeşitleri** seed'de bulunmalı: Niğde Sarısı, Saruhan, Nahita, Zirve, Doruk. CEO görüşmesi sonrası gerçek değerlerle güncellenecek.

---

## 8. API Kontratları

### `GET /api/tcmb`
TCMB EVDS proxy. Cache 60 sn. Fallback: `tcmb.gov.tr/kurlar/today.xml`. Returns USD_TRY, EUR_TRY, updatedAt.

### `POST /api/carbon`
ORS HGV rota → ton-km × 0.100. Toprak yüzdesi ekstra CO₂ ekler. Returns CarbonChain.

### `POST /api/route-buyers`
Loca içeriğine göre uygun alıcıları bulur, mesafe + fiyat + karbon composite skor ile sıralar.

### `POST /api/decision`
3 senaryo (now/7d/14d) için fiyat tahmini + fire artışı + döviz etkisi. Returns SellDecision.

### `GET /api/weather?lat=&lng=`
Open-Meteo proxy. Cache 5 dk.

### `POST /api/ventilation-decision`
Karar matrisi. İç sensör + dış hava → kepenk/chiller/alert kararı.

### `POST /api/product-compatibility`
Loca residue profile + yeni ürün → uygunluk değerlendirmesi.

### `POST /api/carbon-report`
Sözleşme bazlı PDF karbon karnesi.

### Realtime: `sensor-updates` Supabase channel
Her 3 sn sensör verisi push.

---

## 9. Sunum Scripti (7 Dakika)

### 0:00-0:30 — Hook (Hero Video)
*Ekranda:* 20 sn mağara → depo → dashboard transition.

> "Bin yıl önce Kapadokya halkı yer altına saklandı. Bugün Türkiye'nin patates üretiminin %44'ü yeraltında saklanıyor — yıllık 2 milyon ton. Ama körce. Sektör fire %10-15. Yılda 200-300 milyon liralık patates yer altında çürüyor. Biz bunu çözüyoruz."

### 0:30-1:30 — Problem ve Pozisyonlama
Dashboard açılır, 5 depo / 72 loca / 2.847 big-bag canlı.

> "Şu an gördüğünüz 5 depoda 72 loca, 2.847 big-bag. Gerçek zamanlı sıcaklık-nem-CO₂-amonyum-etilen ölçüyor. Mentörlerimizden öğrendik: personel maliyeti yüksek, esnaf depoyu tek başına gözlüyor. Doğa Tohumculuk gibi büyükler havalandırma sistemleri kuruyor ama küçük çiftçinin lüksü yok. Biz personeli aradan çıkarıyoruz."

### 1:30-2:30 — US-3 Demo: Cross-Product Compatibility
Eskil-Loca-B2 seç → "Yeni ürün ekle" → Limon → uyarı.

> "İlk feature: bu loca patates depolamak için kullanıldı. Üretici limon koymak istiyor. Sistem dur diyor — patates etilen yayar, limonun raf ömrü %30-40 düşer. Sistem alternatif öneriyor. Bu özellik LOCA'yı sıradan monitoring uygulamasından **ürün-depo uygunluk istihbaratına** taşıyor."

### 2:30-4:00 — US-1 Demo: Sat-Bekle Karar Asistanı
Loca A3 (Lady Rosetta) seç → big-bag detay → CV modal → decision panel.

> "Asıl gücümüzü gösterelim. Lady Rosetta — Doğa Frost'un cipslik favorisi. 14 ton, 73 gündür depoda. Kameramız 12 patates analiz etti, 3 filiz, %4 toprak. Bu toprak boşa taşınmış — 1.12 ton, 8.2 kg ekstra CO₂.
>
> Karara bakalım. Üç senaryo: şimdi sat, 7 gün, 14 gün. **Üç kuralı tek zincirde** çalıştırdık. ORS ile 45.1 km. 14 ton × 0.100 = 63.1 kg CO₂. CBAM 5.05 €. TCMB EUR/TRY canlı kuruyla 191 ₺. Hardcoded değil — şu an canlı.
>
> AI tavsiyesi: ŞİMDİ SAT. Dormancy 110 gün, 37 günü kaldı. Filiz başlayınca fiyat -%15. Beklemenin döviz avantajı bunu kurtaramıyor."

### 4:00-5:00 — US-2 Demo: Otonom Havalandırma
Anomali tetikle → A7 sıcaklık fırlıyor → karar matrisi.

> "Şimdi en sevdiğimiz kısım. A7'de sıcaklık 11.2°C — sprout-trigger eşiği. Klasik sistem hemen kepenk açar. **LOCA önce dışarısıyı kontrol ediyor**. Open-Meteo'dan: Nevşehir 6.4°C, %62 nem, yağmur yok. Karar matrisi: dış sıcaklık 4.8°C düşük, dış nem iç nemi bozmaz, yağış yok. Kepenk açılır. 18 dakika sonra A7 8.4°C'ye iner.
>
> Eğer dışarısı 14°C olsaydı kepenk açılmazdı. Sistem chiller önerirdi. Bu farkı gören başka bir sistem henüz Türkiye'de yok."

### 5:00-6:00 — İş Modeli + Sözleşmeli Ekim + Kural Vurgu
`/contracts` sayfası.

> "İş modelimiz iki katmanlı: Doğa Tohumculuk gibi büyük entegre şirketlere SaaS — depo başına aylık. Küçük çiftçilere ücretsiz, çünkü onların verisi büyük şirketin sözleşmeli ekiminde değer. Karbon karnesi otomatik PDF, CBAM uyumu, BRC sertifikası destek dökümanı.
>
> Kuralları nereye koyduk? Kural 1: lib/carbon-calc.ts. Kural 2: 60 sn cache, status bar. Kural 3: alıcı eşleşmesi + cross-product filtre. Üçü Sat butonu tek tıkta zincirlenir."

### 6:00-7:00 — Q&A
Hazır cevaplar:

**S: Sensör maliyeti?**
C: Big-bag başına ~100$. Locada 30 big-bag = 3.000$. Doğa Tohumculuk büyüklüğünde ROI 6-9 ay.

**S: İnternet zayıf — nasıl?**
C: LoRaWAN gateway her depoya ~500$. Sensörler düşük güç uzun mesafe radyo, kablo gerekmez. %90 nem için IP67.

**S: Gerçek YOLO var mı?**
C: Demo'da statik mock — 24 saatte custom dataset etiketleyemezdik. Production: Niğde-Nevşehir 2.000 fotoğraflı dataset, YOLOv8 transfer learning.

**S: Doğa Tohumculuk'la görüştünüz mü?**
C: Evet. CEO Yakup Karahan ile yaptığımız görüşmede [içgörüleri buraya ekle].

**S: Karbon karnesi gerçek denetimde geçer mi?**
C: ISO 14064 mantığını taklit ediyor; tam akreditasyon için Verra/Gold Standard harici doğrulama. CBAM gölge 80 €/ton, AB 2026 başlangıç tarifesi.

---

## 10. Phases (Re-prioritized)

Her faz "MUST" / "SHOULD" / "NICE" etiketli.

### Phase 1 — Scaffold + TCMB (60 dk) [MUST]
DOD: pnpm dev, Tailwind + shadcn, Supabase bağlı, /api/tcmb canlı, status bar UI.

### Phase 2 — Domain Models + Seed (60 dk) [MUST]
DOD: Tüm interface'ler, 14+ variety + 5 depo + 5 farmer + 5 buyer + 8 contract seed Supabase'e yüklendi, simulator çalışıyor.

### Phase 3 — Depot Hierarchy + Loca Grid (90 dk) [MUST]
DOD: 5 depo geçişi, loca grid render, click → state, big-bag listesi.

### Phase 4 — Sensor Live + CV Mock (90 dk) [MUST]
DOD: 3 sensör grafiği canlı, big-bag drill-down, CV modal 6 görsel arasında geçiş.

### Phase 5 — Decision Engine + Carbon Chain (120 dk) [MUST — Hero]
DOD: /api/decision, 3 senaryo karşılaştırması, ORS rotası harita, CBAM + TCMB dönüşümü, AI reasoning.

### Phase 6 — Cross-Product Compatibility (45 dk) [SHOULD]
DOD: Yeni ürün ekleme akışı, uyarı, alternatif öneri.

### Phase 7 — Ventilation + External Weather (60 dk) [SHOULD]
DOD: Open-Meteo, karar matrisi UI, anomali tetikleme, kepenk animasyonu, action log.

### Phase 8 — Contracts + Carbon Report (60 dk) [NICE]
DOD: /contracts liste, çiftçi-buyer eşleşmesi, PDF export.

### Phase 9 — Polish + Hero Video + README (90 dk) [MUST]
DOD: Renk paleti tutarlı, hero video gömülü, README ≥500 kelime + Excalidraw diyagram, Loom 3 dk demo.

### Phase 10 — Deploy + Dry Run (45 dk) [MUST]
DOD: Vercel canlı, ENV variables, jüri linkten açabilir, sunum prova × 2.

**Toplam MUST:** 7.5 saat
**MUST + SHOULD:** 9.25 saat
**MUST + SHOULD + NICE:** 11 saat

24 saatten 11 saat aktif kod = 13 saat uyku/yemek/sunum prep/buffer.

---

## 11. Tech Stack (LOCKED)

```
Framework:    Next.js 14.2.x (App Router, TypeScript)
Styling:      Tailwind 3.4 + shadcn/ui
Map:          Leaflet 1.9 + react-leaflet 4.x  [Mapbox YASAK]
Charts:       Recharts 2.x
Database:     Supabase (Postgres + realtime)
PDF:          @react-pdf/renderer (sadece Phase 8'de)
Deploy:       Vercel
Icons:        lucide-react
Fonts:        Inter (UI) + IBM Plex Mono (data)
Package mgr:  pnpm
Node:         20.x
```

**Açık kaynak API'ler:** TCMB EVDS, Nominatim, OpenRouteService, Open-Meteo. Hiçbiri Google Maps / Mapbox / commercial değil.

---

## 12. Visual Design System

```
--cave-bg:        #1B1410   (mağara karanlığı)
--cave-card:      #2A1F18
--peri-orange:    #E97451   (peri bacası, primary CTA)
--earth-brown:    #6B4423
--cave-blue:      #3D5A8C
--cream:          #F5E6D3
--muted:          #A89684
--success:        #6FA577
--warning:        #D9A441
--danger:         #B33A3A
```

Loca grid hücrelerinde `box-shadow: inset 0 0 20px rgba(0,0,0,0.4)` — yer altı hissi.

---

## 13. Çevre Değişkenleri

```
TCMB_API_KEY=...
ORS_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE=...
# OPEN-METEO ve NOMINATIM key gerektirmez
```

---

## 14. Claude Code'un YAPMAMASI Gerekenler

- Mock data'yı production code path'ine sızdırmamak.
- TCMB veya ORS key'lerini client component'a koymamak.
- Auth ekleme (multi-owner sadece UI'da).
- i18n ekleme.
- Test yazma.
- Real ML training.
- Yeni dependency önerirken Arda'dan onay almadan eklememe.
- SPEC dışında feature scope eklemememe.

---

**END OF SPEC v2.**
