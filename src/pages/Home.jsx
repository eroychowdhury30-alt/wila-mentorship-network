import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import MentorCard from '../components/MentorCard';
import FilterBar from '../components/FilterBar';

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState({
    sortBy: 'firstName',
    experience: 'all',
    expertise: 'all',
    mentees: 'all'
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Only redirect if user is logged in AND is a mentor
      if (currentUser.user_type === 'mentor') {
        navigate(createPageUrl('MentorDashboard'));
      }
    } catch (error) {
      // User is not logged in - that's fine, they can still browse mentors
      console.log('User not logged in - showing public mentor directory');
    }
  };

  const { data: mentors = [], isLoading } = useQuery({
    queryKey: ['mentors'],
    queryFn: async () => {
      const allMentors = await base44.entities.Mentor.list();
      return allMentors.filter(m => m.status === 'approved');
    },
  });

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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-purple-600 text-white py-24 px-6 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-32 h-32 mb-4">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                <div className="text-purple-600 font-bold text-2xl">WILA</div>
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-6">Mentorship Network</h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
            Connect with accomplished women leaders from the Berkeley Haas alumni
            community who are ready to guide your professional journey
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-8"
            >
              Browse Mentors
            </Button>
            <Link to={createPageUrl('Sessions')}>
              <Button
                size="lg"
                variant="outline"
                className="bg-white hover:bg-gray-100 text-purple-600 font-semibold px-8 border-0"
              >
                Mentor Session Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Mentor Directory Section */}
      <div className="py-16 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-purple-600 mb-4">
              Mentor Directory
            </h2>
          </div>

          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearAll}
          />

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {sortedMentors.length} Mentors Found
            </h3>
            <p className="text-gray-600 text-sm">
              Browse profiles or use the controls above to refine your search
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedMentors.map((mentor) => (
                <MentorCard key={mentor.id} mentor={mentor} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}