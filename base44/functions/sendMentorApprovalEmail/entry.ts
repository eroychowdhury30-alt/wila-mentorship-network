import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { secrets } from 'base44:runtime';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || !['admin', 'superadmin', 'moderator'].includes(user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { to, full_name } = await req.json();

    if (!to) {
      return Response.json({ error: 'Missing mentor email' }, { status: 400 });
    }

    const serviceId = secrets.get("EMAILJS_SERVICE_ID");
    const publicKey = secrets.get("EMAILJS_PUBLIC_KEY");
    const templateId = secrets.get("EMAILJS_APPROVAL_TEMPLATE_ID");

    if (!serviceId || !publicKey || !templateId) {
      return Response.json({ error: 'EmailJS not configured' }, { status: 500 });
    }

    const firstName = (full_name || '').split(' ')[0] || 'there';

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'origin': 'https://base44.com'
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_email: to,
          email: to,
          mentor_name: full_name || '',
          first_name: firstName,
          reply_to: 'berkeleyhaaswomen@gmail.com'
        }
      })
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('EmailJS error:', responseText);
      return Response.json({ error: 'Failed to send email', details: responseText }, { status: response.status });
    }

    console.log('Approval email sent to:', to);
    return Response.json({ success: true, message: 'Approval email sent successfully' });
  } catch (error) {
    console.error('Error sending approval email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}