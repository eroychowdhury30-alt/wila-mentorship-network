import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Universal session booking confirmation template (EmailJS).
// The same template and content is sent to both the mentor and the mentee.
const EMAILJS_TEMPLATE_ID = 'template_myelvma';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      recipients, // [{ email, name }] — the mentor and the mentee
      mentor_name,
      mentor_email,
      mentee_name,
      mentee_email,
      session_date,
      session_time,
      duration,
      meeting_link,
      mentee_linkedin,
      mentee_notes,
    } = await req.json();

    // Accept either an array of recipients or a single address
    const list = (Array.isArray(recipients) ? recipients : [recipients])
      .map((r) => (typeof r === 'string' ? { email: r } : r))
      .filter((r) => r && r.email);

    if (list.length === 0 || !mentor_name || !mentee_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const serviceId = Deno.env.get('EMAILJS_SERVICE_ID');
    const publicKey = Deno.env.get('EMAILJS_PUBLIC_KEY');

    if (!serviceId || !publicKey) {
      return Response.json({ error: 'EmailJS not configured' }, { status: 500 });
    }

    const sharedParams = {
      mentor_name: mentor_name || '',
      mentor_email: mentor_email || '',
      mentee_name: mentee_name || '',
      mentee_email: mentee_email || '',
      session_date: session_date || '',
      session_time: session_time || '',
      time_slot: session_time || '',
      duration: duration || '30 minutes',
      meeting_link: meeting_link || '',
      mentee_linkedin: mentee_linkedin || '',
      mentee_notes: mentee_notes || '',
      // Hyphenated aliases — the EmailJS template uses {{mentor-name}} style names
      'mentor-name': mentor_name || '',
      'mentor-email': mentor_email || '',
      'mentee-name': mentee_name || '',
      'mentee-email': mentee_email || '',
      'session-date': session_date || '',
      'session-time': session_time || '',
      'meeting-link': meeting_link || '',
      'mentee-linkedin': mentee_linkedin || '',
      'mentee-notes': mentee_notes || '',
    };

    const results = [];
    for (const r of list) {
      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          origin: 'https://base44.com',
        },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: publicKey,
          template_params: {
            ...sharedParams,
            to_email: r.email,
            email: r.email,
            recipient_name: r.name || r.email,
            recipient_email: r.email,
          },
        }),
      });
      const responseText = await res.text();
      results.push({ to: r.email, ok: res.ok, response: responseText });
    }

    return Response.json({ success: true, sent: list.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}