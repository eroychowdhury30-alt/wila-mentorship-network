import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { 
            mentor_email, 
            mentee_email, 
            mentor_name, 
            mentee_name, 
            booking_datetime,
            mentee_info,
            meeting_link
        } = await req.json();

        if (!mentor_email || !mentee_email || !mentor_name || !mentee_name || !booking_datetime) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const serviceId = Deno.env.get("EMAILJS_SERVICE_ID");
        const templateId = Deno.env.get("EMAILJS_TEMPLATE_ID");
        const publicKey = Deno.env.get("EMAILJS_PUBLIC_KEY");

        if (!serviceId || !templateId || !publicKey) {
            return Response.json({ error: 'EmailJS not configured' }, { status: 500 });
        }

        // Send email to mentor
        const mentorResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
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
                    mentor_email: mentor_email,
                    mentee_email: mentee_email,
                    mentor_name: mentor_name,
                    mentee_name: mentee_name,
                    booking_datetime: booking_datetime,
                    mentee_info: mentee_info || '',
                    meeting_link: meeting_link || ''
                }
            })
        });

        const mentorResponseText = await mentorResponse.text();
        console.log('EmailJS mentor response:', mentorResponseText);
        
        if (!mentorResponse.ok) {
            console.error('EmailJS mentor error:', mentorResponseText);
            return Response.json({ error: 'Failed to send email to mentor', details: mentorResponseText }, { status: mentorResponse.status });
        }

        return Response.json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});