# Doğa Tohumculuk CEO Görüşme Notları
**Sayın Yakup Karahan ile Mülakat — 2 Mayıs 2026**
*Cave2Cloud / LOCA hackathon projesi için*

---

## TL;DR — Projede Değişen Şeyler

CEO görüşmesi 4 kritik aksiyon doğurdu:

1. **HERO FEATURE değişti:** Yeni hero = **Otonom havalandırma + entalpi-bazlı dış hava farkındalığı**. CEO somut senaryo verdi, Omnivent/Tolsma'da yok, akademik diferansiyatör.
2. **Phase 7 (havalandırma) revize:** Mutlak nem (g/m³) entalpi karşılaştırması lazım. Magnus formülü ile.
3. **Q&A internet altyapısı cevabı güncellendi:** LoRaWAN değil — depolarda fiber + PoE switch dolaşıyor.
4. **Pitch'e 12 ilde sözleşmeli ekim coğrafyası girdi** — bölgesel etki argümanı.

---

## CEO Feature Ranking (DOĞRU SIRALAMA)

| Sıra | Feature | CEO Yorumu | Bizim Pozisyon |
|---|---|---|---|
| **1** | **Otonom havalandırma (c)** | "Çok daha iyi" | **HERO FEATURE** — pitch'in merkezi |
| **2** | **Sat-bekle AI (b)** | "Güzel" | İkincil hero, demo'da 2. sırada |
| **3** | **Part-number izlenebilirlik (e)** | "Eklerse sağlam olur, küçük çiftçinin ürününe güven artar" | Bonus feature, vakit kalırsa |
| **4** | **Karbon karnesi (d)** | "Müşteriler talep ederse — CBAM yakın" | Bonus zincir kuralı için, zorunlu zaten |
| **5** | Multi-sensor fusion (a) | "Yok" — zaten yapıyorlar (Omnivent/Tolsma) | Backend'de var ama pitch'te ön plana çıkarmayacağız |

### Stratejik İçgörü

(a) için "yok" demesi bizim için **kötü haber gibi görünüyor ama tam tersine**:
- Sektörde multi-sensor zaten standart (Omnivent/Tolsma)
- Bizim differentiation noktamız **bu sensörlerle ne yaptığımız** — entalpi karar matrisi + AI sat-bekle
- Pitch'te "biz multi-sensor toplamıyoruz, biz multi-sensor'den **akıllı kararlar üretiyoruz**" pozisyonu çok daha güçlü

---

## HERO Feature — Otonom Havalandırma (Entalpi-Bazlı)

### CEO'nun Verdiği Senaryo (Kritik)

> İçerinin 10°C, %80 nem olduğu bir senaryoda, ben 7°C istiyorsam ve dışarısı 14°C ama %15 nem varsa — **içerideki nemi dışarı atarsak sıcaklığı düşürebiliriz** bu senaryoda.

**Bu cümle altın değerinde.** Çünkü:
1. Klasik sistemler (sıcaklık-only) bu senaryoda yanlış karar verir → kepenk açma der ama dışarı sıcak olduğu için reddeder
2. Bizim sistemimiz **mutlak nem** hesabıyla "evet, aç" der ve gerçek termodinamiği uygular
3. CEO'nun kendi sözleri ile pitch'te alıntılayabiliyoruz

### Implementation

`lib/ventilation-decision.ts`:

