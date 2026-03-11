import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function MenteeQuestionnaire({ onBack, onSubmit, isLoading }) {
  const [responses, setResponses] = useState({
    goals: [],
    experience_level: '',
    industries: [],
    skills_to_develop: '',
    mentoring_style: ''
  });

  const goalOptions = [
    'Career transition',
    'Leadership development',
    'Technical skills',
    'Entrepreneurship',
    'Work-life balance',
    'Negotiation & compensation',
    'Industry insights',
    'Networking guidance'
  ];

  const experienceLevels = [
    'Entry-level (0-2 years)',
    'Mid-level (2-5 years)',
    'Senior (5-10 years)',
    'Executive (10+ years)'
  ];

  const industries = [
    'Technology',
    'Finance',
    'Consulting',
    'Healthcare',
    'Education',
    'Marketing',
    'Operations',
    'Human Resources',
    'Product Management',
    'Sales & Business Development'
  ];

  const mentorStyles = [
    'Hands-on guidance & detailed advice',
    'Strategic thinking & big-picture perspective',
    'Challenging questions & self-discovery',
    'Networking & introductions',
    'Mixed approach'
  ];

  const handleGoalToggle = (goal) => {
    setResponses(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const handleIndustryToggle = (industry) => {
    setResponses(prev => ({
      ...prev,
      industries: prev.industries.includes(industry)
        ? prev.industries.filter(i => i !== industry)
        : [...prev.industries, industry]
    }));
  };

  const isComplete = responses.goals.length > 0 && responses.experience_level && responses.mentoring_style;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#003262] hover:text-[#001a35] mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-6 h-6" style={{color:'#003262'}} />
              <CardTitle className="text-2xl">Find Your Mentor Match</CardTitle>
            </div>
            <p className="text-gray-600 text-sm">Tell us about your goals and we'll match you with the perfect mentor</p>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Goals */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">What are your primary goals? *</h3>
              <div className="space-y-3">
                {goalOptions.map(goal => (
                  <div key={goal} className="flex items-center gap-3">
                    <Checkbox
                      id={goal}
                      checked={responses.goals.includes(goal)}
                      onCheckedChange={() => handleGoalToggle(goal)}
                    />
                    <Label htmlFor={goal} className="cursor-pointer text-gray-700">
                      {goal}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Experience Level */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">What's your current experience level? *</h3>
              <Select value={responses.experience_level} onValueChange={(value) => setResponses(prev => ({...prev, experience_level: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your experience level" />
                </SelectTrigger>
                <SelectContent>
                  {experienceLevels.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Industries */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Which industries interest you? (optional)</h3>
              <div className="space-y-3">
                {industries.map(industry => (
                  <div key={industry} className="flex items-center gap-3">
                    <Checkbox
                      id={industry}
                      checked={responses.industries.includes(industry)}
                      onCheckedChange={() => handleIndustryToggle(industry)}
                    />
                    <Label htmlFor={industry} className="cursor-pointer text-gray-700">
                      {industry}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">What skills would you like to develop?</h3>
              <Textarea
                placeholder="e.g., public speaking, data analysis, team management, etc."
                value={responses.skills_to_develop}
                onChange={(e) => setResponses(prev => ({...prev, skills_to_develop: e.target.value}))}
                rows={4}
              />
            </div>

            {/* Mentoring Style */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">What mentoring style do you prefer? *</h3>
              <Select value={responses.mentoring_style} onValueChange={(value) => setResponses(prev => ({...prev, mentoring_style: value}))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your preferred style" />
                </SelectTrigger>
                <SelectContent>
                  {mentorStyles.map(style => (
                    <SelectItem key={style} value={style}>{style}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={onBack}>Cancel</Button>
              <Button
                onClick={() => onSubmit(responses)}
                disabled={!isComplete || isLoading}
                className="flex-1"
                style={{background: '#003262'}}
              >
                {isLoading ? 'Finding your match...' : 'Find My Mentor Match'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}