import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      to, 
      mentor_name, 
      mentee_name, 
      session_date, 
      session_time,
      cancelled_by, // 'mentor' or 'mentee'
      recipient_type // 'mentor' or 'mentee' - who is receiving this email
    } = await req.json();

    if (!to || !mentor_name || !session_date || !session_time) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const serviceId = Deno.env.get("EMAILJS_SERVICE_ID");
    const publicKey = Deno.env.get("EMAILJS_PUBLIC_KEY");

    // Use different template based on recipient type
    const menteeTemplateId = "template_yeir2de"; // Cancellation email to mentee
    const mentorTemplateId = "template_mpm1tds"; // Cancellation email to mentor
    const templateId = recipient_type === 'mentee' ? menteeTemplateId : mentorTemplateId;

    if (!serviceId || !publicKey) {
      return Response.json({ error: 'EmailJS not configured' }, { status: 500 });
    }

    // Use EmailJS REST API directly
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
          email: to,
          mentor_name: mentor_name,
          mentee_name: mentee_name || '',
          session_date: session_date,
          session_time: session_time,
          'Time-Slot': session_time,
          cancelled_by: cancelled_by || ''
        }
      })
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('EmailJS error:', responseText);
      return Response.json({ error: 'Failed to send email', details: responseText }, { status: response.status });
    }

    console.log('EmailJS cancellation email sent:', responseText);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});