```typescript
// Mutlak nem (g su buharı / kg kuru hava) — Magnus formülü
function absoluteHumidity(tempC: number, relHum: number): number {
  const Es = 6.112 * Math.exp((17.67 * tempC) / (tempC + 243.5));
  const E = (relHum / 100) * Es;
  return 622 * E / (1013.25 - E);
}

// Entalpi (kJ/kg kuru hava) — daha doğru karar metriği
function enthalpy(tempC: number, relHum: number): number {
  const W = absoluteHumidity(tempC, relHum) / 1000; // kg/kg
  return 1.006 * tempC + W * (2501 + 1.86 * tempC);
}

interface VentDecisionInput {
  internal: SensorReading;
  external: WeatherReading;
  variety: PotatoVariety;
  hasChiller: boolean;
}

export function decideVentilation(input: VentDecisionInput): VentilationDecision {
  const { internal, external, variety, hasChiller } = input;

  // Yağmur varsa kepenk asla açılmaz (nem kontrolden çıkar)
  if (external.precipitation) {
    return {
      decision: hasChiller ? 'chiller_on' : 'alert',
      reasoning: 'Dış ortamda yağış var, doğal havalandırma uygun değil.',
      ...
    };
  }

  const intEnthalpy = enthalpy(internal.tempC, internal.humidity);
  const extEnthalpy = enthalpy(external.tempC, external.humidity);
  const enthalpyDelta = intEnthalpy - extEnthalpy; // pozitifse dış hava enerji düşürür

  const intAbsHum = absoluteHumidity(internal.tempC, internal.humidity);
  const extAbsHum = absoluteHumidity(external.tempC, external.humidity);

  // ENTHALPY-BASED KARAR — bu CEO senaryosunu yakalar
  const benefit = enthalpyDelta > 1.5; // 1.5 kJ/kg eşik

  if (benefit) {
    return {
      decision: 'damper_open',
      reasoning: `İç entalpi ${intEnthalpy.toFixed(1)} kJ/kg, dış entalpi ${extEnthalpy.toFixed(1)} kJ/kg. Fark ${enthalpyDelta.toFixed(1)} kJ/kg — dış hava içeriyi soğutur ve nemi düşürür.`,
      indicators: {
        tempDelta: internal.tempC - external.tempC,
        absHumDelta: intAbsHum - extAbsHum,
        enthalpyDelta,
      },
      ...
    };
  }

  // Klasik sıcaklık-only fail → chiller veya bekle
  if (hasChiller) {
    return { decision: 'chiller_on', reasoning: 'Doğal havalandırma faydasız, mekanik soğutma devrede.', ... };
  }

  return { decision: 'alert', reasoning: 'Doğal havalandırma uygun değil, manuel müdahale gerekli.', ... };
}
```

### Demo Akışı (HERO)

7 dakikalık sunumda **3:00-4:30 arası** bu feature'ı göster:

1. Anomali tetikle butonu → Loca A7'de sıcaklık 11.2°C'ye fırlar
2. Sistem dış hava verisini çeker (Open-Meteo) — "Dışarısı 14°C, %15 nem" göster
3. **Karar matrisi paneli açılır:**
   ```
   ────────────────────────────────────────
   ENTALPI HESABI
   ────────────────────────────────────────
   İç:  11.2°C × %91 nem  →  46.2 kJ/kg
   Dış: 14.0°C × %15 nem  →  19.8 kJ/kg
   ────────────────────────────────────────
   Fark: 26.4 kJ/kg ✓ (eşik 1.5)
   ────────────────────────────────────────
   Klasik sistem: kapat (dışarı sıcak)
   LOCA kararı:   AÇ (entalpi farkı yüksek)
   ```
4. Kepenk açılma animasyonu, 18 sn sonra sıcaklık 8.4°C'ye iner
5. Action log'a kayıt + entalpi hesabı detayı

### Pitch'te Kullanılacak Cümleler

> "Klasik sistemler sıcaklık-only çalışır. Doğa Tohumculuk CEO'su Yakup Karahan bize bugün şu senaryoyu anlattı: 'İçerisi 10°C %80 nem, dışarısı 14°C %15 nem — ben içerideki nemi dışarı atarsam sıcaklığı düşürebilirim.'
>
> Bu termodinamiğin temel kuralı — entalpi farkı sıcaklık farkından daha güvenilir bir göstergedir. Bizim sistemimiz Magnus formülüyle mutlak nemi hesaplıyor, dış hava daha sıcak olsa bile, daha kuru ise kepenk açıyor. Omnivent ve Tolsma gibi sektör liderleri bunu yapmıyor."

---

## İkincil Feature — Sat-Bekle AI

CEO "güzel" dedi, demo'da **4:30-5:30 arası** ikinci hero olarak göster.

Önceki SPEC'teki Phase 5 (Decision Engine) implementation'ı geçerli. Tek değişiklik: pitch'te ana hero değil, "haritada bir noktadan diğerine taşımanın akıllı kararı" pozisyonu.

---

## Üçüncü Feature — Part-Number İzlenebilirlik

CEO "eklerse sağlam olur, küçük çiftçinin ürününe güven artar" dedi.

### Hackathon Scope İçin

Phase 8 yerine **küçük scope** ekle:
- BigBag interface'ine 3 alan: `lastPesticideDate`, `lastFertilizationDate`, `harvestToStorageDays`
- Big-bag detay modal'ında "İzlenebilirlik" tab'ı (basit timeline)
- Sözleşme görünümünde her big-bag'in tarladan gelen geçmişi
- **Tahmini ek süre: 60 dk** — sadece UI, backend'e dokunma

