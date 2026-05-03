# LOCA — Cave2Cloud Smart Potato Storage Intelligence

> *Yer altının zekası, üreticinin cebinde.*

**Kapadokya Hackathon 2026** — Cave2Cloud teması

## Ne Yapıyor?

LOCA, patates depolarındaki her loca'yı sensör + görüntü işleme + AI tahmini ile izleyerek:

- **Fire oranını** %10-15'ten %3-5'e düşürür
- **Satış zamanlamasını** borsa verisi + döviz kuru + lojistik karbon maliyeti üçgeninde optimize eder
- **Havalandırmayı** dış hava koşullarına göre otonom yönetir
- **CBAM uyumlu** karbon karnesi ile AB ihracatına hazırlar

## Temel Özellikler

| Feature | Açıklama |
|---------|----------|
| **Sat/Bekle Karar Asistanı** | TCMB kuru + TOBB fiyat + fire tahmini ile net kâr karşılaştırması |
| **Otonom Havalandırma** | Open-Meteo dış hava + loca iç sensör → kepenk açma/kapama kararı |
| **CV Filiz Dedektörü** | Görüntü işleme ile filizlenme erken tespiti |
| **Karbon Zinciri** | ORS rotalama + CBAM gölge fiyatı hesaplama |
| **Ürün Uyumluluk** | Etilen/CO₂ çapraz kontaminasyon risk matrisi |
| **BigBag İzlenebilirlik** | QR → loca → kamyon → fabrika traceability zinciri |

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Database:** Supabase (Postgres + Realtime)
- **Harita:** Leaflet
- **Grafikler:** Recharts
- **Dış API'ler:** TCMB EVDS, Open-Meteo, OpenRouteService, Nominatim

## Kurulum

```bash
# Bağımlılıkları yükle
pnpm install

# Ortam değişkenlerini ayarla
cp .env.local.example .env.local
# .env.local içini doldur (Supabase URL/Key)

# Geliştirme sunucusunu başlat
pnpm dev
```

[http://localhost:3000](http://localhost:3000) adresinde açılır.

## Proje Yapısı

```
├── app/              # Next.js App Router sayfaları + API routes
│   └── api/          # Server-side route handlers (TCMB, weather, decision, vb.)
├── components/       # React bileşenleri
│   └── ui/           # shadcn/ui base components
├── hooks/            # Custom React hooks
├── lib/              # İş mantığı, hesaplama motorları, seed data
│   └── seed/         # Mock veri (varieties, depots, farmers, buyers, contracts)
├── public/           # Statik dosyalar (video, görseller)
├── supabase/         # Migration dosyaları
├── scripts/          # Seed script
└── docs/             # SPEC.md, CEO_INSIGHTS.md
```

## Etki

Türkiye'de yıllık ~5 milyon ton patates üretiliyor. Niğde-Nevşehir hattı bunun %44'ünü temsil ediyor. %5'lik fire azalması = **~110.000 ton/yıl kurtarma, 2 milyar TL+ ekonomik değer**.

## Ekip

Kapadokya Hackathon 2026 — Cave2Cloud

---

*Built with Next.js, Supabase, and AI-powered decision engines.*
