import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'superadmin') {
      return Response.json({ error: 'Forbidden - SuperAdmin only' }, { status: 403 });
    }

    const { audience, subject, body } = await req.json();
    if (!audience || !subject?.trim() || !body?.trim()) {
      return Response.json({ error: 'audience, subject and body are required' }, { status: 400 });
    }
    if (!['all', 'mentors', 'mentees'].includes(audience)) {
      return Response.json({ error: 'Invalid audience' }, { status: 400 });
    }

    const users = await base44.entities.User.list();
    let recipients = users.filter(u => u.email);
    if (audience === 'mentors') {
      recipients = recipients.filter(u => u.user_type === 'mentor');
    } else if (audience === 'mentees') {
      recipients = recipients.filter(u => u.user_type === 'mentee');
    }

    const emails = [...new Set(recipients.map(u => u.email))];
    if (emails.length === 0) {
      return Response.json({ error: 'No recipients found for this audience' }, { status: 400 });
    }

    let sent = 0;
    const failed = [];
    const CHUNK_SIZE = 10;
    for (let i = 0; i < emails.length; i += CHUNK_SIZE) {
      const chunk = emails.slice(i, i + CHUNK_SIZE);
      const results = await Promise.allSettled(chunk.map(to =>
        base44.asServiceRole.integrations.Core.SendEmail({
          to,
          subject: subject.trim(),
          body: body.trim(),
          from_name: 'WILA Mentorship Network',
        })
      ));
      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          sent += 1;
        } else {
          failed.push({ to: chunk[idx], error: result.reason?.message || 'send failed' });
        }
      });
    }

    return Response.json({
      success: true,
      sent,
      failed_count: failed.length,
      failed: failed.slice(0, 10),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}