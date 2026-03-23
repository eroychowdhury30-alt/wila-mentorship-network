import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const TEAMUP_API_BASE = 'https://api.teamup.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const TEAMUP_API_KEY = Deno.env.get('TEAMUP_API_KEY');
    
    if (!TEAMUP_API_KEY) {
      return Response.json({ error: 'Teamup API key not configured' }, { status: 500 });
    }

    const { action, calendarKey, eventData, eventId, startDate, endDate } = await req.json();

    const headers = {
      'Teamup-Token': TEAMUP_API_KEY,
      'Content-Type': 'application/json',
    };

    let response;
    let result;

    switch (action) {
      case 'getEvents':
        // Get events from calendar
        const eventsUrl = `${TEAMUP_API_BASE}/${calendarKey}/events?startDate=${startDate}&endDate=${endDate}`;
        response = await fetch(eventsUrl, { headers });
        result = await response.json();
        break;

      case 'createEvent':
        // Create a new event
        response = await fetch(`${TEAMUP_API_BASE}/${calendarKey}/events`, {
          method: 'POST',
          headers,
          body: JSON.stringify(eventData),
        });
        result = await response.json();
        break;

      case 'updateEvent':
        // Update an existing event
        response = await fetch(`${TEAMUP_API_BASE}/${calendarKey}/events/${eventId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(eventData),
        });
        result = await response.json();
        break;

      case 'deleteEvent':
        // Delete an event
        response = await fetch(`${TEAMUP_API_BASE}/${calendarKey}/events/${eventId}`, {
          method: 'DELETE',
          headers,
        });
        result = { success: response.ok };
        break;

      case 'getCalendars':
        // Get sub-calendars
        response = await fetch(`${TEAMUP_API_BASE}/${calendarKey}/subcalendars`, { headers });
        result = await response.json();
        break;

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!response.ok) {
      console.error('Teamup error:', result);
      return Response.json({ error: result.error || 'Teamup API error' }, { status: response.status });
    }

    return Response.json(result);
  } catch (error) {
    console.error('Teamup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});