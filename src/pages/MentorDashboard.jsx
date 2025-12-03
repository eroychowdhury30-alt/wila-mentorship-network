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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Briefcase, Users, Clock, ExternalLink, Plus, Trash2, XCircle, Pause, Mail, User } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

const TIME_SLOTS = ['9am-10am', '10am-11am', '11am-12pm', '12pm-1pm', '1pm-2pm', '2pm-3pm', '3pm-4pm'];

export default function MentorDashboard() {
  const [user, setUser] = useState(null);
  const [mentorProfile, setMentorProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMenteeSession, setSelectedMenteeSession] = useState(null);
  const [showMenteeModal, setShowMenteeModal] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
            full_name: '',
            email: '',
            title: '',
            company: '',
            linkedin_url: '',
            meeting_link: '',
            photo_url: '',
            experience_years: 'Over 20 years',
            expertise: [],
            mentors_to: [],
            bio: '',
            status: 'pending'
          });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date('2025-12-12'));
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      await loadMentorProfile(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const { data: existingSessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['mentor-sessions', mentorProfile?.full_name, selectedDate.toISOString().split('T')[0]],
    queryFn: () => base44.entities.Session.filter({ 
      mentor_name: mentorProfile?.full_name,
      date: selectedDate.toISOString().split('T')[0]
    }),
    enabled: !!mentorProfile?.full_name,
  });

  const { data: menteeProfile } = useQuery({
    queryKey: ['mentee-profile', selectedMenteeSession?.booked_by],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ email: selectedMenteeSession?.booked_by });
      return users[0];
    },
    enabled: !!selectedMenteeSession?.booked_by,
  });

  const loadMentorProfile = async (currentUser) => {
    try {
      const allMentors = await base44.entities.Mentor.filter({ created_by: currentUser.email });
      
      // Get the first mentor profile created by this user (they should only have one)
      const userMentor = allMentors[0];
      
      if (userMentor) {
        setMentorProfile(userMentor);
        setProfileData({
          full_name: userMentor.full_name || '',
          email: userMentor.email || currentUser.email || '',
          title: userMentor.title || '',
          company: userMentor.company || '',
          linkedin_url: userMentor.linkedin_url || '',
          meeting_link: userMentor.meeting_link || '',
          photo_url: userMentor.photo_url || '',
          experience_years: userMentor.experience_years || 'Over 20 years',
          expertise: userMentor.expertise || [],
          mentors_to: userMentor.mentors_to || [],
          bio: userMentor.bio || '',
          status: userMentor.status || 'pending'
        });
        setIsEditing(false);
      } else {
        // No existing profile - show empty form for new mentor
        setMentorProfile(null);
        setProfileData({
          full_name: currentUser.full_name || '',
          email: currentUser.email || '',
          title: '',
          company: '',
          linkedin_url: '',
          meeting_link: '',
          photo_url: '',
          experience_years: 'Over 20 years',
          expertise: [],
          mentors_to: [],
          bio: '',
          status: 'pending'
        });
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error loading mentor profile:', error);
    }
  };

  const saveProfileMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Saving profile with data:', data);
      if (mentorProfile) {
        return await base44.entities.Mentor.update(mentorProfile.id, data);
      } else {
        return await base44.entities.Mentor.create({ ...data, status: 'pending' });
      }
    },
    onSuccess: async () => {
      toast.success(mentorProfile ? 'Profile updated successfully!' : 'Profile submitted for approval!');
      setIsEditing(false);
      await loadUser();
      // Switch to sessions tab after successful save
      setActiveTab('sessions');
    },
    onError: (error) => {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
    }
  });

  const saveAvailabilityMutation = useMutation({
    mutationFn: async (slots) => {
      const sessionData = slots.map(slot => ({
        mentor_name: profileData.full_name,
        time_slot: slot,
        date: selectedDate.toISOString().split('T')[0],
        is_booked: false
      }));
      
      return await base44.entities.Session.bulkCreate(sessionData);
    },
    onSuccess: () => {
      toast.success('Availability saved successfully!');
      queryClient.invalidateQueries(['mentor-sessions']);
      setAvailableSlots([]);
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId) => {
      return await base44.entities.Session.delete(sessionId);
    },
    onSuccess: () => {
      toast.success('Session deleted successfully!');
      queryClient.invalidateQueries(['mentor-sessions']);
    },
  });

  const cancelBookedSessionMutation = useMutation({
    mutationFn: async (session) => {
      // Get mentee email before clearing
      const menteeEmail = session.booked_by;
      const menteeName = session.mentee_name;
      
      // Update session to cancelled and clear booking
      await base44.entities.Session.update(session.id, {
        is_booked: false,
        booked_by: null,
        mentee_name: null,
        mentee_linkedin: null,
        session_goal: null,
        status: 'cancelled'
      });

      const sessionDate = new Date(session.date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const cancelDatetime = `${sessionDate} at ${session.time_slot}`;

      // Email mentee about cancellation
      if (menteeEmail) {
        try {
          await base44.functions.invoke('sendEmail', {
            to: menteeEmail,
            mentor_name: profileData.full_name,
            mentee_name: menteeName,
            session_date: sessionDate,
            session_time: session.time_slot
          });
        } catch (e) {
          console.error('Failed to send cancellation email:', e);
        }
      }
    },
    onSuccess: () => {
      toast.success('Session cancelled and mentee notified');
      queryClient.invalidateQueries(['mentor-sessions']);
    },
  });

  const handleSaveProfile = async () => {
            console.log('handleSaveProfile called');
            console.log('profileData:', profileData);

            if (!profileData.full_name || !profileData.title || !profileData.company || !profileData.meeting_link) {
              toast.error('Please fill in all required fields (Name, Title, Company, Meeting Link)');
              return;
            }
    
    try {
      await saveProfileMutation.mutateAsync(profileData);
    } catch (error) {
      console.error('Save profile error:', error);
    }
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

  const handleViewMentee = (session) => {
    setSelectedMenteeSession(session);
    setShowMenteeModal(true);
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

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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
              <p className="text-sm font-medium text-purple-900 mb-2">Your Application:</p>
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

  if (mentorProfile && mentorProfile.status === 'paused') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4 mx-auto">
              <Pause className="w-4 h-4 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl">Account Paused</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Your mentor account has been temporarily paused by the administrator. 
              Your profile is not visible to mentees during this time. Please contact the admin for more information.
            </p>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-yellow-900 mb-2">Your Account:</p>
              <p className="text-sm text-yellow-700">{profileData.full_name}</p>
              <p className="text-xs text-yellow-600">{profileData.title} at {profileData.company}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const bookedSessions = existingSessions.filter(s => s.is_booked);
  const availableSessions = existingSessions.filter(s => !s.is_booked);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Mentor Dashboard</h1>
              <p className="text-gray-600">Manage your profile and availability</p>
            </div>
            {mentorProfile && <Badge className="bg-green-600 text-white">Active</Badge>}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="sessions">
              <Calendar className="w-4 h-4 mr-2" />
              Sessions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Your Profile Information</CardTitle>
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
                                              <Label htmlFor="email">Email *</Label>
                                              <Input
                                                id="email"
                                                type="email"
                                                value={profileData.email}
                                                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                                disabled={!isEditing}
                                                placeholder="your@email.com"
                                              />
                                            </div>
                                          </div>

                                          <div className="grid md:grid-cols-2 gap-4">
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
                                          </div>

                    <div className="grid md:grid-cols-2 gap-4">
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
                                                <Label htmlFor="meeting_link">Meeting Link for Online Sessions *</Label>
                                                <Input
                                                  id="meeting_link"
                                                  type="url"
                                                  placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                                                  value={profileData.meeting_link}
                                                  onChange={(e) => setProfileData({ ...profileData, meeting_link: e.target.value })}
                                                  disabled={!isEditing}
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Your Zoom, Google Meet, or other video meeting link</p>
                                              </div>

                                              <div>
                                                <Label htmlFor="photo_url">Photo URL (optional)</Label>
                                                <Input
                                                  id="photo_url"
                                                  type="url"
                                                  placeholder="https://example.com/your-photo.jpg"
                                                  value={profileData.photo_url}
                                                  onChange={(e) => setProfileData({ ...profileData, photo_url: e.target.value })}
                                                  disabled={!isEditing}
                                                />
                                                <p className="text-xs text-gray-500 mt-1">Direct link to your profile photo</p>
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
              </div>

              <div className="space-y-6">
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
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sessions">
            {!mentorProfile ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Please complete your profile first to manage sessions</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Set Your Availability</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">Choose a date and select time slots</p>
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="gap-2">
                              <Calendar className="h-4 w-4" />
                              {formatDate(selectedDate)}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <CalendarComponent
                              mode="single"
                              selected={selectedDate}
                              onSelect={(date) => date && setSelectedDate(date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Select Time Slots to Add</Label>
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          {TIME_SLOTS.map(slot => {
                            const isAlreadyBooked = existingSessions.some(s => s.time_slot === slot);
                            const isSelected = availableSlots.includes(slot);
                            return (
                              <Button
                                key={slot}
                                variant={isSelected ? 'default' : 'outline'}
                                onClick={() => !isAlreadyBooked && toggleTimeSlot(slot)}
                                className={isSelected ? 'bg-purple-600 hover:bg-purple-700' : ''}
                                disabled={isAlreadyBooked}
                              >
                                {slot}
                                {isAlreadyBooked && ' ✓'}
                              </Button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Slots with ✓ are already in your schedule
                        </p>
                      </div>

                      {availableSlots.length > 0 && (
                        <Button
                          onClick={handleSaveAvailability}
                          disabled={saveAvailabilityMutation.isPending}
                          className="w-full bg-green-600 hover:bg-green-700"
                          size="lg"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {saveAvailabilityMutation.isPending ? 'Saving...' : `Add ${availableSlots.length} Time Slot${availableSlots.length > 1 ? 's' : ''}`}
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Booked Sessions</CardTitle>
                      <p className="text-sm text-gray-600">View mentees who signed up</p>
                    </CardHeader>
                    <CardContent>
                      {sessionsLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                        </div>
                      ) : bookedSessions.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500">No sessions booked yet</p>
                          <p className="text-sm text-gray-400 mt-1">Mentees will appear here when they sign up</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {bookedSessions.map(session => (
                            <div 
                              key={session.id} 
                              className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => handleViewMentee(session)}
                            >
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                  {session.mentee_name?.split(' ').map(n => n[0]).join('') || 'M'}
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Clock className="w-4 h-4 text-purple-600" />
                                  <span className="font-semibold text-gray-900">{session.time_slot}</span>
                                  <Badge className="bg-purple-600 text-white text-xs">Booked</Badge>
                                </div>
                                <p className="text-sm text-gray-700 font-medium">{session.mentee_name || 'Mentee Name'}</p>
                                <p className="text-xs text-gray-500">{session.booked_by}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewMentee(session);
                                  }}
                                >
                                  <User className="w-4 h-4 mr-2" />
                                  View
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Cancel this session? The mentee will be notified.')) {
                                      cancelBookedSessionMutation.mutate(session);
                                    }
                                  }}
                                  disabled={cancelBookedSessionMutation.isPending}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-600">Booked</p>
                          <p className="text-2xl font-bold text-green-600">{bookedSessions.length}</p>
                        </div>
                        <Users className="w-8 h-8 text-green-600" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-600">Available</p>
                          <p className="text-2xl font-bold text-blue-600">{availableSessions.length}</p>
                        </div>
                        <Calendar className="w-8 h-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  {availableSessions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Your Available Slots</CardTitle>
                        <p className="text-xs text-gray-500">Click trash to remove</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {availableSessions.map(session => (
                            <div key={session.id} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition">
                              <span className="text-sm font-medium">{session.time_slot}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteSession(session.id)}
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showMenteeModal} onOpenChange={setShowMenteeModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Mentee Profile</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-2xl font-bold mb-3">
                {selectedMenteeSession?.mentee_name?.split(' ').map(n => n[0]).join('') || 'M'}
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{selectedMenteeSession?.mentee_name}</h3>
              <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{selectedMenteeSession?.booked_by}</span>
              </div>
              {selectedMenteeSession?.mentee_linkedin && (
                <a 
                  href={selectedMenteeSession.mentee_linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
                >
                  <ExternalLink className="w-3 h-3" />
                  LinkedIn Profile
                </a>
              )}
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-gray-900">Session Details</span>
              </div>
              <p className="text-sm text-gray-700">
                {selectedMenteeSession && formatDate(new Date(selectedMenteeSession.date))}
              </p>
              <p className="text-sm text-gray-700">Time: {selectedMenteeSession?.time_slot}</p>
            </div>

            {selectedMenteeSession?.session_goal && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">What They're Looking For</h4>
                <p className="text-sm text-gray-700">{selectedMenteeSession.session_goal}</p>
              </div>
            )}

            {menteeProfile?.mentee_profile ? (
              <div className="space-y-4 border-t pt-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Additional Profile Information</h4>
                  <div className="space-y-2 text-sm">
                    {menteeProfile.mentee_profile.current_role && (
                      <div>
                        <span className="text-gray-600">Current Role:</span>
                        <p className="text-gray-900">{menteeProfile.mentee_profile.current_role}</p>
                      </div>
                    )}
                    {menteeProfile.mentee_profile.current_company && (
                      <div>
                        <span className="text-gray-600">Company:</span>
                        <p className="text-gray-900">{menteeProfile.mentee_profile.current_company}</p>
                      </div>
                    )}
                    {menteeProfile.mentee_profile.years_of_experience && (
                      <div>
                        <span className="text-gray-600">Experience:</span>
                        <p className="text-gray-900 capitalize">{menteeProfile.mentee_profile.years_of_experience}</p>
                      </div>
                    )}
                    {menteeProfile.mentee_profile.education_level && (
                      <div>
                        <span className="text-gray-600">Education:</span>
                        <p className="text-gray-900 capitalize">{menteeProfile.mentee_profile.education_level.replace('_', ' ')}</p>
                      </div>
                    )}
                  </div>
                </div>

                {menteeProfile.mentee_profile.areas_of_interest && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Areas of Interest</h4>
                    <p className="text-sm text-gray-700">{menteeProfile.mentee_profile.areas_of_interest}</p>
                  </div>
                )}

                {menteeProfile.mentee_profile.career_goals && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Career Goals</h4>
                    <p className="text-sm text-gray-700">{menteeProfile.mentee_profile.career_goals}</p>
                  </div>
                )}

                {menteeProfile.mentee_profile.what_seeking && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">General Mentorship Goals</h4>
                    <p className="text-sm text-gray-700">{menteeProfile.mentee_profile.what_seeking}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">No additional profile information available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}