import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface ReportProof {
  branch: string;
  date?: string;
  round?: number;
  signature_url?: string | null;
  image_url?: string | null;
  checklist?: {
    infinity?: boolean;
    windows?: boolean;
    height?: boolean;
    other?: boolean;
  };
  other_text?: string;
  total_price?: number;
}

const PAGE_WIDTH_PX = 720;
/** גובה משוער לעמוד A4 ביחס לרוחב 720px */
const PAGE_MAX_HEIGHT_PX = 980;
const CARD_GAP_PX = 14;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildTasksList(report: ReportProof): string {
  const tasks: string[] = [];
  if (report.checklist?.infinity) tasks.push('ניקיון אינפיניטי');
  if (report.checklist?.windows) tasks.push('ניקיון חלונות');
  if (report.checklist?.height) tasks.push('עבודה בגובה');
  if (report.checklist?.other && report.other_text) tasks.push(`אחר: ${report.other_text}`);
  return tasks.length ? tasks.join(' · ') : '—';
}

/** הערכת גובה כרטיס — לקביעת כמה סניפים בעמוד */
function estimateCardHeight(report: ReportProof): number {
  let h = 108; // כותרת + עבודות
  const hasSig = !!report.signature_url;
  const hasPhoto = !!report.image_url;
  if (hasSig && hasPhoto) h += 108;
  else if (hasSig || hasPhoto) h += 108;
  return h;
}

function packReportsIntoPages(reports: ReportProof[]): ReportProof[][] {
  const pages: ReportProof[][] = [];
  let current: ReportProof[] = [];
  let currentHeight = 0;

  for (const report of reports) {
    const cardH = estimateCardHeight(report);
    const addedHeight = current.length === 0 ? cardH : CARD_GAP_PX + cardH;

    if (current.length > 0 && currentHeight + addedHeight > PAGE_MAX_HEIGHT_PX) {
      pages.push(current);
      current = [report];
      currentHeight = cardH;
    } else {
      current.push(report);
      currentHeight += addedHeight;
    }
  }

  if (current.length > 0) pages.push(current);
  return pages;
}

function buildImagesRow(report: ReportProof): string {
  const blocks: string[] = [];

  if (report.signature_url) {
    blocks.push(`
      <div style="flex:1;min-width:0;text-align:center;">
        <p style="font-size:11px;font-weight:700;color:#047857;margin:0 0 4px;">חתימה</p>
        <img src="${report.signature_url}" alt="חתימה"
          style="max-height:82px;max-width:100%;width:auto;height:auto;object-fit:contain;
          border:1px solid #d1fae5;border-radius:8px;display:block;margin:0 auto;background:#fff;" />
      </div>`);
  }

  if (report.image_url) {
    blocks.push(`
      <div style="flex:1;min-width:0;text-align:center;">
        <p style="font-size:11px;font-weight:700;color:#047857;margin:0 0 4px;">תמונה</p>
        <img src="${report.image_url}" alt="תמונה"
          style="max-height:82px;max-width:100%;width:auto;height:auto;object-fit:contain;
          border:1px solid #d1fae5;border-radius:8px;display:block;margin:0 auto;" />
      </div>`);
  }

  if (!blocks.length) return '';
  return `<div style="display:flex;gap:10px;margin-top:10px;align-items:flex-start;">${blocks.join('')}</div>`;
}

function buildReportCardHtml(report: ReportProof, index: number): string {
  const meta = [
    report.date,
    report.round ? `סבב ${report.round}` : '',
    report.total_price != null ? `₪${Number(report.total_price).toLocaleString()}` : '',
  ].filter(Boolean).join(' · ');

  return `
    <div style="border:1px solid #d1fae5;border-radius:12px;padding:12px 14px;background:#f8fffe;
      box-sizing:border-box;">
      <p style="font-size:10px;color:#94c9bf;margin:0 0 2px;">#${index + 1}</p>
      <h3 style="font-size:17px;font-weight:800;margin:0;color:#0d2420;line-height:1.25;">
        ${escapeHtml(report.branch)}
      </h3>
      ${meta ? `<p style="font-size:12px;color:#6aada0;margin:4px 0 0;">${escapeHtml(meta)}</p>` : ''}
      <p style="font-size:16px;font-weight:700;color:#134e4a;margin:10px 0 0;line-height:1.5;">
        עבודות שבוצעו:
        <span style="font-size:15px;font-weight:600;color:#0d2420;">${escapeHtml(buildTasksList(report))}</span>
      </p>
      ${buildImagesRow(report)}
    </div>`;
}

function createPageElement(reports: ReportProof[], startIndex: number): HTMLDivElement {
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; left: -9999px; top: 0; z-index: -1;
    width: ${PAGE_WIDTH_PX}px; padding: 18px 20px; background: #ffffff;
    font-family: 'Plus Jakarta Sans', Arial, sans-serif;
    direction: rtl; color: #0d2420; box-sizing: border-box;
  `;

  const cards = reports
    .map((r, i) => buildReportCardHtml(r, startIndex + i))
    .join(`<div style="height:${CARD_GAP_PX}px;"></div>`);

  container.innerHTML = `
    <div style="border-bottom:2px solid #d1fae5;padding-bottom:10px;margin-bottom:14px;">
      <p style="font-size:13px;font-weight:800;color:#047857;margin:0;">Tzur Clean — הוכחות סגירת סניפים</p>
      <p style="font-size:11px;color:#6aada0;margin:4px 0 0;">
        ${reports.length} סניפים בעמוד זה
      </p>
    </div>
    ${cards}
  `;

  return container;
}

async function waitForImages(el: HTMLElement): Promise<void> {
  const images = Array.from(el.querySelectorAll('img'));
  await Promise.all(
    images.map(
      img =>
        new Promise<void>(resolve => {
          if (img.complete) resolve();
          else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        })
    )
  );
}

export async function downloadReportsProofsPdf(reports: ReportProof[]): Promise<boolean> {
  const withProofs = reports.filter(r => r.signature_url || r.image_url);

  if (withProofs.length === 0) {
    alert('אין חתימות או תמונות להורדה');
    return false;
  }

  const pageGroups = packReportsIntoPages(withProofs);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const maxImgHeight = pageHeight - margin * 2;
  const maxImgWidth = pageWidth - margin * 2;

  let reportIndex = 0;

  for (let p = 0; p < pageGroups.length; p++) {
    const group = pageGroups[p];
    const el = createPageElement(group, reportIndex);
    document.body.appendChild(el);
    await waitForImages(el);

    const canvas = await html2canvas(el, {
      scale: 1.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    document.body.removeChild(el);
    reportIndex += group.length;

    const imgData = canvas.toDataURL('image/jpeg', 0.88);
    let imgWidth = maxImgWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight > maxImgHeight) {
      imgHeight = maxImgHeight;
      imgWidth = (canvas.width * imgHeight) / canvas.height;
    }

    const x = margin + (maxImgWidth - imgWidth) / 2;

    if (p > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', x, margin, imgWidth, imgHeight);
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  pdf.save(`tzur-proofs-${dateStr}.pdf`);
  return true;
}
