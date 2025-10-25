import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import TimeSlotCard from '../components/TimeSlotCard';
import { toast } from 'sonner';

export default function Schedule() {
  const [view, setView] = React.useState('timeline');
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.Session.list(),
  });

  const bookSessionMutation = useMutation({
    mutationFn: async (sessionId) => {
      const user = await base44.auth.me();
      return base44.entities.Session.update(sessionId, {
        is_booked: true,
        booked_by: user.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sessions']);
      toast.success('Session booked successfully!');
    },
  });

  const handleBookSession = (session) => {
    if (!session.is_booked) {
      bookSessionMutation.mutate(session.id);
    }
  };

  const timeSlots = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm'];
  
  const getSessionsForTimeSlot = (time) => {
    return sessions.filter(s => s.time_slot === time);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              Mentorship Day - Friday August 29, 2025
            </h1>
            <Button variant="ghost" size="icon">
              <Search className="w-5 h-5 text-gray-500" />
            </Button>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-gray-600">
              Aug 29, 2025
            </div>
            <div className="flex gap-2">
              <Button
                variant={view === 'timeline' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('timeline')}
                className={view === 'timeline' ? 'bg-gray-900 text-white' : ''}
              >
                Timeline
              </Button>
              <Button
                variant={view === 'agenda' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('agenda')}
                className={view === 'agenda' ? 'bg-gray-900 text-white' : ''}
              >
                Agenda
              </Button>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">
              WILA Mentorship Day
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
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
                  {/* Morning sessions (9am-12pm) */}
                  <tr>
                    <td className="p-2"></td>
                    {timeSlots.slice(0, 4).map(time => (
                      <td key={time} className="p-2 align-top">
                        <div className="space-y-1">
                          {getSessionsForTimeSlot(time).map(session => (
                            <TimeSlotCard
                              key={session.id}
                              session={session}
                              onClick={() => handleBookSession(session)}
                            />
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                  {/* Afternoon sessions (1pm-3pm) */}
                  <tr>
                    <td className="p-2"></td>
                    <td className="p-2"></td>
                    <td className="p-2"></td>
                    <td className="p-2"></td>
                    <td className="p-2"></td>
                    {timeSlots.slice(4).map(time => (
                      <td key={time} className="p-2 align-top">
                        <div className="space-y-1">
                          {getSessionsForTimeSlot(time).map(session => (
                            <TimeSlotCard
                              key={session.id}
                              session={session}
                              onClick={() => handleBookSession(session)}
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
        </div>

        <div className="text-right text-sm text-gray-500">
          <span className="text-blue-600">Pacific Time US & Ca</span> Powered by{' '}
          <span className="font-semibold">teamup</span>
        </div>
      </div>
    </div>
  );
}