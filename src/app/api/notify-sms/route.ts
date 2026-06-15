import { NextResponse } from 'next/server';

/** שליחת SMS דרך Twilio — הגדר ב-.env.local:
 * TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER, NOTIFY_PHONE
 */
export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'missing message' }, { status: 400 });
    }

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;
    const to = process.env.NOTIFY_PHONE;

    if (!sid || !token || !from || !to) {
      return NextResponse.json({ skipped: true, reason: 'SMS not configured' });
    }

    const toE164 = to.startsWith('+') ? to : `+972${to.replace(/\D/g, '').replace(/^0/, '')}`;

    const body = new URLSearchParams({
      To: toE164,
      From: from,
      Body: message.slice(0, 1500),
    });

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error('Twilio error:', errText);
      return NextResponse.json({ error: 'Twilio failed' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
