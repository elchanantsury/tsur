import { NextResponse } from 'next/server';

const SCAN_PROMPT =
  'זוהי קבלה או חשבונית ישראלית. חלץ מהתמונה: שם העסק/חברה, הסכום הכולל לתשלום (כולל מע"מ), וסכום המע"מ בלבד. ' +
  'ענה רק ב-JSON תקין ללא markdown: {"company_name":"...","total_price":"...","vat":"..."}. ' +
  'total_price ו-vat חייבים להיות מספרים בלבד (ללא ₪, פסיקים או רווחים). אם שדה לא קיים, שים "0" לסכומים או "" לשם.';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'זיהוי קבלות לא מוגדר. הוסף ANTHROPIC_API_KEY ל-.env.local' },
        { status: 503 }
      );
    }

    const { image, mediaType } = await req.json();
    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'חסרה תמונה' }, { status: 400 });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType || 'image/jpeg',
                  data: image,
                },
              },
              { type: 'text', text: SCAN_PROMPT },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic scan error:', errText);
      return NextResponse.json({ error: 'שגיאה בזיהוי הקבלה' }, { status: 502 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json({
      company_name: String(parsed.company_name || '').trim(),
      total_price: String(parsed.total_price ?? '0').replace(/[^\d.]/g, '') || '0',
      vat: String(parsed.vat ?? '0').replace(/[^\d.]/g, '') || '0',
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'שגיאה בעיבוד הקבלה' }, { status: 500 });
  }
}
