---
name: design-system
description: LOCA görsel tasarım sistemi - renk paletleri (mağara/Kapadokya teması), tipografi (Inter + IBM Plex Mono), spacing, component patterns (button, card, input, badge), Tailwind class şablonları. UI component yazıldığı, stil eklendiği, dashboard layout kurulduğu, modal/card/grid tasarlandığı her durumda bu skill'i oku. Generic AI dashboard görünmesin - Anadolu/Kapadokya kimliği taşımalı.
---

# LOCA Design System

LOCA hackathon projesinin görsel kimliği. **Generic AI dashboard görünmemeli** — Cave2Cloud teması Anadolu/Kapadokya rengi ve dokusu taşımalı.

## Renk Paleti (CSS Variables)

`app/globals.css` içine ekle:

```css
@layer base {
  :root {
    --cave-bg: 26 13% 8%;          /* #1B1410 mağara karanlığı */
    --cave-card: 28 19% 13%;        /* #2A1F18 card bg */
    --peri-orange: 16 78% 62%;      /* #E97451 peri bacası, primary */
    --earth-brown: 24 51% 28%;      /* #6B4423 toprak, secondary */
    --cave-blue: 217 39% 39%;       /* #3D5A8C serin lacivert, info */
    --cream: 36 60% 90%;            /* #F5E6D3 text-primary */
    --muted: 30 15% 59%;            /* #A89684 text-secondary */
    --success: 130 22% 54%;         /* #6FA577 yumuşak yeşil */
    --warning: 41 65% 55%;          /* #D9A441 sarı-altın */
    --danger: 0 50% 47%;            /* #B33A3A toprak kırmızı */

    --background: var(--cave-bg);
    --foreground: var(--cream);
    --card: var(--cave-card);
    --card-foreground: var(--cream);
    --primary: var(--peri-orange);
    --primary-foreground: var(--cream);
    --secondary: var(--earth-brown);
    --muted-foreground: var(--muted);
    --border: 24 30% 22%;
    --input: 24 30% 22%;
    --ring: var(--peri-orange);
  }
}

body {
  background:
    radial-gradient(ellipse at top, hsl(28 19% 18% / 0.4), transparent 60%),
    radial-gradient(ellipse at bottom, hsl(217 39% 18% / 0.2), transparent 60%),
    hsl(var(--cave-bg));
  color: hsl(var(--cream));
  min-height: 100vh;
}
```

## Tipografi

`app/layout.tsx`:

```tsx
import { Inter, IBM_Plex_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-inter' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-mono' });

// body className: `${inter.variable} ${mono.variable} font-sans`
```

**Kullanım kuralları:**
- Headings: `font-sans font-bold tracking-tight`
- Body: `font-sans`
- Sayısal veri (sıcaklık, ton, kg CO₂, kur, fiyat): `font-mono` — bu kritik, monetary/scientific değer mono fontla profesyonel görünür
- Variety isimleri (Lady Rosetta vb): `font-sans italic`

## Spacing

- Card padding: `p-5` (20px)
- Grid gap: `gap-4` (16px)
- Section spacing: `space-y-6`
- Border radius: `rounded-xl` (12px) - kart, modal; `rounded-lg` - button, input

## Component Patterns

### LOCA Card

Kart elemanları yer altı hissi vermeli — inset shadow ile.

```tsx
export function LocaCard({ children, status }: { children: React.ReactNode; status?: 'optimal'|'warning'|'critical' }) {
  const statusBorder = {
    optimal: 'border-[hsl(var(--success))]/30',
    warning: 'border-[hsl(var(--warning))]/40',
    critical: 'border-[hsl(var(--danger))]/50 animate-pulse',
  };

  return (
    <div
      className={`
        rounded-xl border p-5
        bg-[hsl(var(--cave-card))]
        ${status ? statusBorder[status] : 'border-[hsl(var(--border))]'}
      `}
      style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)' }}
    >
      {children}
    </div>
  );
}
```

### Loca Grid Hücresi

Yeraltı odası hissi — koyu arka plan, sıcak vurgu.

```tsx
export function LocaCell({ loca, isSelected, onClick }) {
  const statusColor = {
    optimal: 'bg-[hsl(var(--success))]/20 border-[hsl(var(--success))]',
    warning: 'bg-[hsl(var(--warning))]/25 border-[hsl(var(--warning))]',
    critical: 'bg-[hsl(var(--danger))]/30 border-[hsl(var(--danger))] animate-pulse',
  }[loca.status];

  return (
    <button
      onClick={onClick}
      className={`
        relative aspect-[4/3] rounded-lg border-2 ${statusColor}
        ${isSelected ? 'ring-2 ring-[hsl(var(--peri-orange))]' : ''}
        transition-all hover:scale-[1.02] p-2 text-left
      `}
      style={{ boxShadow: 'inset 0 0 12px rgba(0,0,0,0.5)' }}
    >
      <div className="text-xs font-mono text-[hsl(var(--muted))]">{loca.number}</div>
      <div className="text-sm font-semibold truncate">{loca.varietyName ?? 'Boş'}</div>
      <div className="text-xs font-mono mt-1">{loca.currentLoadTon}t</div>
      <div className="absolute bottom-1 right-1 text-xs font-mono">
        ⚠ {loca.fireRiskScore}
      </div>
    </button>
  );
}
```

### Status Bar