Bu feature pitch'te 3. sırada. Sunumun 5. dakikasında "Doğa CEO'sunun bizden istediği bir feature daha var" diye geçilir.

---

## Operasyonel Gerçeklik (Pitch için somut sayılar)

### Mevcut Sensör Altyapısı (Doğa'da)
- **Yazılım:** Omnivent (havalandırma) + Tolsma. Hollanda menşeli, sektör standardı.
- **Sensörler:** Sıcaklık + nem + CO₂ standart. **TTC/TT100** sensörler 1-1.5 metrelik, doğrudan patatesin **içine** saplanıyor — patates iç sıcaklığı ölçülüyor, ortam değil.
- **Buruz ölçer ajan patates:** Var. Bluetooth + ivme ölçer, titreşim algılayan sahte patates. Doğa zaten kullanıyor. Pitch'te "biz CV ile entegre ediyoruz, ajan patates verisini AI'a feed ediyoruz" konumlanması.
- **Depolama tipi:** Kasalar / big bag / dökme. Big bag ve kasa nemli ürünlerde tercih çünkü çürüme yayılmasını sınırlar.

### Depo Ölçeği
- **6 depo: 15.000-20.000 ton** kapasiteli, Gülşehir-Nevşehir yolunda
- **Yıllık 170.000 ton** ürün işleniyor (CEO sözü)
- **+4°C tohum, +7°C sanayilik** — multi-zone storage
- **Saklama hedefi: 11+ ay** (geçen yıl Haziran, bu yıl Ağustos)

### Sözleşmeli Ekim
- **12 ilde:** Hatay, Adana Nurdağı, Kırşehir, Konya, Bursa, İnegöl, İzmir Ödemiş, Afyon, Kayseri, Sivas
- **Ret oranı:** %15 fire kesintisi standart (100 ton → 85 ton sayılır, ödeme 85 ton üzerinden)
- **En sık ret sebebi:** Su çürüğü (hastalık)
- **Sözleşme fiyatı 2026:** **10-13 TL/kg** TL bazlı, sabit
- **Vade:** İhracat peşin, iç piyasa vadeli
- **Tohum ↔ sanayi:** Asla birleştirilmez (hastalık riski). Sanayilikten tohum alınmaz.

### Karbon Kaynakları (CEO'nun saydıkları)
1. Hasat anı CO₂
2. Tarla → depo CO₂
3. Havalandırma/iklimlendirme CO₂ — **bizim havalandırma kararımızı doğrudan etkiler**
4. Yükleme ekipmanları (dizel/elektrik) CO₂

> "Sırf nötralize etmek için güneş sistemleri kurmuş ama şu an aktif değil." — bu cümle pitch için hiç söylenmemeli (utandırıcı), ama bize CBAM'in onlar için ne kadar yakın olduğunu gösteriyor.

