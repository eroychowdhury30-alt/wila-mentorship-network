import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      to,
      recipient_name,
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

    if (!to || !mentor_name || !mentee_name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await base44.asServiceRole.integrations.Core.SendEmail({
      to,
      template_name: 'SessionBooked',
      variables: {
        recipient_name: recipient_name || to,
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
      },
    });

    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}