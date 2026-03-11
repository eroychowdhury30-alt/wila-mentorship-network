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

    // Map experience levels to mentor years
    const experienceLevelMap = {
      'Entry-level (0-2 years)': ['1-2 years', '2-5 years'],
      'Mid-level (2-5 years)': ['2-5 years', '5-10 years'],
      'Senior (5-10 years)': ['5-10 years', '10+ years'],
      'Executive (10+ years)': ['10+ years']
    };

    const compatibleExperienceLevels = experienceLevelMap[experience_level] || [];

    // Scoring function
    const scoreMentor = (mentor) => {
      let score = 0;

      // 1. Expertise match (40 points max)
      if (mentor.expertise && mentor.expertise.length > 0) {
        const goalsLower = mentee_goals.map(g => g.toLowerCase());
        const expertiseMatches = mentor.expertise.filter(exp =>
          goalsLower.some(goal => 
            goal.includes(exp.toLowerCase()) || exp.toLowerCase().includes(goal)
          )
        );
        score += (expertiseMatches.length / mentor.expertise.length) * 40;
      }

      // 2. Target mentee match (25 points max)
      if (mentor.mentors_to && mentor.mentors_to.length > 0) {
        const menteesToLower = mentor.mentors_to.map(m => m.toLowerCase());
        const levelMatch = menteesToLower.some(m =>
          m.includes('all') ||
          (experience_level.includes('Entry') && m.includes('entry')) ||
          (experience_level.includes('Mid') && m.includes('mid')) ||
          (experience_level.includes('Senior') && m.includes('senior')) ||
          (experience_level.includes('Executive') && m.includes('exec'))
        );
        if (levelMatch) score += 25;
      }

      // 3. Industry match (20 points max)
      if (industries.length > 0 && mentor.expertise && mentor.expertise.length > 0) {
        const industriesLower = industries.map(i => i.toLowerCase());
        const industryMatches = mentor.expertise.filter(exp =>
          industriesLower.some(ind => exp.toLowerCase().includes(ind))
        );
        score += (industryMatches.length / Math.max(industries.length, mentor.expertise.length)) * 20;
      }

      // 4. Experience level compatibility (15 points max)
      if (compatibleExperienceLevels.length > 0 && mentor.experience_years) {
        const mentorExpLower = mentor.experience_years.toLowerCase();
        const isCompatible = compatibleExperienceLevels.some(level =>
          mentorExpLower.includes(level.toLowerCase()) ||
          (level === '10+ years' && (mentorExpLower.includes('10+') || mentorExpLower.includes('15')))
        );
        if (isCompatible) score += 15;
      }

      return score;
    };

    // Score all mentors
    const scoredMentors = mentors
      .map(mentor => ({
        ...mentor,
        matchScore: scoreMentor(mentor)
      }))
      .filter(m => m.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5); // Return top 5 matches

    return Response.json({
      matched_mentors: scoredMentors,
      total_matched: scoredMentors.length
    });
  } catch (error) {
    console.error('Smart matching error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});