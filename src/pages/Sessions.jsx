import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Calendar, AlertCircle, ArrowLeft, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import TimeSlotCard from '../components/TimeSlotCard';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function Sessions() {
  const [selectedSession, setSelectedSession] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date('2025-12-12T12:00:00'));
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [sessionGoal, setSessionGoal] = useState('');
  const [menteeName, setMenteeName] = useState('');
  const [menteeLinkedin, setMenteeLinkedin] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    // Get mentor name from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const mentorName = urlParams.get('mentor');
    if (mentorName) {
      setSelectedMentor(decodeURIComponent(mentorName));
    }
    
    // Check for pending session after login redirect
    const checkPendingSession = async () => {
      const pendingSessionId = localStorage.getItem('pending_session_id');
      if (pendingSessionId) {
        localStorage.removeItem('pending_session_id');
        // Fetch the session and open modal
        const allSessions = await base44.entities.Session.filter({ date: '2025-12-13' });
        const pendingSession = allSessions.find(s => s.id === pendingSessionId);
        if (pendingSession && !pendingSession.is_booked) {
          setSelectedSession(pendingSession);
          setShowModal(true);
        }
      }
    };
    checkPendingSession();
  }, []);

  // Get current user (optional - may not be logged in)
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) return null;
        const userData = await base44.auth.me();
        setCurrentUser(userData);
        return userData;
      } catch {
        return null;
      }
    },
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions', selectedDate.toISOString().split('T')[0], selectedMentor],
    queryFn: async () => {
      const filterQuery = { date: selectedDate.toISOString().split('T')[0] };
      if (selectedMentor) {
        filterQuery.mentor_name = selectedMentor;
      }
      return base44.entities.Session.filter(filterQuery);
    },
  });

  // Check if user has already booked a session for the selected date
  const { data: userBookedSessions = [], isLoading: userBookedLoading } = useQuery({
    queryKey: ['user-booked-sessions', currentUser?.email, selectedDate.toISOString().split('T')[0]],
    queryFn: async () => {
      const sessions = await base44.entities.Session.filter({ 
        booked_by: currentUser?.email,
        date: selectedDate.toISOString().split('T')[0]
      });
      console.log('User booked sessions:', sessions);
      return sessions;
    },
    enabled: !!currentUser?.email,
  });

  const activeBookedSessions = userBookedSessions.filter(s => s.status === 'scheduled' || !s.status);
  const hasBookedSession = activeBookedSessions.length > 0;
  const bookedSession = activeBookedSessions[0];

  const bookSessionMutation = useMutation({
            mutationFn: async ({ sessionId, goal, name, linkedin }) => {
              const user = await base44.auth.me();

              // Double-check user hasn't already booked for this date
              const existingBookings = await base44.entities.Session.filter({
                booked_by: user.email,
                date: selectedDate.toISOString().split('T')[0]
              });
              const activeBookings = existingBookings.filter(s => s.status !== 'cancelled');
              if (activeBookings.length > 0) {
                throw new Error('You have already booked a session for this date');
              }

              // Update the session
              const updatedSession = await base44.entities.Session.update(sessionId, {
                is_booked: true,
                booked_by: user.email,
                mentee_name: name,
                mentee_linkedin: linkedin,
                session_goal: goal,
                status: 'scheduled'
              });
      
      // Get the mentor's details to find their email
      console.log('Looking for mentor with name:', updatedSession.mentor_name);
      const allMentors = await base44.entities.Mentor.list();
      const mentor = allMentors.find(m => m.full_name === updatedSession.mentor_name);
      console.log('Found mentor:', mentor);
      
      // Format the session date - add T12:00:00 to prevent timezone issues
      const sessionDate = new Date(updatedSession.date + 'T12:00:00').toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      // Get email addresses - mentor email from their profile, mentee from session booking
      const mentorEmailAddress = mentor?.email || updatedSession.mentor_email || null;
      const menteeEmailAddress = updatedSession.booked_by; // This is the email of who booked
      
      console.log('=== EMAIL DEBUG ===');
      console.log('Mentor found:', mentor);
      console.log('Mentor email to use:', mentorEmailAddress);
      console.log('Mentee email to use:', menteeEmailAddress);
      console.log('Current user email:', user.email);
      
      // Send emails (don't block booking if emails fail)
      // Get meeting link from session or mentor
                  const meetingLink = updatedSession.meeting_link || mentor?.meeting_link || '';

                  try {
                                if (mentorEmailAddress) {
                                  await base44.functions.invoke('sendEmail', {
                                    to: mentorEmailAddress,
                                    mentor_name: mentor?.full_name || updatedSession.mentor_name,
                                    mentee_name: name,
                                    mentor_email: mentorEmailAddress,
                                    mentee_email: menteeEmailAddress,
                                    session_date: sessionDate,
                                    session_time: updatedSession.time_slot,
                                    meeting_link: meetingLink,
                                    mentee_response: updatedSession.session_goal || '',
                                    mentee_linkedin: linkedin || '',
                                    recipient_type: 'mentor'
                                  });
                                  console.log('Email sent to mentor at:', mentorEmailAddress);
                                }
                              } catch (e) {
                                console.error('Failed to send mentor email:', e);
                              }

                              try {
                                if (menteeEmailAddress) {
                                  console.log('Sending mentee email to:', menteeEmailAddress);
                                  const menteeEmailResult = await base44.functions.invoke('sendEmail', {
                                    to: menteeEmailAddress,
                                    mentor_name: mentor?.full_name || updatedSession.mentor_name,
                                    mentee_name: name,
                                    mentor_email: mentorEmailAddress || '',
                                    mentee_email: menteeEmailAddress,
                                    session_date: sessionDate,
                                    session_time: updatedSession.time_slot,
                                    meeting_link: meetingLink,
                                    mentee_response: goal || '',
                                    mentee_linkedin: linkedin || '',
                                    recipient_type: 'mentee'
                                  });
                                  console.log('Mentee email result:', menteeEmailResult);
                                }
                              } catch (e) {
                                console.error('Failed to send mentee email:', e);
                              }
      
      return updatedSession;
    },
    onSuccess: () => {
                      queryClient.invalidateQueries({ queryKey: ['sessions'] });
                      queryClient.invalidateQueries({ queryKey: ['user-booked-sessions'] });
                      toast.success('Session booked! A confirmation email has been sent to your inbox.', {
                        duration: 5000,
                        description: 'Please check your email for session details.'
                      });
                      setShowModal(false);
                      setSelectedSession(null);
                      setSessionGoal('');
                      setMenteeName('');
                      setMenteeLinkedin('');
                    },
    onError: (error) => {
      console.error('Booking error:', error);
      toast.error('Failed to book session: ' + error.message);
    },
  });

  const cancelSessionMutation = useMutation({
    mutationFn: async (session) => {
      // Update session to cancelled and clear booking
      await base44.entities.Session.update(session.id, {
        is_booked: false,
        booked_by: null,
        mentee_name: null,
        mentee_linkedin: null,
        session_goal: null,
        status: 'cancelled'
      });

      // Get mentor info for email
      const mentors = await base44.entities.Mentor.filter({ 
        full_name: session.mentor_name 
      });
      
      const sessionDate = new Date(session.date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      if (mentors.length > 0) {
        const mentor = mentors[0];
        
        // Email mentor about cancellation
        try {
          await base44.functions.invoke('sendEmail', {
            to: mentor.email || mentor.created_by,
            mentor_name: mentor.full_name,
            mentee_name: session.mentee_name,
            session_date: sessionDate,
            session_time: session.time_slot
          });
        } catch (e) {
          console.error('Failed to send mentor cancellation email:', e);
        }
      }

      // Email mentee about cancellation
      const user = await base44.auth.me();
      try {
        await base44.functions.invoke('sendEmail', {
          to: user.email,
          mentor_name: session.mentor_name,
          mentee_name: user.full_name,
          session_date: sessionDate,
          session_time: session.time_slot
        });
      } catch (e) {
        console.error('Failed to send mentee cancellation email:', e);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sessions']);
      queryClient.invalidateQueries(['user-booked-sessions']);
      toast.success('Session cancelled successfully');
    },
  });

  const handleCancelSession = (session) => {
    if (confirm('Are you sure you want to cancel this session?')) {
      cancelSessionMutation.mutate(session);
    }
  };

  const handleSessionClick = (session) => {
    // If session is already booked, don't do anything
    if (session.is_booked) {
      return;
    }
    
    // If not logged in, redirect to login first
    if (!currentUser) {
      localStorage.setItem('intended_user_type', 'mentee');
      // Store session ID to book after login
      localStorage.setItem('pending_session_id', session.id);
      // Use full URL for redirect
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    
    if (hasBookedSession) {
      toast.error('You have already booked a session for this date. You can only book one 30-minute session per day.');
      return;
    }
    
    // Show the session details modal
    setSelectedSession(session);
    setShowModal(true);
  };

  const handleSignup = () => {
            if (hasBookedSession) {
              toast.error('You have already booked a session for this date.');
              return;
            }

            if (!menteeName || menteeName.trim().length === 0) {
              toast.error('Please enter your full name');
              return;
            }

            if (!menteeLinkedin || menteeLinkedin.trim().length === 0) {
              toast.error('Please enter your LinkedIn profile URL');
              return;
            }

            if (!sessionGoal || sessionGoal.trim().length === 0) {
              toast.error('Please tell us what you\'re looking for from this session');
              return;
            }

            if (selectedSession) {
              bookSessionMutation.mutate({ 
                sessionId: selectedSession.id, 
                goal: sessionGoal,
                name: menteeName,
                linkedin: menteeLinkedin
              });
            }
          };

  const handleClearFilter = () => {
    setSelectedMentor(null);
    navigate(createPageUrl('Sessions'));
  };

  const timeSlots = ['9am-10am', '10am-11am', '11am-12pm', '12pm-1pm', '1pm-2pm', '2pm-3pm', '3pm-4pm'];
  
  const getSessionsForTimeSlot = (time) => {
    return sessions.filter(s => s.time_slot === time);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatShortDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Session Sign Up Info Section */}
      <div className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6" style={{background:'#003262'}}>
            <Calendar className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-6" style={{color:'#003262'}}>
              Mentorship Day Session Sign Up
            </h1>
                              {selectedMentor ? (
                                <div className="mb-4">
                                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg" style={{background:'#EDF2F8'}}>
                                    <span className="text-lg font-semibold" style={{color:'#003262'}}>
                                      Viewing schedule for: {selectedMentor}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={handleClearFilter}
                                      style={{color:'#003262'}}
                                    >
                                      <ArrowLeft className="w-4 h-4 mr-1" />
                                      View All Mentors
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
                                  On Mentorship Day, mentors offer (free) 1-on-1 sessions up to an hour. A bright purple indicates that the slot is available. You can click on the name to sign up. You will receive a confirmation email with meeting details after the booking. Time displayed is in Pacific Time (US).
                                </p>
                              )}
          </div>

          {/* Already Booked Alert with Cancel Option */}
          {hasBookedSession && bookedSession && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900">Session Already Booked!</AlertTitle>
              <AlertDescription className="text-green-800">
                <div className="flex items-center justify-between">
                  <span>
                    You have booked a session with <strong>{bookedSession.mentor_name}</strong> at{' '}
                    <strong>{bookedSession.time_slot}</strong> on {formatDate(selectedDate)}.
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelSession(bookedSession)}
                    disabled={cancelSessionMutation.isPending}
                    className="ml-4 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    {cancelSessionMutation.isPending ? 'Cancelling...' : 'Cancel Session'}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Calendar Schedule */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedMentor ? `${selectedMentor}'s Schedule - ${formatDate(selectedDate)}` : `Mentorship Day - ${formatDate(selectedDate)}`}
              </h2>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatShortDate(selectedDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => setSelectedDate(date || new Date())}
                  />
                </PopoverContent>
              </Popover>
            </div>



            <div className="text-right text-sm text-gray-600 mb-4">
              {formatShortDate(selectedDate)}
            </div>

            <div className="mb-4 text-sm font-medium text-gray-700 bg-gray-50 p-2 rounded">
              WILA Mentorship Day
            </div>

            {sessionsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{borderColor:'#003262'}}></div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">
                  {selectedMentor 
                    ? `No sessions available for ${selectedMentor} on this date` 
                    : 'No sessions available for this date'}
                </p>
                <p className="text-sm text-gray-400 mt-1">Please select a different date</p>
                {selectedMentor && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleClearFilter}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    View All Mentors
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-2 text-sm font-medium text-gray-700 bg-gray-50"></th>
                      {timeSlots.map(time => (
                        <th key={time} className="text-center p-2 text-sm font-medium text-gray-700 bg-gray-50 min-w-[140px]">
                          {time}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2"></td>
                      {timeSlots.map(time => (
                        <td key={time} className="p-2 align-top">
                          <div className="space-y-1">
                            {getSessionsForTimeSlot(time).map(session => (
                              <TimeSlotCard
                                key={session.id}
                                session={session}
                                onClick={() => handleSessionClick(session)}
                                disabled={hasBookedSession}
                              />
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 text-right text-sm text-gray-500">
                                <span className="text-blue-600">Pacific Time (US)</span>
                              </div>
          </div>
        </div>
      </div>

      {/* Session Details Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {selectedSession?.mentor_name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
                            <div className="flex items-start gap-2">
                              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {selectedSession && formatDate(new Date(selectedSession.date + 'T12:00:00'))}, {selectedSession?.time_slot}
                                </p>
                                <div className="mt-2">
                                  <span className="inline-block text-white text-xs px-3 py-1 rounded" style={{background:'#003262'}}>
                                    WILA Mentorship Day
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-sm text-gray-500">
                              Up to 1-hour mentorship session
                            </div>

                            <div>
                              <Label htmlFor="mentee_name">Full Name *</Label>
                              <Input
                                id="mentee_name"
                                value={menteeName}
                                onChange={(e) => setMenteeName(e.target.value)}
                                placeholder="Enter your full name"
                                className="mt-2"
                              />
                            </div>

                            <div>
                              <Label htmlFor="mentee_linkedin">LinkedIn Profile URL *</Label>
                              <Input
                                id="mentee_linkedin"
                                value={menteeLinkedin}
                                onChange={(e) => setMenteeLinkedin(e.target.value)}
                                placeholder="https://linkedin.com/in/yourprofile"
                                className="mt-2"
                              />
                            </div>

                            <div>
                              <Label htmlFor="session_goal">What are you looking for from this session? *</Label>
                              <Textarea
                                id="session_goal"
                                value={sessionGoal}
                                onChange={(e) => setSessionGoal(e.target.value)}
                                placeholder="e.g., Career advice, interview preparation, industry insights, networking guidance..."
                                rows={4}
                                className="mt-2"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                This helps your mentor prepare for your session
                              </p>
                            </div>

            {hasBookedSession && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  You have already booked a session for this date. You can only book one session per day.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3 pt-4">
              <Button
                                    onClick={handleSignup}
                                    disabled={bookSessionMutation.isPending || hasBookedSession || !sessionGoal.trim() || !menteeName.trim() || !menteeLinkedin.trim()}
                                    className="w-full text-white font-semibold py-3 hover:opacity-90" style={{background:'#003262'}}
                                  >
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {hasBookedSession ? 'Already Booked a Session Today' : bookSessionMutation.isPending ? 'Booking...' : 'Sign Up'}
                                  </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}