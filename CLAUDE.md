# LOCA — Claude Code Operasyon Talimatları

Bu dosya her oturumda otomatik yüklenir. Burada yazan kurallar **bağlayıcıdır**.

## 0. İlk İş

Yeni session başladığında önce şu iki dosyayı oku:
1. `docs/SPEC.md` — projenin tek doğru kaynağı, tüm domain feature'lar burada
2. Bu dosya (`CLAUDE.md`) — operasyonel kurallar

Skill'ler `.claude/skills/` altında, ihtiyaç doğdukça onları da oku:
- `design-system` — UI yazdığın her an oku
- `api-integrations` — API endpoint yazdığın her an oku

## 1. Proje Kimliği

**Ad:** LOCA (Cave2Cloud Smart Potato Storage Intelligence)
**Yarışma:** Kapadokya Hackathon 2026 (24 saatlik hackathon)
**Hedef:** Patates depolarındaki fire oranını AI + sensör + canlı pazar verisi ile %10-15'ten %3-5'e düşürmek
**Tech stack LOCKED:** Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui + Supabase + Leaflet + Recharts. Bu stack tartışmaya açık değil.

## 2. Çalışma Modu

- **Faz faz çalışırız.** Bir prompt = bir faz. SPEC.md'deki Phase X için Definition of Done (DOD) tamamen karşılanana kadar diğer faza geçme.
- **Test yazma.** Hackathonda tek koşumlu kod yazıyoruz, refactor riski almıyoruz.
- **Auth ekleme.** Demo modda tek kullanıcı.
- **i18n ekleme.** Türkçe UI, sabit.
- **Yeni dependency** önerirken Arda'dan onay iste, kendi başına ekleme.
- **Mock data** sadece `lib/seed/` ve `lib/simulator.ts`'de. Production code path'lerine sızdırma.
- **Secret/API key** asla client component'a koyma. Server-side route handler kullan.

## 3. Belirsizlik Anında

Eğer SPEC.md'de **yeterli detay yoksa**, varsayım yapıp ilerleme. **DUR ve Arda'ya sor.** Tahmin edilen kararlar SPEC ile çatışırsa geri dönüp düzeltmek 2-3x zaman maliyeti. Soru sorman özel durumlarda gerekli:
- Bir component'in görsel yerleşimi açık değilse
- Bir API endpoint'i dış servise bağlıyken (TCMB/ORS) hata yönetimi belirsizse
- Bir veri modelinin nasıl populate edileceği belirsizse
- Bir akışın (örn. anomali tetikleyicisi) UX'i belirsizse

Soru sorarken **net seçenekler sun**: "A: şöyle yapsam, B: böyle yapsam, hangisi?". Açık uçlu sorular zaman kaybettirir.

## 4. Kod Stili

- Component dosyaları **PascalCase** (örn. `LocaDetailPanel.tsx`)
- Utility / hook / type dosyaları **kebab-case** (örn. `use-tcmb-rate.ts`)
- Türkçe domain terimleri kodda kullan (Loca, BigBag, varietyId), kullanıcıya gösterilen UI metni Türkçe
- Comment'ler İngilizce
- Excessive comments yazma — kendi kendini açıklayan kod
- Lucide icon'larını kullan, custom SVG'ye girme
- shadcn/ui component'leri ekle (`pnpm dlx shadcn@latest add ...`), kendi component'ini yazmadan önce shadcn'de var mı kontrol et

## 5. Klasör Yapısı

```
loca-app/
├── app/
│   ├── page.tsx                  # Ana dashboard
│   ├── layout.tsx
│   ├── api/
│   │   ├── tcmb/route.ts
│   │   ├── carbon/route.ts
│   │   ├── route-buyers/route.ts
│   │   ├── decision/route.ts
│   │   ├── weather/route.ts
│   │   ├── ventilation-decision/route.ts
│   │   └── product-compatibility/route.ts
│   ├── depots/page.tsx
│   ├── varieties/page.tsx
│   ├── contracts/page.tsx
│   └── globals.css
├── components/
│   ├── status-bar.tsx
│   ├── depot-map.tsx
│   ├── loca-detail-panel.tsx
│   ├── decision-panel.tsx
│   ├── carbon-chain-card.tsx
│   ├── sprout-detector-modal.tsx
│   ├── ventilation-control.tsx
│   ├── product-compatibility-checker.tsx
│   └── ui/                       # shadcn/ui burada
├── lib/
│   ├── types.ts
│   ├── seed/
│   │   ├── varieties.ts
│   │   ├── depots.ts
│   │   ├── farmers.ts
│   │   ├── buyers.ts
│   │   └── contracts.ts
│   ├── simulator.ts
│   ├── carbon-calc.ts
│   ├── ventilation-decision.ts
│   ├── price-prediction.ts
│   ├── compatibility-matrix.ts
│   └── supabase.ts
├── hooks/
│   ├── use-tcmb-rate.ts
│   ├── use-sensor-realtime.ts
│   └── use-loca-state.ts
├── public/
│   └── potato-images/            # CV mock görselleri
├── docs/
│   └── SPEC.md
├── .claude/
│   └── skills/
└── CLAUDE.md
```

## 6. Commit Disiplini

Hackathon kuralı: **saatlik commit zorunlu**. Her faz sonunda mutlaka commit at:
```
git add . && git commit -m "Phase X: <kısa özet>"
```

Anlamlı mesajlar yaz: "feat: depot grid ile loca rendering", "fix: TCMB fallback XML parsing".

## 7. Performans

- Build süresi 60 saniyeyi geçerse durup düşün — gereksiz dependency olmuş olabilir
- Page load < 2 sn (Vercel'de ölçülecek)
- Realtime subscription'lar mount/unmount cleanup'lı olsun, memory leak'e yol açma

## 8. Hata Yönetimi

External API'ler (TCMB, ORS, Open-Meteo) **kesinlikle** fail-safe olmalı:
- Try-catch zorunlu
- Fallback değer hazırla (örn. son cached kur)
- UI'da "bağlantı yok, son güncelleme: HH:MM" göster
- Hard fail = jüri demo'sunda dashboard çöker = projemiz uçar

---

**Bu dosya değişirse Arda onaylar.**
