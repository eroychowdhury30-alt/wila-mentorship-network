import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle, Briefcase, Target, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function MenteeQuestionnaire() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    current_role: '',
    current_company: '',
    years_of_experience: '',
    education_level: '',
    areas_of_interest: '',
    career_goals: '',
    what_seeking: ''
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // If already completed questionnaire, redirect to home
      if (currentUser.onboarding_completed) {
        navigate(createPageUrl('Home'));
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      navigate(createPageUrl('Welcome'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.current_role || !formData.career_goals || !formData.what_seeking) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await base44.auth.updateMe({
        user_type: 'mentee',
        onboarding_completed: true,
        mentee_profile: formData
      });

      toast.success('Profile completed successfully!');
      navigate(createPageUrl('Home'));
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-lg">
            <div className="text-purple-600 font-bold text-xl">WILA</div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Mentee Profile
          </h1>
          <p className="text-gray-600">
            Tell us a bit about yourself to help us match you with the right mentors
          </p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-purple-600" />
              Your Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="flex items-center gap-2">
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    value={user.full_name}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Your name from your account</p>
                </div>

                <div>
                  <Label htmlFor="email" className="flex items-center gap-2">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    value={user.email}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>

              {/* Professional Info */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-purple-600" />
                  Professional Background
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="current_role">Current Role / Position *</Label>
                    <Input
                      id="current_role"
                      placeholder="e.g., Marketing Manager, Student, Job Seeker"
                      value={formData.current_role}
                      onChange={(e) => handleChange('current_role', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="current_company">Current Company / Organization</Label>
                    <Input
                      id="current_company"
                      placeholder="e.g., Tech Corp, UC Berkeley, Self-employed"
                      value={formData.current_company}
                      onChange={(e) => handleChange('current_company', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="years_of_experience">Years of Professional Experience</Label>
                    <Select
                      value={formData.years_of_experience}
                      onValueChange={(value) => handleChange('years_of_experience', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student / No experience</SelectItem>
                        <SelectItem value="0-2">0-2 years</SelectItem>
                        <SelectItem value="3-5">3-5 years</SelectItem>
                        <SelectItem value="6-10">6-10 years</SelectItem>
                        <SelectItem value="10+">10+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="education_level">Highest Education Level</Label>
                    <Select
                      value={formData.education_level}
                      onValueChange={(value) => handleChange('education_level', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select education level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high_school">High School</SelectItem>
                        <SelectItem value="some_college">Some College</SelectItem>
                        <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                        <SelectItem value="masters">Master's Degree</SelectItem>
                        <SelectItem value="phd">PhD / Doctorate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Career Goals */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Your Mentorship Goals
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="areas_of_interest">Areas of Interest</Label>
                    <Input
                      id="areas_of_interest"
                      placeholder="e.g., Marketing, Product Management, Entrepreneurship"
                      value={formData.areas_of_interest}
                      onChange={(e) => handleChange('areas_of_interest', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="career_goals">What are your career goals? *</Label>
                    <Textarea
                      id="career_goals"
                      placeholder="Describe your career aspirations and what you hope to achieve..."
                      value={formData.career_goals}
                      onChange={(e) => handleChange('career_goals', e.target.value)}
                      rows={4}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="what_seeking">What are you seeking from a mentor? *</Label>
                    <Textarea
                      id="what_seeking"
                      placeholder="e.g., Career advice, industry insights, networking guidance, interview prep..."
                      value={formData.what_seeking}
                      onChange={(e) => handleChange('what_seeking', e.target.value)}
                      rows={4}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  {isLoading ? 'Saving...' : 'Complete Profile & Start Browsing'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}