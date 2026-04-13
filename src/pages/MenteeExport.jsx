import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Download, Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MenteeExport() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Auth check
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me-export'],
    queryFn: async () => {
      const u = await base44.auth.me();
      if (!['admin', 'superadmin', 'moderator'].includes(u.role)) {
        navigate(createPageUrl('Home'));
      }
      return u;
    },
  });

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['booked-sessions-export'],
    queryFn: () => base44.entities.Session.filter({ is_booked: true }),
    enabled: !!user,
  });

  const rows = sessions
    .filter(s => s.status !== 'cancelled')
    .map(s => ({
      menteeName: s.mentee_name || '',
      menteeEmail: s.booked_by || '',
      menteeLinkedin: s.mentee_linkedin || '',
      mentorName: s.mentor_name || '',
      date: s.date || '',
      timeSlot: s.time_slot || '',
      sessionGoal: s.session_goal || '',
      status: s.status || 'scheduled',
    }))
    .sort((a, b) => a.menteeName.localeCompare(b.menteeName));

  const filtered = rows.filter(r =>
    r.menteeName.toLowerCase().includes(search.toLowerCase()) ||
    r.menteeEmail.toLowerCase().includes(search.toLowerCase()) ||
    r.mentorName.toLowerCase().includes(search.toLowerCase())
  );

  const exportCSV = () => {
    const headers = ['Mentee Name', 'Mentee Email', 'Mentee LinkedIn', 'Mentor Name', 'Date', 'Time Slot', 'Session Goal', 'Status'];
    const csvRows = [
      headers.join(','),
      ...filtered.map(r =>
        [r.menteeName, r.menteeEmail, r.menteeLinkedin, r.mentorName, r.date, r.timeSlot, `"${r.sessionGoal.replace(/"/g, '""')}"`, r.status].join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wila_mentee_sessions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (userLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#003262' }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-7 h-7" style={{ color: '#003262' }} />
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#003262' }}>Mentee Sessions</h1>
              <p className="text-sm text-gray-500">{filtered.length} bookings</p>
            </div>
          </div>
          <Button onClick={exportCSV} className="gap-2 text-white" style={{ background: '#003262' }}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by mentee name, email, or mentor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left" style={{ background: '#003262' }}>
                  {['Mentee Name', 'Email', 'Mentor', 'Date', 'Time', 'Session Goal', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 font-semibold text-white whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">No sessions found</td>
                  </tr>
                ) : (
                  filtered.map((r, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{r.menteeName}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.menteeEmail}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{r.mentorName}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.date}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.timeSlot}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs">
                        <span className="line-clamp-2">{r.sessionGoal}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={r.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                          {r.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}