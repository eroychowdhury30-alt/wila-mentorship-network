import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const payload = await req.json();
    const {
      mentee_goals,
      experience_level,
      industries,
      skills,
      mentoring_style,
      mentors
    } = payload;

    // Format mentor data for AI
    const mentorProfiles = mentors.map(m => ({
      id: m.id,
      name: m.full_name,
      title: m.title,
      company: m.company,
      expertise: m.expertise || [],
      experience: m.experience_years,
      mentors_to: m.mentors_to || [],
      bio: m.bio
    }));

    // Use AI to find best matches
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert mentor matching assistant. Match the following mentee profile with the best mentor candidates from the list provided.

MENTEE PROFILE:
- Goals: ${mentee_goals.join(', ')}
- Experience Level: ${experience_level}
- Industries of Interest: ${industries.join(', ')}
- Skills to Develop: ${skills.join(', ')}
- Preferred Mentoring Style: ${mentoring_style}

AVAILABLE MENTORS:
${mentorProfiles.map((m, i) => `
${i + 1}. ${m.name}
   Title: ${m.title} at ${m.company}
   Experience: ${m.experience}
   Expertise: ${m.expertise.join(', ')}
   Mentors: ${m.mentors_to.join(', ')}
   Bio: ${m.bio || 'No bio provided'}
`).join('\n')}

Return the TOP 5 BEST MATCHES as a JSON array with the mentor names in order of fit. Consider expertise alignment, experience level match, career goals alignment, and mentoring style compatibility.`,
      response_json_schema: {
        type: "object",
        properties: {
          matched_mentor_names: {
            type: "array",
            items: { type: "string" },
            description: "Names of matched mentors in order of best fit"
          },
          reasoning: {
            type: "string",
            description: "Brief explanation of the matching logic"
          }
        },
        required: ["matched_mentor_names"]
      }
    });

    // Map matched names back to full mentor objects
    const matchedMentors = result.matched_mentor_names
      .map(name => mentors.find(m => m.full_name === name))
      .filter(m => m !== undefined);

    return Response.json({
      matched_mentors: matchedMentors,
      total_matched: matchedMentors.length,
      reasoning: result.reasoning
    });
  } catch (error) {
    console.error('Smart matching error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});