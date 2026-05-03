<p align="center">
  <img src="https://img.shields.io/badge/LOCA-Cave2Cloud-E97451?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiPjxwYXRoIGQ9Ik00IDIyVjRjMC0xLjEuOS0yIDItMmgxMmExIDEgMCAwIDEgMSAxdjE4YTEgMSAwIDAgMS0xIDFINmExIDEgMCAwIDEtMS0xeiIvPjwvc3ZnPg==" alt="LOCA Badge" />
</p>

<h1 align="center">LOCA — Cave2Cloud Smart Potato Storage Intelligence</h1>

<p align="center">
  Patates depolarindaki fire oranini AI + sensor + canli pazar verisi ile %10-15'ten %3-5'e dusuren endustriyel zeka katmani.
</p>

---

## Proje Nedir

Turkiye yillik ~5 milyon ton patates uretiyor ve bunun %44'u Nigde-Nevsehir hattinda uretiliyor. Bu bolgedeki uretimin buyuk cogunlugu Kapadokya'nin yeralti depolarinda saklanir — ayni magara yapilari bin yildir insanlari koruyor, bugun de Turkiye'nin gida guvenligini korumaya devam ediyor. Ancak sektor ortalamasinda fire orani %10-15 arasinda seyretmekte. Bu, yilda 200-300 milyon TL degerinde patatesin yer altinda curumus, filizlenmis veya bozulmus olarak kaybolmasi demektir.

LOCA, bu sorunu cok katmanli bir yaklasimla cozer. Her big-bag (1 tonluk depo birimi) icine yerlestirilmis sensor paketleri — sicaklik, nem, CO2, amonyum ve etilen — anlIk veri akisi saglar. Bu ham veriyi salt monitoring olarak degil, **karar zekasi** olarak kullanir: "Su an sat mi, 14 gun bekle mi? Dis hava uygunduysa kepenk ac mi? Bu locaya limon koyabilir miyim?" gibi sorulari cevaplayabilen bir AI katmani sunar. Doviz kuru (TCMB EVDS), lojistik karbon ayak izi (OpenRouteService), dis hava kosullari (Open-Meteo) ve piyasa fiyat tahminleri tek bir karar motorunda birlesiyor.

Proje Kapadokya Hackathon 2026 kapsaminda 24 saat icinde gelistirilmistir. Cave2Cloud temasi ile yer altinin geleneksel bilgeligi, bulut tabanli modern zeka ile bulusturulmustur. Slogan: *"Yer altinin zekasi, ureticinin cebinde."*

---

## Mimari

```
[Sensor Paketi] --LoRaWAN--> [Gateway] --MQTT--> [Supabase Realtime]
                                                        |
                                                   [Next.js API Routes]
                                                   /        |         \
                                          [TCMB EVDS]  [Open-Meteo]  [OpenRouteService]
                                                   \        |         /
                                              [AI Karar Motoru + Karbon Hesaplama]
                                                        |
                                                  [Web Dashboard]
```

Dashboard uc sutunlu bir grid'den olusur: sol tarafta depo/loca hierarsisi, ortada secili loca detayi + karar paneli, sagda harita + karbon zinciri + aksiyon logu.

---

## Uc Zorunlu Kuralin Uygulanmasi

Hackathon kurallari geregi uc entegrasyon zorunludur:

### Kural 1 — Karbon Emisyon Hesaplama
`lib/carbon-calc.ts` ve `app/api/carbon/route.ts` dosyalarinda implement edilmistir. OpenRouteService HGV profili ile gercek kara rotasi hesaplanir. Mesafe x agirlik x 0.100 formulu ile CO2 ciktisindan CBAM golge fiyati (80 EUR/ton CO2) hesaplanir. Big-bag'lerdeki toprak yuzdesi de ekstra emisyon kaynagi olarak raporlanir.

