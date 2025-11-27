import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { sessionId, goal } = await req.json();

        if (!sessionId || !goal) {
            return Response.json({ error: 'Session ID and goal are required' }, { status: 400 });
        }

        // Get the session to book
        const sessions = await base44.entities.Session.filter({ id: sessionId });
        if (sessions.length === 0) {
            return Response.json({ error: 'Session not found' }, { status: 404 });
        }
        const session = sessions[0];

        // Check if session is already booked
        if (session.is_booked && session.status !== 'cancelled') {
            return Response.json({ error: 'This session is already booked' }, { status: 400 });
        }

        // Check if user already has a booked session for this date
        const existingBookings = await base44.entities.Session.filter({
            booked_by: user.email,
            date: session.date,
            is_booked: true
        });

        const activeBookings = existingBookings.filter(s => s.status !== 'cancelled');
        if (activeBookings.length > 0) {
            return Response.json({ 
                error: 'You have already booked a session for this date. You can only book one session per day.' 
            }, { status: 400 });
        }

        // Book the session
        const updatedSession = await base44.asServiceRole.entities.Session.update(sessionId, {
            is_booked: true,
            booked_by: user.email,
            mentee_name: user.full_name,
            mentee_linkedin: user.linkedin_profile || '',
            session_goal: goal,
            status: 'scheduled'
        });

        // Get mentor details for email
        const allMentors = await base44.entities.Mentor.list();
        const mentor = allMentors.find(m => m.full_name === session.mentor_name);

        // Format the session date
        const sessionDate = new Date(session.date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        // Get email addresses
        const mentorEmail = mentor?.email || session.mentor_email || null;
        const menteeEmail = user.email;

        // Send email notifications if we have both emails
        if (mentorEmail && menteeEmail) {
            const serviceId = Deno.env.get("EMAILJS_SERVICE_ID");
            const publicKey = Deno.env.get("EMAILJS_PUBLIC_KEY");
            const mentorTemplateId = 'template_dcek09u';
            const menteeTemplateId = 'template_bsxqzqm';

            if (serviceId && publicKey) {
                const templateParams = {
                    to_email: mentorEmail,
                    mentor_email: mentorEmail,
                    mentee_email: menteeEmail,
                    mentor_name: mentor?.full_name || session.mentor_name,
                    mentee_name: user.full_name,
                    date: sessionDate,
                    time: session.time_slot,
                    mentee_response: goal,
                    mentor_meeting_link: ''
                };

                // Send to mentor
                await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'origin': 'https://base44.com'
                    },
                    body: JSON.stringify({
                        service_id: serviceId,
                        template_id: mentorTemplateId,
                        user_id: publicKey,
                        template_params: templateParams
                    })
                });

                // Send to mentee
                await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'origin': 'https://base44.com'
                    },
                    body: JSON.stringify({
                        service_id: serviceId,
                        template_id: menteeTemplateId,
                        user_id: publicKey,
                        template_params: { ...templateParams, to_email: menteeEmail }
                    })
                });
            }
        }

        return Response.json({ 
            success: true, 
            session: updatedSession,
            emailSent: !!(mentorEmail && menteeEmail)
        });
    } catch (error) {
        console.error('Error booking session:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});