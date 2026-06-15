'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { compressImage, getStoragePathFromUrl } from '../../lib/receiptImage';
import { Camera, ImagePlus, Trash2, X } from 'lucide-react';

interface ReceiptListItem {
  id: string;
  company_name: string;
  total_price: number;
  vat: number;
  created_at: string;
}

interface ScanResult {
  company_name: string;
  total_price: string;
  vat: string;
}

const CARD_STYLE: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #d1fae5',
  borderRadius: '16px',
  padding: '20px',
  boxShadow: '0 2px 12px rgba(16,185,129,0.06)',
};

const BTN_BASE: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '14px 16px',
  borderRadius: '12px',
  fontWeight: '700',
  fontSize: '14px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  border: 'none',
};

export default function ReceiptScannerPage() {
  const [receipts, setReceipts] = useState<ReceiptListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [selected, setSelected] = useState<(ReceiptListItem & { image_url?: string }) | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  const fetchReceipts = useCallback(async () => {
    const { data } = await supabase
      .from('receipts')
      .select('id, company_name, total_price, vat, created_at')
      .order('created_at', { ascending: false });

    if (data) setReceipts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReceipts();
    return () => revokePreview();
  }, [fetchReceipts, revokePreview]);

  const resetScan = useCallback(() => {
    revokePreview();
    setImagePreview(null);
    setCompressedBlob(null);
    setResult(null);
    setScanError(null);
  }, [revokePreview]);

  const processFile = useCallback(async (file: File) => {
    resetScan();
    setScanning(true);

    try {
      const preview = URL.createObjectURL(file);
      previewUrlRef.current = preview;
      setImagePreview(preview);

      const { blob, base64, mediaType } = await compressImage(file);

      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mediaType }),
      });

      const data = await response.json();
      if (!response.ok) {
        setScanError(data.error || 'שגיאה בזיהוי הקבלה');
        setCompressedBlob(blob);
        return;
      }

      setCompressedBlob(blob);
      setResult(data);
    } catch {
      setScanError('שגיאה בעיבוד התמונה. נסה שוב.');
    } finally {
      setScanning(false);
    }
  }, [resetScan]);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (file) processFile(file);
    },
    [processFile]
  );

  const uploadReceiptImage = async (blob: Blob): Promise<string> => {
    const fileName = `${Date.now()}-${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage
      .from('receipts')
      .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });

    if (error) throw error;

    const { data } = supabase.storage.from('receipts').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!result || !compressedBlob || saving) return;
    setSaving(true);

    try {
      let imageUrl: string;
      try {
        imageUrl = await uploadReceiptImage(compressedBlob);
      } catch {
        const reader = new FileReader();
        imageUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(compressedBlob);
        });
      }

      await supabase.from('receipts').insert([
        {
          company_name: result.company_name,
          total_price: Number(result.total_price) || 0,
          vat: Number(result.vat) || 0,
          image_url: imageUrl,
        },
      ]);

      await supabase.from('transactions').insert([
        {
          description: `קבלה: ${result.company_name}`,
          amount: Number(result.total_price) || 0,
          type: 'expense',
        },
      ]);

      resetScan();
      await fetchReceipts();
    } catch {
      setScanError('שגיאה בשמירה. נסה שוב.');
    } finally {
      setSaving(false);
    }
  };

  const openReceipt = async (receipt: ReceiptListItem) => {
    setSelected(receipt);
    setSelectedImage(null);
    setLoadingImage(true);

    const { data } = await supabase
      .from('receipts')
      .select('image_url')
      .eq('id', receipt.id)
      .single();

    setSelectedImage(data?.image_url || null);
    setLoadingImage(false);
  };

  const handleDelete = async (id: string, imageUrl?: string | null) => {
    if (imageUrl && !imageUrl.startsWith('data:')) {
      const path = getStoragePathFromUrl(imageUrl);
      if (path) {
        await supabase.storage.from('receipts').remove([path]);
      }
    }

    await supabase.from('receipts').delete().eq('id', id);
    setSelected(null);
    setSelectedImage(null);
    fetchReceipts();
  };

  const totalExpenses = useMemo(
    () => receipts.reduce((s, r) => s + Number(r.total_price || 0), 0),
    [receipts]
  );

  return (
    <div dir="rtl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: '800',
            margin: 0,
            background: 'linear-gradient(120deg, #059669, #0d9488, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          סורק קבלות
        </h1>
        <p style={{ color: '#6aada0', margin: '4px 0 0', fontSize: '14px' }}>
          {receipts.length} קבלות • סה&quot;כ הוצאות: ₪{totalExpenses.toLocaleString()}
        </p>
      </div>

      <div style={{ ...CARD_STYLE, marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0d2420', marginBottom: '16px' }}>
          סרוק קבלה חדשה
        </h2>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            disabled={scanning || saving}
            onClick={() => cameraInputRef.current?.click()}
            style={{
              ...BTN_BASE,
              background: 'linear-gradient(135deg, #10b981, #0d9488)',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
              opacity: scanning || saving ? 0.6 : 1,
            }}
          >
            <Camera size={18} />
            {scanning ? 'מנתח...' : 'צלם קבלה'}
          </button>

          <button
            type="button"
            disabled={scanning || saving}
            onClick={() => galleryInputRef.current?.click()}
            style={{
              ...BTN_BASE,
              background: '#f0fdf9',
              color: '#0d9488',
              border: '1px solid #a7f3d0',
              opacity: scanning || saving ? 0.6 : 1,
            }}
          >
            <ImagePlus size={18} />
            העלה מגלריה / קבצים
          </button>
        </div>

        <p style={{ color: '#94c9bf', fontSize: '12px', margin: '12px 0 0', textAlign: 'center' }}>
          התמונה תנותח אוטומטית — שם העסק, סכום כולל ומע&quot;מ
        </p>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />

        {scanError && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 14px',
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: '12px',
              color: '#be123c',
              fontSize: '13px',
            }}
          >
            {scanError}
          </div>
        )}

        {imagePreview && (
          <div
            style={{
              marginTop: '20px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
              alignItems: 'start',
            }}
          >
            <img
              src={imagePreview}
              alt="קבלה"
              style={{ width: '100%', borderRadius: '12px', border: '1px solid #d1fae5' }}
            />

            {scanning ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6aada0' }}>
                <p style={{ fontSize: '32px', margin: '0 0 8px' }}>🔍</p>
                <p style={{ margin: 0 }}>מנתח קבלה...</p>
              </div>
            ) : result ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontWeight: '700', color: '#0d2420', marginBottom: '4px' }}>תוצאות זיהוי:</p>
                <div
                  style={{
                    background: '#f0fdf9',
                    border: '1px solid #d1fae5',
                    borderRadius: '12px',
                    padding: '14px',
                  }}
                >
                  <p style={{ fontSize: '13px', color: '#4a7c74', margin: '0 0 8px' }}>
                    <strong>חברה:</strong> {result.company_name || '—'}
                  </p>
                  <p style={{ fontSize: '13px', color: '#4a7c74', margin: '0 0 8px' }}>
                    <strong>סכום כולל:</strong> ₪{result.total_price || '—'}
                  </p>
                  <p style={{ fontSize: '13px', color: '#4a7c74', margin: 0 }}>
                    <strong>מע&quot;מ:</strong> ₪{result.vat || '—'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #0d9488)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: saving ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'שומר...' : 'שמור קבלה'}
                </button>
                <button
                  type="button"
                  onClick={resetScan}
                  style={{
                    background: 'none',
                    color: '#94c9bf',
                    border: '1px solid #d1fae5',
                    borderRadius: '12px',
                    padding: '10px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                  }}
                >
                  ביטול
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div style={CARD_STYLE}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0d2420', marginBottom: '16px' }}>
          היסטוריית קבלות
        </h2>
        {loading ? (
          <p style={{ color: '#94c9bf', textAlign: 'center' }}>טוען...</p>
        ) : receipts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94c9bf' }}>
            <p style={{ fontSize: '36px', margin: '0 0 8px' }}>🧾</p>
            <p style={{ margin: 0 }}>אין קבלות עדיין</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {receipts.map((r, i) => (
              <div
                key={r.id}
                onClick={() => openReceipt(r)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 0',
                  borderBottom: i < receipts.length - 1 ? '1px solid #ecfdf5' : 'none',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <p style={{ fontWeight: '600', color: '#0d2420', fontSize: '14px', margin: 0 }}>
                    {r.company_name || 'לא זוהה'}
                  </p>
                  <p style={{ fontSize: '11px', color: '#94c9bf', margin: '2px 0 0' }}>
                    {new Date(r.created_at).toLocaleDateString('he-IL')} • מע&quot;מ: ₪
                    {Number(r.vat || 0).toLocaleString()}
                  </p>
                </div>
                <p style={{ fontWeight: '700', color: '#f43f5e', fontSize: '16px', margin: 0 }}>
                  ₪{Number(r.total_price || 0).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div
          onClick={() => {
            setSelected(null);
            setSelectedImage(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '24px',
              padding: '28px',
              width: '100%',
              maxWidth: '380px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
              border: '1px solid #d1fae5',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0d2420', margin: 0 }}>
                {selected.company_name}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setSelectedImage(null);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94c9bf' }}
              >
                <X size={22} />
              </button>
            </div>

            {loadingImage ? (
              <p style={{ textAlign: 'center', color: '#94c9bf', padding: '24px' }}>טוען תמונה...</p>
            ) : selectedImage ? (
              <img
                src={selectedImage}
                alt="קבלה"
                loading="lazy"
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  border: '1px solid #d1fae5',
                }}
              />
            ) : null}

            <div
              style={{
                background: '#f0fdf9',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '16px',
              }}
            >
              <p style={{ fontSize: '13px', color: '#4a7c74', margin: '0 0 6px' }}>
                <strong>סכום כולל:</strong> ₪{Number(selected.total_price).toLocaleString()}
              </p>
              <p style={{ fontSize: '13px', color: '#4a7c74', margin: 0 }}>
                <strong>מע&quot;מ:</strong> ₪{Number(selected.vat).toLocaleString()}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleDelete(selected.id, selectedImage)}
              style={{
                width: '100%',
                background: '#fff1f2',
                color: '#f43f5e',
                border: '1px solid #fecdd3',
                borderRadius: '12px',
                padding: '12px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Trash2 size={16} /> מחק קבלה
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