### Kural 2 — TCMB Doviz Kuru
`app/api/tcmb/route.ts` uzerinden TCMB EVDS API'si cagirilir. 60 saniyelik sunucu tarafli cache, baglanti hatalarinda `tcmb.gov.tr/kurlar/today.xml` XML fallback'i mevcuttur. Status bar'da canli USD/TRY ve EUR/TRY gorunur. Karar motorunda EUR alicilar icin doviz etkisi hesaba katilir.

### Kural 3 — Cografi Veri
Nominatim geocoding + OpenRouteService rota entegrasyonu `app/api/carbon/route.ts` ve `app/api/route-buyers/route.ts` dosyalarinda calisir. Leaflet haritada ciftci-depo-alici pinleri ve HGV rotasi gosterilir.

**Mock data izolasyonu:** Tum sahte veriler `lib/seed/` ve `lib/simulator.ts` icinde tutulur, uretim kod yollarina sizdirilmaz.
**Client-side secret yok:** Tum API key'ler sunucu tarafli route handler'larda kullanilir.

---

## CEO Mulakati

Doga Tohumculuk CEO'su Yakup Karahan ile yapilan gorusmede onemli icgoruler elde edilmistir. Entalpi bazli havalandirma karari sektorde fark yaratan bir ozelliktir: klasik sistemler sadece sicaklik esigine bakarak kepenk acarken, LOCA dis hava sicakligi, nem ve yagis durumunu da degerlendirerek "acmali mi, yoksa dis hava iceriden daha mi sicak?" sorusunu cevaplayabilmektedir. Bu yaklasim, gereksiz kepenk acilmalarini onleyerek enerji tasarrufu saglar ve urunun nem dengesini korur.

---

## Hero Features

### 1. Sat-veya-Bekle Karar Asistani
Uc senaryo (simdi / 7 gun / 14 gun) icin fiyat tahmini, fire artisi, doviz etkisi ve karbon maliyetini birlestiren karar motoru. Tek tikla sevkiyat emri.

### 2. Otonom Havalandirma Kontrolu
Open-Meteo dis hava verisi + entalpi hesabi ile kepenk acma/kapama karari. SVG kepenk animasyonu ve canli sicaklik geri bildirimi.

### 3. Urun-Depo Uygunluk Denetcisi
Loca'nin gecmis urun profiline gore yeni urun atamasi oncesi uygunluk kontrolu. Etilen, amonyak ve sicaklik aralik uyumsuzlugu tespit edilir.

---

## Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS 3.4 + shadcn/ui |
| Harita | Leaflet + react-leaflet |
| Grafik | Recharts |
| Veritabani | Supabase (Postgres + Realtime) |
| Font | Inter (UI) + IBM Plex Mono (data) |
| Icon | Lucide React |
| Deploy | Vercel |
| Paket Yoneticisi | pnpm |

---

## Kurulum

```bash
# Repoyu klonla
git clone https://github.com/<org>/loca.git
cd loca/loca-app

# Bagimliliklari yukle
pnpm install

# Cevre degiskenlerini ayarla
cp .env.local.example .env.local
# TCMB_API_KEY, ORS_API_KEY, Supabase bilgilerini ekle

# Seed data yukle
pnpm tsx lib/seed/seed-runner.ts

# Gelistirme sunucusunu baslat
pnpm dev
```

Tarayicida `http://localhost:3000` adresinden dashboard'a erisin.

---

## Demo Video

> Loom demo linki: *[Hackathon sonrasi eklenecek]*
> <!-- Loom kaydedildikten sonra link buraya gelecek -->

---

## Canli Demo

> Vercel deploy linki: [https://hackathon-halenteck.vercel.app](https://hackathon-halenteck.vercel.app)

---

## Ekip

| Isim | Rol |
|------|-----|
| Arda | Full-stack + AI Entegrasyon |
| Takim Uyesi 2 | UI/UX + Sunum |
| Takim Uyesi 3 | Domain Arastirma + CEO Mulakat |

---

## Lisans

MIT
