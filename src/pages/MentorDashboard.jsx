
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Briefcase, Users, Clock, ExternalLink, Plus, X, Trash2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const EXPERTISE_OPTIONS = [
  'Executive Leadership',
  'People and Team Management',
  'Career Advancement & Transition',
  'Entrepreneurship & Startups',
  'Job Application & Interview Skills',
  'Relationship Management',
  'Work-Life Integration',
  'Personal Development'
];

const MENTEE_OPTIONS = [
  'Early-career professionals',
  'Mid-career leaders',
  'Entrepreneurs/Founders',
  'College/Graduate Students',
  'Highschool Students'
];

const TIME_SLOTS = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm'];

export default function MentorDashboard() {
  const [user, setUser] = useState(null);
  const [mentorProfile, setMentorProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    title: '',
    company: '',
    linkedin_url: '',
    experience_years: 'Over 20 years',
    expertise: [],
    mentors_to: [],
    bio: '',
    status: 'pending'
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      loadMentorProfile(currentUser.email);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const { data: existingSessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['mentor-sessions', mentorProfile?.full_name],
    queryFn: () => base44.entities.Session.filter({ mentor_name: mentorProfile?.full_name }),
    enabled: !!mentorProfile?.full_name,
  });

  const loadMentorProfile = async (email) => {
    try {
      const mentors = await base44.entities.Mentor.filter({ created_by: email });
      if (mentors.length > 0) {
        const profile = mentors[0];
        setMentorProfile(profile);
        setProfileData({
          full_name: profile.full_name || '',
          title: profile.title || '',
          company: profile.company || '',
          linkedin_url: profile.linkedin_url || '',
          experience_years: profile.experience_years || 'Over 20 years',
          expertise: profile.expertise || [],
          mentors_to: profile.mentors_to || [],
          bio: profile.bio || '',
          status: profile.status || 'pending'
        });
        setIsEditing(false);
      } else {
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error loading mentor profile:', error);
    }
  };

  const saveProfileMutation = useMutation({
    mutationFn: async (data) => {
      if (mentorProfile) {
        return base44.entities.Mentor.update(mentorProfile.id, data);
      } else {
        return base44.entities.Mentor.create({ ...data, status: 'pending' });
      }
    },
    onSuccess: () => {
      toast.success(mentorProfile ? 'Profile updated successfully!' : 'Profile submitted for approval!');
      loadUser();
    },
  });

  const saveAvailabilityMutation = useMutation({
    mutationFn: async (slots) => {
      const sessionData = slots.map(slot => ({
        mentor_name: profileData.full_name,
        time_slot: slot,
        date: '2025-08-29',
        is_booked: false
      }));
      
      return base44.entities.Session.bulkCreate(sessionData);
    },
    onSuccess: () => {
      toast.success('Availability saved successfully!');
      queryClient.invalidateQueries(['mentor-sessions']);
      setAvailableSlots([]);
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId) => {
      return base44.entities.Session.delete(sessionId);
    },
    onSuccess: () => {
      toast.success('Session deleted successfully!');
      queryClient.invalidateQueries(['mentor-sessions']);
    },
  });

  const handleSaveProfile = () => {
    if (!profileData.full_name || !profileData.title || !profileData.company) {
      toast.error('Please fill in all required fields');
      return;
    }
    saveProfileMutation.mutate(profileData);
  };

  const handleSaveAvailability = () => {
    if (availableSlots.length === 0) {
      toast.error('Please select at least one time slot');
      return;
    }
    saveAvailabilityMutation.mutate(availableSlots);
  };

  const handleDeleteSession = (sessionId) => {
    if (confirm('Are you sure you want to delete this session?')) {
      deleteSessionMutation.mutate(sessionId);
    }
  };

  const toggleExpertise = (item) => {
    setProfileData(prev => ({
      ...prev,
      expertise: prev.expertise.includes(item)
        ? prev.expertise.filter(e => e !== item)
        : [...prev.expertise, item]
    }));
  };

  const toggleMentee = (item) => {
    setProfileData(prev => ({
      ...prev,
      mentors_to: prev.mentors_to.includes(item)
        ? prev.mentors_to.filter(m => m !== item)
        : [...prev.mentors_to, item]
    }));
  };

  const toggleTimeSlot = (slot) => {
    setAvailableSlots(prev =>
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    );
  };

  // Show pending approval message
  if (mentorProfile && mentorProfile.status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4 mx-auto">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl">Approval Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Your mentor application has been submitted and is awaiting admin approval. 
              You'll receive access to the dashboard once your profile is reviewed.
            </p>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-purple-900 mb-2">Your Profile:</p>
              <p className="text-sm text-purple-700">{profileData.full_name}</p>
              <p className="text-xs text-purple-600">{profileData.title} at {profileData.company}</p>
            </div>
            <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full">
              Edit Application
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show rejected message
  if (mentorProfile && mentorProfile.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4 mx-auto">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Application Not Approved</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Unfortunately, your mentor application was not approved at this time. 
              Please contact the admin for more information.
            </p>
            <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full">
              Update & Resubmit
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mentor Dashboard</h1>
          <p className="text-gray-600">Manage your profile and availability</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Profile Information</CardTitle>
                  {mentorProfile && !isEditing && (
                    <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={profileData.title}
                      onChange={(e) => setProfileData({ ...profileData, title: e.target.value })}
                      disabled={!isEditing}
                      placeholder="e.g., Senior Director"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Company *</Label>
                    <Input
                      id="company"
                      value={profileData.company}
                      onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                      disabled={!isEditing}
                      placeholder="e.g., Google"
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience">Experience Level</Label>
                    <Select
                      value={profileData.experience_years}
                      onValueChange={(value) => setProfileData({ ...profileData, experience_years: value })}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="< 5 years">Less than 5 years</SelectItem>
                        <SelectItem value="5-10 years">5-10 years</SelectItem>
                        <SelectItem value="11-20 years">11-20 years</SelectItem>
                        <SelectItem value="Over 20 years">Over 20 years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                  <Input
                    id="linkedin_url"
                    type="url"
                    placeholder="https://linkedin.com/in/yourprofile"
                    value={profileData.linkedin_url}
                    onChange={(e) => setProfileData({ ...profileData, linkedin_url: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell mentees about your experience..."
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    disabled={!isEditing}
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Areas of Expertise</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {EXPERTISE_OPTIONS.map(option => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={option}
                          checked={profileData.expertise.includes(option)}
                          onCheckedChange={() => toggleExpertise(option)}
                          disabled={!isEditing}
                        />
                        <label htmlFor={option} className="text-sm cursor-pointer">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>I Want to Mentor</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {MENTEE_OPTIONS.map(option => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={option}
                          checked={profileData.mentors_to.includes(option)}
                          onCheckedChange={() => toggleMentee(option)}
                          disabled={!isEditing}
                        />
                        <label htmlFor={option} className="text-sm cursor-pointer">
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={saveProfileMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {saveProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
                    </Button>
                    {mentorProfile && (
                      <Button
                        onClick={() => {
                          setIsEditing(false);
                          loadUser();
                        }}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Availability Section */}
            {mentorProfile && (
              <Card>
                <CardHeader>
                  <CardTitle>Set Availability for Mentorship Day</CardTitle>
                  <p className="text-sm text-gray-600">Friday, August 29, 2025</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Select Available Time Slots</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {TIME_SLOTS.map(slot => {
                        const isAlreadyBooked = existingSessions.some(s => s.time_slot === slot);
                        return (
                          <Button
                            key={slot}
                            variant={availableSlots.includes(slot) ? 'default' : 'outline'}
                            onClick={() => toggleTimeSlot(slot)}
                            className={availableSlots.includes(slot) ? 'bg-purple-600' : ''}
                            disabled={isAlreadyBooked}
                          >
                            {slot}
                            {isAlreadyBooked && ' ✓'}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {availableSlots.length > 0 && (
                    <Button
                      onClick={handleSaveAvailability}
                      disabled={saveAvailabilityMutation.isPending}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {saveAvailabilityMutation.isPending ? 'Saving...' : 'Add Availability'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Preview */}
            {mentorProfile && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-2xl font-bold mb-3">
                      {profileData.full_name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <h3 className="font-semibold text-lg">{profileData.full_name}</h3>
                    <p className="text-sm text-gray-600">{profileData.title}</p>
                    <p className="text-sm text-gray-500">{profileData.company}</p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <Badge variant="outline">{profileData.experience_years}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <span>{profileData.expertise.length} expertise areas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{profileData.mentors_to.length} mentee groups</span>
                    </div>
                  </div>

                  {profileData.linkedin_url && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={profileData.linkedin_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View LinkedIn
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Current Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Your Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {sessionsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  </div>
                ) : existingSessions.length > 0 ? (
                  <div className="space-y-2">
                    {existingSessions.map(session => (
                      <div key={session.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{session.time_slot}</span>
                          <Badge variant={session.is_booked ? 'secondary' : 'default'}>
                            {session.is_booked ? 'Booked' : 'Available'}
                          </Badge>
                        </div>
                        {!session.is_booked && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSession(session.id)}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No sessions scheduled yet. Add your availability above!</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
