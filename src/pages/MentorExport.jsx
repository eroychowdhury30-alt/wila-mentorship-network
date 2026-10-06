import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Download, Search, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MentorExport() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Auth check
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me-mentor-export'],
    queryFn: async () => {
      const u = await base44.auth.me();
      if (!['admin', 'superadmin', 'moderator'].includes(u.role)) {
        navigate(createPageUrl('Home'));
      }
      return u;
    },
  });

  const { data: mentors = [], isLoading } = useQuery({
    queryKey: ['mentors-export'],
    queryFn: () => base44.entities.Mentor.list(),
    enabled: !!user,
  });

  const rows = mentors
    .filter(m => ['approved', 'paused'].includes(m.status))
    .map(m => ({
      name: m.full_name || '',
      email: m.email || '',
      approvedDate: m.approved_date || '',
      status: m.status || 'approved',
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const filtered = rows.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.email.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (value) => {
    if (!value) return '—';
    return new Date(value + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const exportCSV = () => {
    const headers = ['Mentor Name', 'Email', 'Date Approved'];
    const csvRows = [
      headers.join(','),
      ...filtered.map(r =>
        [`"${r.name.replace(/"/g, '""')}"`, r.email, r.approvedDate].join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wila_mentor_list.csv';
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
            <UserCheck className="w-7 h-7" style={{ color: '#003262' }} />
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#003262' }}>Mentor List</h1>
              <p className="text-sm text-gray-500">{filtered.length} mentors</p>
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
            placeholder="Search by mentor name or email..."
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
                  {['Mentor Name', 'Email', 'Date Approved', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 font-semibold text-white whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-gray-400">No mentors found</td>
                  </tr>
                ) : (
                  filtered.map((r, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{r.name}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.email}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(r.approvedDate)}</td>
                      <td className="px-4 py-3">
                        <Badge className={r.status === 'paused' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}>
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