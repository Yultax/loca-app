# LOCA — Cave2Cloud Smart Potato Storage Intelligence

> *"Yer altının zekası, üreticinin cebinde."*

**Kapadokya Hackathon 2026** | Cave2Cloud — Kapadokya'dan Global Pazara

**Kategori:** Akıllı Tedarik Zinciri Sistemleri (#3) + Doğal Mağara Yaşam ve Depolama Alanları İçin Akıllı Çözümler (#5)

---

## Proje Nedir?

LOCA, Kapadokya bölgesindeki yeraltı patates depolarını sensör füzyonu, görüntü işleme ve yapay zeka tahminiyle izleyerek **fire oranını %10-15'ten %3-5'e düşürmeyi** hedefleyen endüstriyel zekâ platformudur.

Türkiye yıllık ~5 milyon ton patates üretiyor. Niğde-Nevşehir hattı bunun **%44'ünü** temsil ediyor. Sektör ortalamasında fire %10-15 arasında. **%5'lik bir fire azalması = ~110.000 ton/yıl kurtarma, 2 milyar TL+ ekonomik değer.** LOCA bu kaybı önlemek için geliştirildi.

### Problem

Yeraltında depolanan patateslerde sıcaklık, nem, CO₂ ve etilen gazlarının kontrol edilememesi sonucu:

- **Filizlenme** (dormancy süresi aşıldıktan sonra)
- **Çürüme** (amonyak spike'ları ile erken tespit edilebilir)
- **Cipslik kalite kaybı** (şeker birikimiyle renk bozulması)
- **Gereksiz lojistik karbon maliyeti** (toprak rezidüsü %4-7 boşa taşınır)

Bu sorunlar üretici için gelir kaybı, ihracatçı için CBAM uyumsuzluğu, tüketici için fiyat artışı anlamına gelir.

### Çözüm

LOCA, depo içerisindeki her bir **loca** (bölme) ve **big-bag** (1 tonluk çuval) için:

1. **5 farklı sensör verisi** birlikte analiz eder (sıcaklık + nem + CO₂ + amonyak + etilen)
2. **Bilgisayarlı görü** ile filiz, çürük ve toprak tespiti yapar
3. **AI karar motoru** ile sat-veya-bekle önerisi sunar (fiyat tahmini + fire riski + döviz etkisi)
4. **Otonom havalandırma** kararını dış hava koşullarına göre verir
5. **Karbon ayak izi** hesaplayarak CBAM (AB Karbon Sınır Mekanizması) uyumu sağlar
6. **Ürün-depo uygunluk denetimi** ile farklı ürünlerin aynı locada depolanıp depolanamayacağını kontrol eder

---

## Kullanıcı Profili: Mehmet Yılmaz

**Kim:** Niğde'de 8.000 ton kapasiteli yeraltı deposu işleten patates üreticisi ve depo işletmecisi.

**Günlük hayatı:** Her sabah depolarını gezmek için 2 saat harcıyor. 64 loca'yı tek tek kontrol etmesi imkânsız. Termometre ve hygrometreler var ama veriyi birleştiren bir sistem yok. Havalandırma kararlarını "hissederek" veriyor. Satış zamanlamasını pazardaki duyumlara göre yapıyor.

**LOCA ile ne değişiyor:**

- Sabah dashboard'u açıyor: 5 depo, 64 loca, ~2.800 big-bag canlı izleniyor
- Loca A3'te 14 ton Lady Rosetta 73 gündür depoda. Sistem "ŞİMDİ SAT" diyor — dormancy süresi bitiyor, filizlenme sinyalleri var
- 3 senaryo karşılaştırması görüyor: şimdi sat = 328.380 ₺, 7 gün bekle = -%1.42, 14 gün bekle = -%2.96
- Tek tıkla Doğa Frost'a teklif gönderiyor. Karbon raporuyla birlikte
- Gece sıcaklık fırladığında sistem otomatik kepenk açıyor — ama önce dışarının sıcaklığını kontrol ediyor

**Mehmet'in kazancı:** Yılda ~200.000 ₺ fire tasarrufu + 40 saat/ay personel zamanı + ihracatta CBAM belge avantajı.

---

## Özellikler

### 1. Sat-veya-Bekle Karar Asistanı (Hero Feature)

Loca seçildiğinde `/api/decision` endpoint'i 3 farklı senaryo hesaplar:

| Senaryo | Hesaplama |
|---------|-----------|
| Şimdi sat | Mevcut fiyat × miktar, TCMB canlı kur, karbon maliyeti |
| 7 gün bekle | Tahmini fiyat artışı vs fire kaybı vs döviz etkisi |
| 14 gün bekle | Uzun vadeli projeksiyon, dormancy süresi riski |

Her senaryoda:
- **ORS ile gerçek TIR rotası** ve mesafe hesabı
- **CBAM maliyeti:** mesafe × ton × 0.100 kg CO₂/ton-km, 80 EUR/ton CO₂
- **TCMB canlı kur** ile EUR→TRY dönüşümü
- **AI reasoning:** Neden bu tavsiye verildiğinin Türkçe açıklaması

> Üç zorunlu kural (karbon + TCMB + coğrafi veri) tek bir "Sat" butonunda zincirlenir.

### 2. Otonom Havalandırma Kontrolü

Loca içinde sıcaklık/nem eşiği aşıldığında sistem **otomatik karar verir**:

1. Open-Meteo API ile dış hava verisini çeker (sıcaklık, nem, rüzgâr, yağış)
2. Psikrometrik hesap yapar (Magnus formülü ile mutlak nem, entalpi karşılaştırması)
3. Dış hava uygunsa kepenk açar, uygun değilse chiller/dehumidifier önerir
4. Hedef sıcaklığa ulaşılınca kepenk kapatır

**Fark:** Klasik sistemler sadece "sıcaksa aç" der. LOCA dış havayı kontrol eder — yağmur varsa kepenk açmaz, dışarısı depodan sıcaksa chiller önerir.

### 3. Ürün-Depo Uygunluk Denetçisi

Boş bir loca'ya yeni ürün atamak istendiğinde 18 kurallık uygunluk matrisi çalışır:

| Önceki | Sonraki | Sonuç | Sebep |
|--------|---------|-------|-------|
| Patates | Limon | Uygunsuz | Etilen birikimi, raf ömrü -%30 |
| Patates | Soğan | Dikkat | Karşılıklı koku transferi |
| Patates | Bakliyat | Uygun | Etilen toleransı yüksek |
| Tohum patates | Sofralık patates | Uygunsuz | Hastalık riski |

Uygunsuz durumda tüm depolardaki boş + uygun alternatif localar listelenir.

### 4. Canlı Sensör İzleme

Her loca için 3 gerçek zamanlı grafik:
- **Sıcaklık** (AreaChart, optimal aralık referans çizgisiyle)
- **Nem** (AreaChart)
- **Gazlar** (LineChart — CO₂ + NH₃ + C₂H₄)

1.5 saniyede bir güncellenir. Son 80 veri noktası görüntülenir.

**Fire risk skoru** 6 faktörün ağırlıklı ortalamasıdır:

```
fireRisk = %15 sıcaklık sapması + %10 nem sapması + %20 CO₂ trendi
         + %30 amonyak spike + %15 etilen trendi + %10 dormancy oranı
```

### 5. Bilgisayarlı Görü (CV) Modülü

Big-bag içindeki patateslerin görsel analizi:
- Patates sayısı, filiz sayısı, çürük sayısı
- Toprak rezidüsü yüzdesi
- Ortalama boy ve boyut dağılımı (tohum / sofralık / fırınlık)
- RGB + termal kamera görünümü

> **Not:** Demo'da statik mock görseller ve CSS bounding box'lar kullanılmaktadır. Production versiyonda Niğde-Nevşehir bölgesinden 2.000 etiketli görüntülük custom dataset ile YOLOv8 transfer learning yapılacaktır.

### 6. Karbon Zinciri ve CBAM

Her sevkiyat için tam karbon ayak izi:

| Taşıma Modu | Emisyon Faktörü (kg CO₂/ton-km) |
|-------------|-------------------------------|
| Kara (TIR) | 0.100 |
| Demiryolu | 0.030 |
| Deniz Yolu | 0.015 |
| Hava Kargo | 0.500 |

- OpenRouteService ile gerçek HGV (TIR) rotası
- Toprak atığı hesabı (big-bag'lerdeki toprak % boşa taşınan kütle olarak eklenir)
- CBAM gölge fiyat: 80 EUR/ton CO₂
- TCMB EUR/TRY kurla ₺ karşılığı

### 7. İzlenebilirlik Timeline'ı

Her big-bag için tarladan depoya zaman çizelgesi:

**Gübreleme** → **İlaçlama** → **Bekleme Süresi** → **Hasat** → **Depolama** → **Bugün**

Her düğüm arası gün hesabı, tr-TR tarih formatı.

---

## Zorunlu Teknik Kuralların Uygulanması

### Kural 1: Coğrafi Karbon İzi

| Nerede | Nasıl |
|--------|-------|
| `/api/carbon` | OpenRouteService API ile gerçek TIR rotası, mesafe × ton × emisyon faktörü = kg CO₂ |
| Karar paneli | Her satış senaryosunda karbon maliyeti hesaplanır |
| Harita | Leaflet üzerinde rota overlay (dashed polyline) |
| Alıcı eşleşmesi | 5 alıcı arasında mesafe + fiyat + karbon composite skor |

**Emisyon katsayıları sunumda açıklanır.** ORS başarısız olursa Haversine ×1.3 fallback.

### Kural 2: Canlı Döviz Kuru

| Nerede | Nasıl |
|--------|-------|
| Status bar | USD/TRY ve EUR/TRY 60 saniyede bir güncellenir |
| Karar motoru | EUR ödeyenler için (Doğa Frost, Hamburg Fresh) fiyat TRY'ye çevrilir |
| CBAM hesabı | Karbon maliyeti EUR → TRY |
| Kaynak göstergesi | EVDS / XML / Cache / Fallback durumu UI'da görünür |

**4 katmanlı savunma:** TCMB EVDS API → TCMB today.xml → In-memory cache → Hardcoded fallback. Hiçbir durumda çökmüyor.

**İş kararı tetiklemesi:** Döviz kuru doğrudan satış kararına etki eder — "EUR güçleniyor, beklemenin döviz kazancı +%1.2 ama fire kaybı bunu yutuyor" gibi reasoning oluşturulur.

### Kural 3: Coğrafi Veri

| Nerede | Nasıl |
|--------|-------|
| Alıcı eşleşmesi | 5 alıcı arasında mesafe bazlı sıralama (Kural 1'den bağımsız) |
| Depo seçimi | Çiftçinin tarlasına en yakın depo önerisi |
| Harita | Leaflet + CartoDB dark tile, çiftçi/depo/alıcı marker'ları |
| Ürün uygunluğu | Alternatif loca önerisinde depo mesafesi faktörü |

### Bonus: Üç Kural Tek Zincirde

Sat butonu tıklandığında sırayla:

```
ORS rota → CO₂ hesabı → CBAM EUR maliyeti → TCMB TRY dönüşümü → Karar tablosu
```

Üç kural tek bir kullanıcı aksiyonunda birleşir.

---

## Mimari

```
                          LOCA Mimari Diyagramı
 ============================================================================

  [Dış Servisler]                    [LOCA Backend]              [LOCA Frontend]
  +--------------+                 +------------------+         +------------------+
  | TCMB EVDS    |--- EUR/TRY --->|  /api/tcmb       |-------->| Status Bar       |
  | TCMB XML     |--- fallback -->|  (4 katman)      |         | Döviz göstergesi |
  +--------------+                 +------------------+         +------------------+
                                          |
  +--------------+                        v
  | Open-Meteo   |--- hava ------>| /api/ventilation  |-------->| Havalandırma     |
  | (ücretsiz)   |   verisi      |  -decision        |         | Karar Matrisi    |
  +--------------+                 +------------------+         +------------------+
                                          |
  +--------------+                        v
  | OpenRoute    |--- TIR ------->| /api/carbon       |-------->| Karbon Zinciri   |
  | Service      |   rotası      | /api/decision     |         | Karar Paneli     |
  +--------------+                | /api/route-buyers |         | Harita           |
                                   +------------------+         +------------------+
                                          |
  +--------------+                        v
  | TOBB Borsa   |--- fiyat ----->| /api/tobb-price   |-------->| Piyasa verisi    |
  | (web scrape) |                 +------------------+         +------------------+
                                          |
                                          v
                                   +------------------+
                                   | Simülatör        |-------->| Sensör Grafikleri|
                                   | (in-memory)      |         | Big-bag Detay    |
                                   +------------------+         | CV Modal         |
                                          |                     | Fire Risk Skoru  |
                                          v                     +------------------+
                                   +------------------+
                                   | Seed Data        |
                                   | 5 depo, 64 loca  |
                                   | 17 çeşit, 5 alıcı|
                                   | 5 çiftçi, 8 sözl.|
                                   +------------------+

  Veri Akışı:
  Sensör (simüle) → Simülatör → API → SWR Hook → React State → UI
  Dış API (gerçek) → API Route → Cache → SWR Hook → UI
```

---

## Veri Modeli

```
Depo (5)
 └── Loca (8-16 per depo, ~64 toplam)
      └── BigBag (10-60 per loca, ~2.800 toplam)
           ├── SensorReading (sıcaklık, nem, CO₂, amonyak, etilen)
           ├── CVAnalysis (patates sayısı, filiz, toprak %)
           └── İzlenebilirlik (gübreleme → hasat → depo)

Patates Çeşitleri (17)
 ├── İthal (11): Agria, Marabel, Hermes, Lady Rosetta, Granola,
 │   Marfona, Innovator, Russet Burbank, Van Gogh, Shepody, Milva
 ├── Yerli (3): Niğde Sarısı, Saruhan, Nahita
 └── Doğa Tohum (3): Zirve, Doruk (+ planlanan)

Her çeşit için: optimal sıcaklık [min,max], optimal nem, dormancy
süresi, sprout-trigger sıcaklığı, amonyak eşiği, etilen eşiği,
pazar fiyatı TRY/kg, kullanım amacı (tohum/sofralık/cipslik/fry)

Alıcılar (5)
 ├── Doğa Frost Aksaray (işlemci, EUR)
 ├── Niğde Hal (toptancı, TRY)
 ├── Ankara Macunköy Hal (toptancı, TRY)
 ├── İstanbul Bayrampaşa Hal (toptancı, TRY)
 └── Hamburg Fresh GmbH (ihracat broker, EUR)

Çiftçiler (5)
 ├── Hasan Çelik (Aksaray, 80 ha)
 ├── Ahmet Yıldız (Niğde, 45 ha)
 ├── Mehmet Kaya (Nevşehir, 120 ha)
 ├── Ali Demir (Niğde, 60 ha)
 └── Mustafa Öztürk (Aksaray, 35 ha)

Sözleşmeler (8): Çiftçi-alıcı eşleşmeleri, ekim-hasat tarihleri
```

---

## Depolar

| Depo | Şehir | Kapasite | Loca | Chiller | Damper |
|------|-------|----------|------|---------|--------|
| Bor Deposu | Niğde | 18.000 ton | 14 | Var | Var |
| Derinkuyu Deposu | Nevşehir | 15.000 ton | 12 | Var | Var |
| Eskil Deposu | Aksaray | 12.000 ton | 10 | Yok | Var |
| Doğa-1 Deposu | Niğde | 14.000 ton | 16 | Var | Var |
| Doğa-2 Deposu | Nevşehir | 13.140 ton | 12 | Yok | Var |

Tüm depolar gerçek Kapadokya koordinatlarıyla (Bor, Derinkuyu, Eskil) konumlandırılmıştır.

---

## Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 14.2 (App Router, TypeScript) |
| Styling | Tailwind CSS 3.4 + shadcn/ui |
| Harita | Leaflet 1.9 + react-leaflet 4.x |
| Grafikler | Recharts 3.8 |
| Data Fetching | SWR 2.4 |
| Bildirimler | Sonner 2.0 |
| İkonlar | Lucide React |
| Font | Inter (UI) + IBM Plex Mono (veri) |
| Deploy | Vercel |
| Package Manager | pnpm |

**Dış Servis Entegrasyonları (açık kaynak):**

| Servis | Amaç | API Key |
|--------|------|---------|
| TCMB EVDS | Canlı döviz kuru (USD/TRY, EUR/TRY) | Evet |
| TCMB XML | Kur fallback | Hayır |
| Open-Meteo | Dış hava durumu | Hayır |
| OpenRouteService | TIR rotası + mesafe | Evet |
| TOBB Borsa | Patates piyasa fiyatı (scrape) | Hayır |

Hiçbir ticari API (Google Maps, Mapbox vb.) kullanılmamıştır.

---

## Kurulum ve Çalıştırma

```bash
# Repoyu klonla
git clone https://github.com/<username>/loca-app.git
cd loca-app

# Bağımlılıkları yükle
pnpm install

# Ortam değişkenlerini ayarla
cp .env.example .env.local
# Aşağıdaki değerleri .env.local dosyasına ekle:
#   TCMB_API_KEY=...        (TCMB EVDS API anahtarı)
#   ORS_API_KEY=...         (OpenRouteService API anahtarı)

# Geliştirme sunucusunu başlat
pnpm dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini aç.

> **Not:** API key'ler olmadan da çalışır — TCMB XML fallback ve ORS Haversine fallback devreye girer. Tam işlevsellik için key'lerin tanımlanması önerilir.

---

## Klasör Yapısı

```
loca-app/
├── app/
│   ├── page.tsx              # Ana dashboard (3 sütunlu grid)
│   ├── layout.tsx
│   ├── globals.css           # Kapadokya tema renkleri
│   └── api/
│       ├── tcmb/             # TCMB döviz kuru (4 katman fallback)
│       ├── carbon/           # ORS rota + karbon hesabı
│       ├── decision/         # Sat-veya-bekle 3 senaryo
│       ├── weather/          # Open-Meteo dış hava
│       ├── ventilation-decision/  # Otonom havalandırma kararı
│       ├── product-compatibility/ # Ürün-depo uygunluk
│       ├── route-buyers/     # Alıcı sıralama
│       ├── simulator/        # Sensör simülasyonu
│       ├── tobb-price/       # Borsa fiyat scraper
│       └── demo/             # Anomali tetikleme
├── components/
│   ├── status-bar.tsx        # Sticky header, döviz, bildirimler
│   ├── depot-map.tsx         # Leaflet harita
│   ├── loca-detail-panel.tsx # Sensör grafikleri + big-bag listesi
│   ├── decision-panel.tsx    # 3 senaryo karar kartları
│   ├── carbon-chain-card.tsx # Karbon zinciri görselleştirme
│   ├── ventilation-control.tsx    # Havalandırma karar matrisi
│   ├── sprout-detector-modal.tsx  # CV mock modal
│   ├── product-compatibility-checker.tsx  # Uygunluk denetçisi
│   └── ui/                   # shadcn/ui bileşenler
├── lib/
│   ├── types.ts              # Tüm domain tipleri
│   ├── simulator.ts          # In-memory sensör simülasyonu
│   ├── carbon-calc.ts        # Emisyon hesaplama
│   ├── ventilation-decision.ts  # Psikrometrik karar motoru
│   ├── price-prediction.ts   # Mevsimsel fiyat tahmini
│   ├── risk-score.ts         # 6 faktörlü fire risk skoru
│   ├── compatibility-matrix.ts  # 18 kurallık uygunluk matrisi
│   └── seed/                 # Deterministik mock veri
│       ├── varieties.ts      # 17 patates çeşidi profili
│       ├── depots.ts         # 5 depo + ~64 loca + ~2.800 big-bag
│       ├── farmers.ts        # 5 çiftçi
│       ├── buyers.ts         # 5 alıcı
│       └── contracts.ts      # 8 sözleşme
├── hooks/
│   ├── use-tcmb-rate.ts      # 60s döviz polling
│   ├── use-sensor-realtime.ts # 1.5s sensör polling
│   └── use-loca-state.ts     # React Context state yönetimi
└── docs/
    └── SPEC.md               # Master specification
```

---

## Görsel Tasarım

Kapadokya mağara estetiği — generic dashboard değil, bölgesel kimlik taşıyan tema:

```
Mağara karanlığı (arka plan):   #1B1410
Kart arka planı:                #2A1F18
Peri bacası turuncusu (CTA):    #E97451
Toprak kahvesi (ikincil):       #6B4423
Mağara mavisi (bilgi):          #3D5A8C
Krem (metin):                   #F5E6D3
Başarılı (optimal):             #6FA577
Uyarı (warning):                #D9A441
Tehlike (critical):             #B33A3A
```

Özel animasyonlar: anomali banner pulse, kepenk SVG animasyonu, chiller spin, dehumidifier bounce, sensör değer geçişleri (AnimatedNumber).

---

## API Endpoints

| Endpoint | Method | Dış Servis | Durum |
|----------|--------|-----------|-------|
| `/api/tcmb` | GET | TCMB EVDS + XML | Gerçek (4 fallback) |
| `/api/weather` | POST | Open-Meteo | Gerçek |
| `/api/carbon` | POST | OpenRouteService | Gerçek (Haversine fallback) |
| `/api/decision` | POST | TCMB + ORS (dolaylı) | Hibrit |
| `/api/route-buyers` | POST | Carbon üzerinden | Hibrit |
| `/api/ventilation-decision` | POST | Open-Meteo | Hibrit |
| `/api/product-compatibility` | POST | — | Kural bazlı |
| `/api/tobb-price` | GET | TOBB HTML scrape | Kırılgan |
| `/api/simulator` | POST | — | Simülasyon |

---

## Demo Modu

Canlı demo için status bar'daki "Demo Modu" toggle'ı açılarak anomali senaryoları tetiklenebilir:

1. **Sıcaklık spike** — Loca sıcaklığı sprout-trigger eşiğine fırlar
2. **Nem spike** — Nem %97'ye çıkar
3. **CO₂ spike** — CO₂ seviyeleri fırlar
4. **Amonyak spike** — Çürüme başlangıcı sinyali

Her anomali 7 fazlı yaşam döngüsü izler:
`inactive → ramping → holding → detected → acting → recovering → resolved`

Toast bildirimler, anomali banner'ı ve action log ile tüm süreç görselleştirilir.

---

## İş Modeli

**İki katmanlı yaklaşım:**

1. **Büyük entegre şirketler (Doğa Tohumculuk gibi):** Depo başına aylık SaaS aboneliği. Tam sensör entegrasyonu, karbon karnesi, alıcı eşleştirme.

2. **Küçük çiftçiler:** Ücretsiz erişim. Çiftçilerin ürettiği depolama verisi büyük şirketlerin sözleşmeli ekim kararlarına değer katıyor — veri ekosistemi modeli.

**Gelir kaynakları:**
- SaaS abonelik (depo başına)
- Karbon karnesi raporu (CBAM uyumu için)
- Alıcı-üretici eşleştirme komisyonu

---

## Etki ve Pazar Potansiyeli

| Metrik | Değer |
|--------|-------|
| Türkiye patates üretimi | ~5 milyon ton/yıl |
| Niğde-Nevşehir payı | %44 (~2.2 milyon ton) |
| Mevcut fire oranı | %10-15 |
| Hedef fire oranı | %3-5 |
| Yıllık kurtarma potansiyeli | ~110.000 ton |
| Ekonomik etki | 2 milyar TL+ |

**Cave2Cloud bağlantısı:** Kapadokya'nın bin yıllık yeraltı depolama geleneği, modern sensör + AI + bulut bilişim ile dijitalleştiriliyor. Mağara mimarisi doğal izolasyon sağlıyor — LOCA bu avantajı veriyle maksimize ediyor.

---

## Ekip

Kapadokya Hackathon 2026 — 24 saatlik geliştirme süreci.

---

## Lisans

Bu proje Kapadokya Hackathon 2026 kapsamında geliştirilmiştir.

---

*LOCA — Cave2Cloud Smart Potato Storage Intelligence*
*Kapadokya Hackathon 2026 | 2-3 Mayıs 2026 | Nevşehir*