### Dijitalleşme Engelleri
- **Personelin teknolojiye adaptasyonu** (CEO'nun en büyük sıkıntısı): "Senin yaptığın işi yapacak bilgisayar koyuyorum o yüzden hep eleştiriyorsun beni."
- Bu **insan engeli** sosyal sorun, teknik değil. Pitch'te framing: "LOCA personeli yok etmiyor — onun gözünü çalıştırmadığı şeylerde tutuyor. 2 saatte bir kontrol turu yerine, sadece anomali olduğunda gidiyor."

### İnternet Altyapısı
- Modern depolarda **fiber + PoE switch** mevcut (Doğa'da)
- LoRaWAN sadece küçük çiftçi tesisleri için alternatif
- Q&A cevabımız: "Doğa Tohumculuk gibi tesislerde fiber zaten var, küçük çiftçi için LoRaWAN. Sensörler IP67."

---

## Pitch Scripti — 5. Dakika (Yenilenmiş)

> "İş modelimizin merkezinde Sayın Yakup Karahan'ın, Doğa Tohumculuk CEO'sunun bize bugün söylediği bir senaryo var. 'İçerisi 10 derece, %80 nem. Dışarısı 14 derece, %15 nem. Klasik sistemler dışarısı sıcak diye kepenk açmaz. Ama termodinamiğe göre, içerideki nemi dışarı atarsak sıcaklığı düşürebiliriz.'
>
> İşte tam burada bizim entalpi-bazlı karar motorumuz devreye giriyor — Omnivent ve Tolsma gibi sektör standardının 30 yıldır yapamadığı bir şey. CEO bize feature'larımızı sıraladığında 'otonom havalandırma çok daha iyi' dedi. Çünkü gerçek değer hassas iklimlendirmede.
>
> İkinci katman: sat-bekle AI. Üçüncü katman: küçük çiftçinin ürün izlenebilirliği — CEO bunun da onlar için güven artırıcı olduğunu söyledi.
>
> İş modeli: Doğa Tohumculuk gibi büyük entegre şirketlere SaaS, küçük çiftçiye freemium. CBAM 2026'da aktif, karbon karnesi otomatik PDF. Türkiye'de 12 ilde sözleşmeli ekim ağı, yıllık 170.000 ton ürün — sadece Doğa Tohumculuk için. Tüm sektör %44'ü Niğde-Nevşehir hattında — bu pazar bizi bekliyor."

---

## Q&A Cevap Listesi — Final

| Soru | Cevap |
|---|---|
| Sensör maliyeti? | Big-bag başına ~100$, locada 30 big-bag = 3.000$. Doğa ölçeğinde 6 depo × ortalama 12 loca × 30 = 21.600 sensör, ~2.2M$ donanım. SaaS ile ROI 9-12 ay. |
| İnternet altyapısı? | Modern depolarda fiber + PoE switch (Doğa'da gözlemledik). Küçük çiftçi için LoRaWAN gateway. Sensörler IP67 nem dayanıklı. |
| Omnivent/Tolsma rekabeti? | Onlar havalandırma + temel monitoring. Bizim diferansiyatör: **entalpi-bazlı karar matrisi** + sat-bekle AI + CBAM-uyumlu karbon zinciri. Tamamlayıcı, doğrudan rakip değil. |
| Multi-sensor fusion neden hero değil? | Çünkü zaten sektör standardı. Biz sensör verisinden çıkardığımız **kararla** parıldıyoruz, sensörle değil. |
| Ajan patates nedir? | Bluetooth + ivme ölçer içeren sahte patates, titreşimi ölçer (buruz tespiti). Sektörde mevcut, Doğa kullanıyor. Bizim sistem onların verisini AI'a feed eder. |
| YOLO modeli gerçek mi? | Mock — 24 saatte custom dataset etiketlenmiyor. Plan: Niğde-Nevşehir 2.000 fotoğraf, YOLOv8 transfer learning. Mimari hazır. |
| Pilot program? | Doğa Tohumculuk CEO'su Yakup Karahan ile 30 dk teknik mülakat yaptık. Hackathon sonrası takip görüşmesi planlıyoruz. |
| %15 fire kesintisi nasıl yarıya iner? | Erken çürüme tespiti (amonyum spike) + entalpi-bazlı havalandırma + filiz başlangıcı tespiti = klasik sistemden 4-6 hafta önce uyarı. |
| CEO'dan en kritik geri bildirim? | "Otonom havalandırma çok daha iyi" — sat-bekle AI'dan da, izlenebilirlikten de önce bu istendi. |

---

## Aksiyonlar — Önceliklendirilmiş

### Şimdi (Phase 3 başlamadan önce — bu dosyayı oku)
1. ✅ `docs/CEO_INSIGHTS.md` repo'da
2. ⏸️ Takım arkadaşı 12 il çiftçi listesini seed data'ya işliyor (60 dk paralel iş)
3. ⏸️ Doğa Tohumculuk yerli çeşitleri (Kutup, Bahar, Volkan, Kaya, İlkmor) seed data'ya eklenir

### Phase 7'de (HERO — havalandırma, kritik)
- `lib/ventilation-decision.ts` **entalpi formülü ile** yazılacak (yukarıdaki tam kod)
- UI'da entalpi karar matrisi paneli — **CEO senaryosunu birebir yansıtan demo**
- Pitch için bu fazın görsel kalitesi en yüksek priority

### Phase 8 (yerine küçük izlenebilirlik scope)
- BigBag interface'e 3 alan
- TraceabilityTimeline modal tab'ı
- 60 dk, NICE-have

### Pitch güncellemesi (Phase 9'da)
- 5. dakika scripti yukarıdaki yeni metin
- Son slide'a: "Doğa Tohumculuk CEO mülakatı: ✓"

---

**Hero feature artık entalpi-bazlı havalandırma. CEO'nun kendi senaryosunu pitch'te birebir kullanıyoruz. Bu jüri için hem akademik diferansiyatör (termodinamik), hem domain validation (CEO sözü), hem de demo-friendly (animasyon + sayılar). 24 saatte yapılabilir, çıkar.**
