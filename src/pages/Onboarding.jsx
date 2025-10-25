import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      if (currentUser.onboarding_completed && currentUser.user_type) {
        if (currentUser.user_type === 'mentor') {
          navigate(createPageUrl('MentorDashboard'));
        } else {
          navigate(createPageUrl('Home'));
        }
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setIsLoading(false);
    }
  };

  const handleSelectUserType = async (userType) => {
    setIsLoading(true);
    try {
      await base44.auth.updateMe({
        user_type: userType,
        onboarding_completed: true
      });

      if (userType === 'mentor') {
        navigate(createPageUrl('MentorDashboard'));
      } else {
        navigate(createPageUrl('Home'));
      }
    } catch (error) {
      console.error('Error updating user type:', error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6 shadow-lg">
            <div className="text-purple-600 font-bold text-2xl">WILA</div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to the Mentorship Network
          </h1>
          <p className="text-xl text-gray-600">
            How would you like to participate?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:shadow-xl transition-shadow duration-300 cursor-pointer border-2 hover:border-purple-500">
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4 mx-auto">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle className="text-2xl">I'm a Mentee</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                Connect with experienced mentors and get guidance for your professional journey
              </p>
              <ul className="text-left space-y-2 mb-6 text-sm text-gray-600">
                <li>• Browse mentor profiles</li>
                <li>• Book 1-on-1 sessions</li>
                <li>• Get career guidance</li>
                <li>• Access to mentorship resources</li>
              </ul>
              <Button
                onClick={() => handleSelectUserType('mentee')}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                Join as Mentee
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow duration-300 cursor-pointer border-2 hover:border-yellow-500">
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4 mx-auto">
                <UserCheck className="w-8 h-8 text-yellow-600" />
              </div>
              <CardTitle className="text-2xl">I'm a Mentor</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                Share your expertise and help guide the next generation of professionals
              </p>
              <ul className="text-left space-y-2 mb-6 text-sm text-gray-600">
                <li>• Create your mentor profile</li>
                <li>• Set your availability</li>
                <li>• Share your expertise</li>
                <li>• Make a difference</li>
              </ul>
              <Button
                onClick={() => handleSelectUserType('mentor')}
                disabled={isLoading}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                size="lg"
              >
                Join as Mentor
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}