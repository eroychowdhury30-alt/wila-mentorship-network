import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin' && user?.role !== 'superadmin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { to, subject, body } = await req.json();

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'WILA Mentorship Network <onboarding@resend.dev>',
        to: [to],
        subject,
        html: body,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return Response.json({ error: data }, { status: 400 });
    }

    return Response.json({ success: true, data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});