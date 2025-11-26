import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { to, recipient_name, mentor_name, mentee_name, booking_datetime, email_type } = await req.json();

        if (!to || !recipient_name || !mentor_name || !mentee_name || !booking_datetime) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const serviceId = Deno.env.get("EMAILJS_SERVICE_ID");
        const templateId = Deno.env.get("EMAILJS_TEMPLATE_ID");
        const publicKey = Deno.env.get("EMAILJS_PUBLIC_KEY");
        const privateKey = Deno.env.get("EMAILJS_PRIVATE_KEY");

        if (!serviceId || !templateId || !publicKey || !privateKey) {
            return Response.json({ error: 'EmailJS not configured' }, { status: 500 });
        }

        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                service_id: serviceId,
                template_id: templateId,
                user_id: publicKey,
                accessToken: privateKey,
                template_params: {
                    to_email: to,
                    recipient_name: recipient_name,
                    mentor_name: mentor_name,
                    mentee_name: mentee_name,
                    booking_datetime: booking_datetime,
                    email_type: email_type || 'booking'
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('EmailJS error:', errorText);
            return Response.json({ error: 'Failed to send email', details: errorText }, { status: response.status });
        }

        return Response.json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});