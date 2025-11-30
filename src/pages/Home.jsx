import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import MentorCard from '../components/MentorCard';
import FilterBar from '../components/FilterBar';

export default function Home() {
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState({
    sortBy: 'firstName',
    experience: 'all',
    expertise: 'all',
    mentees: 'all'
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.log('User not logged in');
    }
  };

  const { data: mentors = [], isLoading } = useQuery({
    queryKey: ['mentors'],
    queryFn: async () => {
      const allMentors = await base44.entities.Mentor.list();
      return allMentors.filter(m => m.status === 'approved');
    },
  });

  // Fetch sessions to check mentor availability
  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions-availability'],
    queryFn: async () => {
      return base44.entities.Session.filter({ date: '2025-12-12', is_booked: false });
    },
  });

  // Get list of mentors with available sessions
  const mentorsWithAvailability = new Set(sessions.map(s => s.mentor_name));

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearAll = () => {
    setFilters({
      sortBy: 'firstName',
      experience: 'all',
      expertise: 'all',
      mentees: 'all'
    });
  };

  const filteredMentors = mentors.filter(mentor => {
    if (filters.experience !== 'all' && mentor.experience_years !== filters.experience) {
      return false;
    }
    if (filters.expertise !== 'all' && !mentor.expertise?.includes(filters.expertise)) {
      return false;
    }
    if (filters.mentees !== 'all' && !mentor.mentors_to?.includes(filters.mentees)) {
      return false;
    }
    return true;
  });

  const sortedMentors = [...filteredMentors].sort((a, b) => {
    if (filters.sortBy === 'firstName') {
      return a.full_name.localeCompare(b.full_name);
    }
    return 0;
  });

  const scrollToMentors = () => {
    const mentorSection = document.getElementById('mentor-directory');
    if (mentorSection) {
      mentorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-purple-600 to-purple-700 text-white py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <img 
                          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd42c0ae0bd67c5e62c6ca/6b67e9115_ScreenShot2025-11-29at60408PM.png" 
                          alt="WILA Logo" 
                          className="h-20 w-auto mb-6"
                        />
          <h1 className="text-5xl md:text-6xl font-bold mb-4">WILA Connect</h1>
          <p className="text-xl text-purple-100 mb-10 max-w-2xl mx-auto">
            Connect with accomplished women leaders who are ready to guide your professional journey
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              onClick={scrollToMentors}
              className="bg-white text-purple-600 hover:bg-purple-50 font-semibold px-8 h-12 text-base shadow-lg"
            >
              Browse Mentors
            </Button>
            <Link to={createPageUrl('Sessions')}>
              <Button
                size="lg"
                variant="outline"
                className="bg-purple-500 hover:bg-purple-400 text-white border-0 font-semibold px-8 h-12 text-base shadow-lg"
              >
                Book a Session
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Mentor Directory Section */}
      <div id="mentor-directory" className="py-16 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Mentor Directory
            </h2>
            <p className="text-gray-600">
              Browse profiles and connect with mentors who can help you grow
            </p>
          </div>

          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearAll}
          />

          <div className="mb-8">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{sortedMentors.length}</span> {sortedMentors.length === 1 ? 'mentor' : 'mentors'} found
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            </div>
          ) : sortedMentors.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No mentors found matching your filters</p>
              <Button onClick={handleClearAll} variant="outline" className="mt-4">
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedMentors.map((mentor) => (
                <MentorCard 
                  key={mentor.id} 
                  mentor={mentor} 
                  isMentee={user?.user_type === 'mentee'} 
                  hasAvailability={mentorsWithAvailability.has(mentor.full_name)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}