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
            mentor_email,
            mentee_email,
            session_date, 
            session_time, 
            meeting_link,
            mentee_response,
            mentee_linkedin,
            recipient_type // 'mentor' or 'mentee'
        } = await req.json();

        if (!to || !mentor_name || !mentee_name || !session_date || !session_time) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const serviceId = Deno.env.get("EMAILJS_SERVICE_ID");
        const publicKey = Deno.env.get("EMAILJS_PUBLIC_KEY");
        
        // Use different template based on recipient type
        const mentorTemplateId = Deno.env.get("EMAILJS_TEMPLATE_ID");
        const menteeTemplateId = Deno.env.get("EMAILJS_MENTEE_TEMPLATE_ID");
        const templateId = recipient_type === 'mentee' ? menteeTemplateId : mentorTemplateId;

        console.log('=== EMAIL DEBUG ===');
        console.log('To:', to);
        console.log('Recipient type:', recipient_type);
        console.log('Using template:', templateId);
        console.log('Session time:', session_time);
        console.log('Session date:', session_date);
        console.log('Mentor name:', mentor_name);
        console.log('Mentee name:', mentee_name);

        if (!serviceId || !publicKey) {
            return Response.json({ error: 'EmailJS not configured' }, { status: 500 });
        }

        if (!templateId) {
            console.error('Template ID missing for recipient_type:', recipient_type);
            return Response.json({ error: `Template ID not configured for ${recipient_type}` }, { status: 500 });
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
                    mentee_name: mentee_name,
                    mentor_email: mentor_email || '',
                    mentee_email: mentee_email || '',
                    session_date: session_date,
                    session_time: session_time,
                    time_slot: session_time,
                    meeting_link: meeting_link || '',
                    mentee_response: mentee_response || '',
                    mentee_reason: mentee_response || '',
                    mentee_linkedin: mentee_linkedin || ''
                }
            })
        });

        const responseText = await response.text();
        
        if (!response.ok) {
            console.error('EmailJS error:', responseText);
            return Response.json({ error: 'Failed to send email', details: responseText }, { status: response.status });
        }

        console.log('EmailJS response:', responseText);
        return Response.json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});