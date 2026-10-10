import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

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

    // Universal confirmation email — identical content for mentor and mentee
    const variables = {
      mentor_name: mentor_name || '',
      mentor_email: mentor_email || '',
      mentee_name: mentee_name || '',
      mentee_email: mentee_email || '',
      session_date: session_date || '',
      session_time: session_time || '',
      duration: duration || '30 minutes',
      meeting_link: meeting_link || '',
      mentee_linkedin: mentee_linkedin || '',
      mentee_notes: mentee_notes || '',
    };

    const results = await Promise.all(
      list.map((r) =>
        base44.asServiceRole.integrations.Core.SendEmail({
          to: r.email,
          template_name: 'SessionBooked',
          variables: { ...variables, recipient_name: r.name || r.email },
        })
      )
    );

    return Response.json({ success: true, sent: list.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}