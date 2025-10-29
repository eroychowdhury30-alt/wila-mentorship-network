import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Calendar, Search, AlertCircle } from 'lucide-react';
import TimeSlotCard from '../components/TimeSlotCard';
import { toast } from 'sonner';
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
  const [selectedDate, setSelectedDate] = useState(new Date('2025-10-28'));
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

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
    queryKey: ['sessions', selectedDate.toISOString().split('T')[0]],
    queryFn: () => base44.entities.Session.filter({ 
      date: selectedDate.toISOString().split('T')[0]
    }),
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
    mutationFn: async (sessionId) => {
      const user = await base44.auth.me();
      return base44.entities.Session.update(sessionId, {
        is_booked: true,
        booked_by: user.email,
        mentee_name: user.full_name
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sessions']);
      queryClient.invalidateQueries(['user-booked-sessions']);
      toast.success('Session booked successfully!');
      setShowModal(false);
      setSelectedSession(null);
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
    
    if (selectedSession) {
      bookSessionMutation.mutate(selectedSession.id);
    }
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
                Mentorship Day - {formatDate(selectedDate)}
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
                <p className="text-gray-500">No sessions available for this date</p>
                <p className="text-sm text-gray-400 mt-1">Please select a different date</p>
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
                disabled={bookSessionMutation.isPending || hasBookedSession}
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