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
      cancelled_by // 'mentor' or 'mentee'
    } = await req.json();

    if (!to || !mentor_name || !session_date || !session_time) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const isMentorCancelling = cancelled_by === 'mentor';
    const subject = `WILA Mentorship Session Cancelled - ${session_date}`;
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Session Cancelled</h1>
  </div>
  
  <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      ${isMentorCancelling 
        ? `Hi ${mentee_name || 'there'},<br><br>We regret to inform you that your mentorship session has been cancelled by the mentor.`
        : `Hi ${mentor_name},<br><br>We wanted to let you know that your mentorship session has been cancelled by the mentee.`
      }
    </p>
    
    <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; font-weight: bold; color: #991b1b;">Cancelled Session Details:</p>
      <p style="margin: 10px 0 0 0;">
        <strong>Date:</strong> ${session_date}<br>
        <strong>Time:</strong> ${session_time}<br>
        <strong>Mentor:</strong> ${mentor_name}<br>
        ${mentee_name ? `<strong>Mentee:</strong> ${mentee_name}` : ''}
      </p>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 20px;">
      ${isMentorCancelling 
        ? 'We encourage you to browse other available mentors and book a new session.'
        : 'The time slot is now available again for other mentees to book.'
      }
    </p>
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="https://wilamentorship.org" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Visit WILA Mentorship
      </a>
    </div>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
    <p>WILA Mentorship Network<br>Connecting Women Leaders</p>
  </div>
</body>
</html>
    `;

    // Use Base44's built-in SendEmail integration
    await base44.integrations.Core.SendEmail({
      to: to,
      subject: subject,
      body: htmlContent,
      from_name: 'WILA Mentorship'
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});