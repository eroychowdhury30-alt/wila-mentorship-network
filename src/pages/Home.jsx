import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import MentorCard from '../components/MentorCard';
import FilterBar from '../components/FilterBar';
import MatchingModal from '../components/MatchingModal';
import MenteeQuestionnaire from '../components/MenteeQuestionnaire';

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
      <div className="relative overflow-hidden text-white" style={{background: 'linear-gradient(135deg, #001a35 0%, #003262 60%, #004080 100%)'}}>
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px'}} />
        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="flex flex-col items-center text-center">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd42c0ae0bd67c5e62c6ca/6b67e9115_ScreenShot2025-11-29at60408PM.png" 
              alt="WILA Logo" 
              className="h-24 w-auto mb-8 mx-auto drop-shadow-lg"
            />
            <h1 className="text-4xl md:text-6xl font-bold mb-5 tracking-tight">Mentorship Network</h1>
            <p className="text-lg md:text-xl text-purple-100 mb-10 max-w-2xl leading-relaxed">
              Connect with accomplished women leaders from the Berkeley Haas alumni community who are ready to guide your professional journey.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                size="lg"
                onClick={scrollToMentors}
                className="font-semibold px-8 h-12 text-base shadow-lg rounded-full hover:opacity-90" style={{background: '#FDB515', color: '#003262'}}
              >
                Browse Mentors
              </Button>
              <Link to={createPageUrl('Sessions')}>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/40 font-semibold px-8 h-12 text-base rounded-full backdrop-blur-sm"
                >
                  Book a Session
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {/* Stats bar */}
        <div className="border-t border-white/20 bg-white/10 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap justify-center gap-10">
            <div className="text-center">
              <p className="text-2xl font-bold">{mentors.length}+</p>
              <p className="text-purple-200 text-sm">Expert Mentors</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">Free</p>
              <p className="text-purple-200 text-sm">1-on-1 Sessions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">Haas</p>
              <p className="text-purple-200 text-sm">Alumni Network</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mentor Directory Section */}
      <div id="mentor-directory" className="py-16 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">Mentor Directory</h2>
              <p className="text-gray-500">
                <span className="font-semibold text-purple-600">{sortedMentors.length}</span> {sortedMentors.length === 1 ? 'mentor' : 'mentors'} available
              </p>
            </div>
          </div>

          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearAll}
          />

          {isLoading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{borderColor:'#003262'}}></div>
            </div>
          ) : sortedMentors.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium">No mentors match your filters</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search criteria</p>
              <Button onClick={handleClearAll} variant="outline" className="mt-6 rounded-full border-[#003262] text-[#003262]">
                Clear All Filters
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