```tsx
<header className="sticky top-0 z-50 h-14 border-b border-[hsl(var(--border))] bg-[hsl(var(--cave-bg))]/95 backdrop-blur px-6 flex items-center gap-6">
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-md bg-[hsl(var(--peri-orange))] flex items-center justify-center">
      <Database className="w-4 h-4" />
    </div>
    <span className="font-bold text-lg tracking-tight">LOCA</span>
  </div>
  <div className="flex items-center gap-4 text-sm">
    <span className="font-mono">USD/TRY: <span className="text-[hsl(var(--peri-orange))]">{rate.usd}</span></span>
    <span className="font-mono">EUR/TRY: <span className="text-[hsl(var(--peri-orange))]">{rate.eur}</span></span>
    <span className="text-[hsl(var(--muted))] text-xs">Son güncelleme: {time}</span>
  </div>
  <div className="ml-auto flex items-center gap-3">
    <Badge variant="success">412 sensör aktif</Badge>
    <Badge variant="default">36 loca</Badge>
  </div>
</header>
```

### Decision Panel Card

Hero feature, üç senaryo yan yana.

```tsx
<div className="grid grid-cols-3 gap-4">
  {scenarios.map((s, i) => (
    <div
      key={s.label}
      className={`
        p-4 rounded-xl border-2
        ${s.recommended
          ? 'border-[hsl(var(--peri-orange))] bg-[hsl(var(--peri-orange))]/10'
          : 'border-[hsl(var(--border))] bg-[hsl(var(--cave-card))]'}
      `}
    >
      <div className="text-xs uppercase tracking-wider text-[hsl(var(--muted))]">{s.label}</div>
      <div className="text-2xl font-mono font-bold mt-2">
        {formatTRY(s.netRevenueTRY)}
      </div>
      {s.netRevenueEUR && (
        <div className="text-sm font-mono text-[hsl(var(--muted))]">
          {formatEUR(s.netRevenueEUR)}
        </div>
      )}
      <div className={`mt-3 text-sm font-mono ${
        s.deltaVsNow >= 0 ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--danger))]'
      }`}>
        {s.deltaVsNow >= 0 ? '+' : ''}{s.deltaVsNow.toFixed(2)}%
      </div>
    </div>
  ))}
</div>
```

### Carbon Chain Card

Üç kuralı tek panelde gösteren özel komponent.

```tsx
<LocaCard>
  <div className="flex items-center gap-2 mb-4">
    <Globe className="w-5 h-5 text-[hsl(var(--peri-orange))]" />
    <h3 className="font-bold">Karbon Zinciri</h3>
    <div className="ml-auto flex gap-1 text-xs">
      <span className="px-2 py-0.5 rounded-full bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]">K1</span>
      <span className="px-2 py-0.5 rounded-full bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]">K2</span>
      <span className="px-2 py-0.5 rounded-full bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]">K3</span>
    </div>
  </div>

  <div className="space-y-2 font-mono text-sm">
    {chain.segments.map(s => (
      <div key={s.label} className="flex justify-between">
        <span className="text-[hsl(var(--muted))]">{s.label}</span>
        <span>{s.distanceKm.toFixed(1)} km × {s.weightTon}t = {s.co2kg.toFixed(1)} kg CO₂</span>
      </div>
    ))}
    <hr className="border-[hsl(var(--border))]" />
    <div className="flex justify-between font-bold">
      <span>TOPLAM</span>
      <span>{chain.totalCO2kg.toFixed(1)} kg CO₂</span>
    </div>
    <div className="flex justify-between text-[hsl(var(--peri-orange))]">
      <span>CBAM Maliyet</span>
      <span>{chain.cbamCostEUR.toFixed(2)} € = {formatTRY(chain.cbamCostTRY)}</span>
    </div>
  </div>
</LocaCard>
```

## Layout Pattern

Ana dashboard `app/page.tsx`:

```tsx
<div className="min-h-screen">
  <StatusBar />
  <main className="grid grid-cols-12 gap-4 p-6 max-w-[1800px] mx-auto">
    <section className="col-span-4 space-y-4">
      <DepotMap />
    </section>
    <section className="col-span-5 space-y-4">
      <LocaDetailPanel />
      <DecisionPanel />
    </section>
    <section className="col-span-3 space-y-4">
      <MapView />
      <CarbonChainCard />
      <ActionLog />
    </section>
  </main>
</div>
```

## Animation Patterns

Critical/anomaly durumlarda subtle pulse:
```css
.alert-pulse { animation: alert-pulse 2s ease-in-out infinite; }
@keyframes alert-pulse {
  0%, 100% { box-shadow: 0 0 0 0 hsl(var(--danger) / 0.5); }
  50% { box-shadow: 0 0 0 8px hsl(var(--danger) / 0); }
}
```

Sensor reading update: subtle highlight 300ms.

## Mutlaka KAÇIN

- Pure black (#000) — body bg her zaman cave-bg
- Pure white (#FFF) text — cream kullan
- Generic blue/purple gradient — Anadolu palette dışı
- emoji yerine lucide icon
- Default Tailwind blue/red/green — CSS variables kullan

## Mutlaka YAP

- Sayısal değer = `font-mono`
- Card = inset shadow (yer altı hissi)
- Critical state = subtle pulse
- Türkçe sayı formatı (1.234,56 ₺ değil 1.234,56 TL — "₺" simgesi de OK)
- Loading state = skeleton (asla blank screen)
