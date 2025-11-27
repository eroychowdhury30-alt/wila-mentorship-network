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
            date,
            time,
            mentee_response,
            mentor_meeting_link
        } = await req.json();

        if (!mentor_email || !mentee_email || !mentor_name || !mentee_name || !date || !time) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const serviceId = Deno.env.get("EMAILJS_SERVICE_ID");
        const publicKey = Deno.env.get("EMAILJS_PUBLIC_KEY");
        const templateId = Deno.env.get("EMAILJS_TEMPLATE_ID");

        if (!serviceId || !publicKey) {
            return Response.json({ error: 'EmailJS not configured' }, { status: 500 });
        }

        const templateParams = {
            to_email: mentor_email,  // For mentor template "To:" field
            mentor_email: mentor_email,
            mentee_email: mentee_email,
            mentor_name: mentor_name,
            mentee_name: mentee_name,
            date: date,
            time: time,
            mentee_response: mentee_response || '',
            mentor_meeting_link: mentor_meeting_link || ''
        };

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
                template_params: templateParams
            })
        });

        const mentorResponseText = await mentorResponse.text();
        console.log('EmailJS mentor response:', mentorResponseText);

        // Send email to mentee
        const menteeTemplateParams = {
            ...templateParams,
            to_email: mentee_email
        };
        
        const menteeResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'origin': 'https://base44.com'
            },
            body: JSON.stringify({
                service_id: serviceId,
                template_id: templateId,
                user_id: publicKey,
                template_params: menteeTemplateParams
            })
        });

        const menteeResponseText = await menteeResponse.text();
        console.log('EmailJS mentee response:', menteeResponseText);
        
        if (!mentorResponse.ok || !menteeResponse.ok) {
            console.error('EmailJS error - mentor:', mentorResponseText, 'mentee:', menteeResponseText);
            return Response.json({ 
                error: 'Failed to send one or more emails', 
                mentorStatus: mentorResponse.ok,
                menteeStatus: menteeResponse.ok
            }, { status: 500 });
        }

        return Response.json({ success: true, message: 'Emails sent to both mentor and mentee' });
    } catch (error) {
        console.error('Error sending email:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});