'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useLocaDispatch } from '@/hooks/use-loca-state';
import type { CompatProductType, CompatResult } from '@/lib/compatibility-matrix';
import type { Loca } from '@/lib/types';

interface Alternative {
  locaId: string;
  number: string;
  depotName: string;
  ethyleneRemnant: number;
}

interface CompatResponse {
  compatibility: CompatResult;
  alternatives?: Alternative[];
}

const PRODUCT_OPTIONS: { value: CompatProductType; label: string }[] = [
  { value: 'potato-table', label: 'Patates (Sofralik)' },
  { value: 'potato-seed', label: 'Patates (Tohumluk)' },
  { value: 'potato-crisping', label: 'Patates (Cipslik)' },
  { value: 'potato-french_fry', label: 'Patates (Parmak)' },
  { value: 'lemon', label: 'Limon' },
  { value: 'apple', label: 'Elma' },
  { value: 'onion', label: 'Sogan' },
  { value: 'legume', label: 'Bakliyat' },
  { value: 'cheese', label: 'Peynir' },
];

interface Props {
  loca: Loca;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductCompatibilityChecker({ loca, open, onOpenChange }: Props) {
  const dispatch = useLocaDispatch();
  const [selectedProduct, setSelectedProduct] = useState<CompatProductType | ''>('');
  const [result, setResult] = useState<CompatResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (value: CompatProductType) => {
    setSelectedProduct(value);
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/product-compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locaId: loca.id, newProduct: value }),
      });
      const data: CompatResponse = await res.json();
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAlternative = (locaId: string) => {
    dispatch({ type: 'SELECT_LOCA', locaId });
    onOpenChange(false);
    setSelectedProduct('');
    setResult(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedProduct('');
      setResult(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="bg-[hsl(var(--cave-card))] border-[hsl(var(--border))] text-[hsl(var(--cream))] max-w-md"
        style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)' }}
      >
        <DialogHeader>
          <DialogTitle className="font-bold tracking-tight">
            Urun Uyumluluk Kontrolu — {loca.number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Residue info */}
          <div className="text-xs font-mono text-[hsl(var(--muted))] space-y-1">
            <div className="flex justify-between">
              <span>Etilen rezidüsü</span>
              <span>{loca.residueProfile.ethyleneRemnant} ppb</span>
            </div>
            <div className="flex justify-between">
              <span>Amonyak rezidüsü</span>
              <span>{loca.residueProfile.ammoniaRemnant} ppm</span>
            </div>
            {loca.residueProfile.cleaningDate && (
              <div className="flex justify-between">
                <span>Son temizlik</span>
                <span>{loca.residueProfile.cleaningDate}</span>
              </div>
            )}
          </div>

          {/* Product selector */}
          <Select value={selectedProduct} onValueChange={(v) => handleSelect(v as CompatProductType)}>
            <SelectTrigger className="bg-[hsl(var(--cave-bg))] border-[hsl(var(--border))] text-[hsl(var(--cream))]">
              <SelectValue placeholder="Yeni urun secin..." />
            </SelectTrigger>
            <SelectContent className="bg-[hsl(var(--cave-card))] border-[hsl(var(--border))] text-[hsl(var(--cream))]">
              {PRODUCT_OPTIONS.map(opt => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="focus:bg-[hsl(var(--peri-orange))]/20 focus:text-[hsl(var(--cream))]"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-[hsl(var(--peri-orange))]" />
            </div>
          )}

          {/* Result */}
          {result && !loading && (
            <div className="space-y-3">
              <div className={`flex items-start gap-3 p-3 rounded-lg border ${
                result.compatibility.compatible === 'yes'
                  ? 'bg-[hsl(var(--success))]/10 border-[hsl(var(--success))]/30'
                  : result.compatibility.compatible === 'caution'
                    ? 'bg-[hsl(var(--warning))]/10 border-[hsl(var(--warning))]/30'
                    : 'bg-[hsl(var(--danger))]/10 border-[hsl(var(--danger))]/30'
              }`}>
                {result.compatibility.compatible === 'yes' && (
                  <CheckCircle2 className="w-5 h-5 text-[hsl(var(--success))] shrink-0 mt-0.5" />
                )}
                {result.compatibility.compatible === 'caution' && (
                  <AlertTriangle className="w-5 h-5 text-[hsl(var(--warning))] shrink-0 mt-0.5" />
                )}
                {result.compatibility.compatible === 'no' && (
                  <XCircle className="w-5 h-5 text-[hsl(var(--danger))] shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className={`text-sm font-semibold ${
                    result.compatibility.compatible === 'yes'
                      ? 'text-[hsl(var(--success))]'
                      : result.compatibility.compatible === 'caution'
                        ? 'text-[hsl(var(--warning))]'
                        : 'text-[hsl(var(--danger))]'
                  }`}>
                    {result.compatibility.compatible === 'yes' ? 'Uygun' : result.compatibility.compatible === 'caution' ? 'Dikkat' : 'Uyumsuz'}
                  </div>
                  <div className="text-xs text-[hsl(var(--cream))]/80">
                    {result.compatibility.reason}
                  </div>
                  {result.compatibility.alternativeAction && (
                    <div className="text-xs text-[hsl(var(--muted))] italic mt-1">
                      {result.compatibility.alternativeAction}
                    </div>
                  )}
                </div>
              </div>

              {/* Alternatives */}
              {result.alternatives && result.alternatives.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[hsl(var(--muted))] uppercase tracking-wider">
                    Alternatif Localar
                  </div>
                  {result.alternatives.map(alt => (
                    <button
                      key={alt.locaId}
                      onClick={() => handleSelectAlternative(alt.locaId)}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--cave-bg))]/50 hover:border-[hsl(var(--peri-orange))]/50 transition-colors text-left group"
                    >
                      <div>
                        <span className="text-sm font-mono font-semibold">{alt.number}</span>
                        <span className="text-xs text-[hsl(var(--muted))] ml-2">{alt.depotName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[hsl(var(--success))]">
                          {alt.ethyleneRemnant} ppb
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[hsl(var(--muted))] group-hover:text-[hsl(var(--peri-orange))] transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
