import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Calendar, Search, AlertCircle, ArrowLeft } from 'lucide-react';
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
  const [selectedDate, setSelectedDate] = useState(new Date('2025-12-12'));
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [sessionGoal, setSessionGoal] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    // Get mentor name from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const mentorName = urlParams.get('mentor');
    if (mentorName) {
      setSelectedMentor(decodeURIComponent(mentorName));
    }
  }, []);

  // Get current user
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const userData = await base44.auth.me();
      setCurrentUser(userData);
      return userData;
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
  const { data: userBookedSessions = [] } = useQuery({
    queryKey: ['user-booked-sessions', currentUser?.email, selectedDate.toISOString().split('T')[0]],
    queryFn: () => base44.entities.Session.filter({ 
      booked_by: currentUser?.email,
      date: selectedDate.toISOString().split('T')[0]
    }),
    enabled: !!currentUser?.email,
  });

  const hasBookedSession = userBookedSessions.length > 0;
  const bookedSession = userBookedSessions[0];

  const bookSessionMutation = useMutation({
    mutationFn: async ({ sessionId, goal }) => {
      const user = await base44.auth.me();
      
      // Update the session
      const updatedSession = await base44.entities.Session.update(sessionId, {
        is_booked: true,
        booked_by: user.email,
        mentee_name: user.full_name,
        mentee_linkedin: user.linkedin_profile || '',
        session_goal: goal
      });
      
      // Get the mentor's details to find their email
      const mentors = await base44.entities.Mentor.filter({ 
        full_name: updatedSession.mentor_name 
      });
      
      if (mentors.length > 0) {
        const mentor = mentors[0];
        const mentorEmail = mentor.created_by;
        
        // Format the session date
        const sessionDate = new Date(updatedSession.date).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        // Send email to mentor
        try {
          await base44.integrations.Core.SendEmail({
            from_name: 'Berkeley Haas Women',
            to: mentorEmail,
            subject: `WILA Connect: Session Booked with ${user.full_name}`,
            body: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #7c3aed;">You have a session booked!</h2>
                
                <p>Hi ${mentor.full_name},</p>
                
                <p>You have a session booked with <strong>${user.full_name}</strong> on <strong>${sessionDate}</strong> at <strong>${updatedSession.time_slot}</strong>.</p>
                
                <div style="background-color: #ede9fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #7c3aed;">Mentee Information</h3>
                  <p><strong>Name:</strong> ${user.full_name}</p>
                  <p><strong>Email:</strong> ${user.email}</p>
                  ${user.linkedin_profile ? `<p><strong>LinkedIn:</strong> <a href="${user.linkedin_profile}" style="color: #7c3aed;">${user.linkedin_profile}</a></p>` : ''}
                </div>
                
                <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #1e40af;">What They're Looking For</h3>
                  <p style="white-space: pre-wrap;">${goal}</p>
                </div>
                
                <p style="margin-top: 30px;">You can view more details and manage your sessions in your <a href="${window.location.origin}" style="color: #7c3aed;">WILA Connect dashboard</a>.</p>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                  Best regards,<br>
                  Berkeley Haas Women in Leadership Alliance
                </p>
              </div>
            `
          });
        } catch (emailError) {
          console.error('Failed to send email to mentor:', emailError);
        }
        
        // Send email to mentee
        try {
          await base44.integrations.Core.SendEmail({
            from_name: 'Berkeley Haas Women',
            to: user.email,
            subject: `WILA Connect: Session Booked with ${mentor.full_name}`,
            body: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #7c3aed;">Your session is confirmed!</h2>
                
                <p>Hi ${user.full_name},</p>
                
                <p>You have a session booked with <strong>${mentor.full_name}</strong> on <strong>${sessionDate}</strong> at <strong>${updatedSession.time_slot}</strong>.</p>
                
                <div style="background-color: #ede9fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #7c3aed;">Mentor Information</h3>
                  <p><strong>Name:</strong> ${mentor.full_name}</p>
                  <p><strong>Title:</strong> ${mentor.title} at ${mentor.company}</p>
                  ${mentor.linkedin_url ? `<p><strong>LinkedIn:</strong> <a href="${mentor.linkedin_url}" style="color: #7c3aed;">${mentor.linkedin_url}</a></p>` : ''}
                </div>
                
                <p style="margin-top: 30px;">If you need to reschedule or cancel, please visit <a href="${window.location.origin}" style="color: #7c3aed;">WILA Connect</a>.</p>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                  Best regards,<br>
                  Berkeley Haas Women in Leadership Alliance
                </p>
              </div>
            `
          });
        } catch (emailError) {
          console.error('Failed to send email to mentee:', emailError);
        }
      }
      
      return updatedSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sessions']);
      queryClient.invalidateQueries(['user-booked-sessions']);
      toast.success('Session booked successfully!');
      setShowModal(false);
      setSelectedSession(null);
      setSessionGoal('');
    },
  });

  const handleSessionClick = (session) => {
    if (hasBookedSession) {
      toast.error('You have already booked a session for this date. You can only book one 30-minute session per day.');
      return;
    }
    
    if (!session.is_booked) {
      setSelectedSession(session);
      setShowModal(true);
    }
  };

  const handleSignup = () => {
    if (hasBookedSession) {
      toast.error('You have already booked a session for this date.');
      return;
    }
    
    if (!sessionGoal || sessionGoal.trim().length === 0) {
      toast.error('Please tell us what you\'re looking for from this session');
      return;
    }
    
    if (selectedSession) {
      bookSessionMutation.mutate({ 
        sessionId: selectedSession.id, 
        goal: sessionGoal 
      });
    }
  };

  const handleClearFilter = () => {
    setSelectedMentor(null);
    navigate(createPageUrl('Sessions'));
  };

  const timeSlots = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm'];
  
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-6">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-purple-600 mb-6">
              Mentorship Day Session Sign Up
            </h1>
            {selectedMentor ? (
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-lg">
                  <span className="text-lg font-semibold text-purple-900">
                    Viewing schedule for: {selectedMentor}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilter}
                    className="text-purple-700 hover:text-purple-900"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    View All Mentors
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
                On Mentorship Day, mentors offer (free) 1-on-1 sessions (30min) in select hours. A{' '}
                <span className="inline-flex items-center">
                  <Calendar className="w-4 h-4 mx-1" />
                </span>{' '}
                icon indicates that the slot is available. You can click on the name to sign up. If there is no{' '}
                <span className="inline-flex items-center">
                  <Calendar className="w-4 h-4 mx-1" />
                </span>{' '}
                icon, it means the mentor for that session is already booked. You will receive a confirmation email from Teamup after the booking.
              </p>
            )}
            <p className="text-md text-purple-600 font-semibold mt-4">
              Note: You can only book one 30-minute session per day.
            </p>
          </div>

          {/* Already Booked Alert */}
          {hasBookedSession && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900">Session Already Booked!</AlertTitle>
              <AlertDescription className="text-green-800">
                You have already booked a session with <strong>{bookedSession.mentor_name}</strong> at{' '}
                <strong>{bookedSession.time_slot}</strong> on {formatDate(selectedDate)}. 
                You can only book one session per day.
              </AlertDescription>
            </Alert>
          )}

          {/* Calendar Schedule */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedMentor ? `${selectedMentor}'s Schedule - ${formatDate(selectedDate)}` : `Mentorship Day - ${formatDate(selectedDate)}`}
              </h2>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
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
                <Button variant="ghost" size="icon">
                  <Search className="w-5 h-5 text-gray-500" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 text-sm mb-6">
              <button className="text-gray-600 hover:text-gray-900">Timeline</button>
              <button className="text-gray-600 hover:text-gray-900">Agenda</button>
            </div>

            <div className="text-right text-sm text-gray-600 mb-4">
              {formatShortDate(selectedDate)}
            </div>

            <div className="mb-4 text-sm font-medium text-gray-700 bg-gray-50 p-2 rounded">
              WILA Mentorship Day
            </div>

            {sessionsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
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
              <span className="text-blue-600">Pacific Time US & Ca</span> Powered by{' '}
              <span className="font-semibold">teamup</span>
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
                  {selectedSession && formatDate(new Date(selectedSession.date))}, {selectedSession?.time_slot} - {selectedSession?.time_slot === '9am' ? '9:30am' : selectedSession?.time_slot === '10am' ? '10:30am' : selectedSession?.time_slot === '11am' ? '11:30am' : selectedSession?.time_slot === '12pm' ? '12:30pm' : selectedSession?.time_slot === '1pm' ? '1:30pm' : selectedSession?.time_slot === '2pm' ? '2:30pm' : '3:30pm'}
                </p>
                <div className="mt-2">
                  <span className="inline-block bg-purple-600 text-white text-xs px-3 py-1 rounded">
                    WILA Mentorship Day
                  </span>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              30-minute mentorship session
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
                disabled={bookSessionMutation.isPending || hasBookedSession || !sessionGoal}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calendar className="w-4 h-4 mr-2" />
                {hasBookedSession ? 'Already Booked a Session Today' : bookSessionMutation.isPending ? 'Booking...' : 'Signup'}
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.print()}
              >
                Print
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}