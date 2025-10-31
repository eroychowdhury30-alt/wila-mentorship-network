import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function MenteeQuestionnaire() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    linkedin_profile: ''
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Pre-fill with existing data
      setFormData({
        full_name: currentUser.full_name || '',
        email: currentUser.email || '',
        linkedin_profile: currentUser.linkedin_profile || ''
      });
      
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
    
    if (!formData.full_name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await base44.auth.updateMe({
        user_type: 'mentee',
        onboarding_completed: true,
        full_name: formData.full_name,
        linkedin_profile: formData.linkedin_profile
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
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-lg">
            <div className="text-purple-600 font-bold text-xl">WILA</div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Mentee Profile
          </h1>
          <p className="text-gray-600">
            Tell us a bit about yourself to get started
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
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Your email from your account</p>
              </div>

              <div>
                <Label htmlFor="linkedin_profile">LinkedIn Profile URL</Label>
                <Input
                  id="linkedin_profile"
                  type="url"
                  value={formData.linkedin_profile}
                  onChange={(e) => handleChange('linkedin_profile', e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
                <p className="text-xs text-gray-500 mt-1">Optional - helps mentors learn more about you</p>
              </div>

              <div className="flex gap-3 pt-6">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  {isLoading ? 'Saving...' : 'Complete Profile & Continue'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}