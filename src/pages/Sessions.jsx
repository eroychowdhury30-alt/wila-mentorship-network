import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Calendar, Search } from 'lucide-react';
import MentorCard from '../components/MentorCard';

export default function Sessions() {
  const { data: mentors = [], isLoading } = useQuery({
    queryKey: ['mentors'],
    queryFn: () => base44.entities.Mentor.list(),
  });

  const featuredMentors = mentors.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Featured Mentors Section */}
      <div className="bg-white py-12 px-6 border-b">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredMentors.map((mentor) => (
              <MentorCard key={mentor.id} mentor={mentor} />
            ))}
          </div>
        </div>
      </div>

      {/* Session Sign Up Info Section */}
      <div className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-6">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-purple-600 mb-6">
              Mentorship Day Session Sign Up
            </h1>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
              On Mentorship Day, mentors offer (free) 1-on-1 sessions (45min) in select hours. A{' '}
              <span className="inline-flex items-center">
                <Calendar className="w-4 h-4 mx-1" />
              </span>{' '}
              icon indicates that the slot is available. You can click on the name to sign up. If there is no{' '}
              <span className="inline-flex items-center">
                <Calendar className="w-4 h-4 mx-1" />
              </span>{' '}
              icon, it means the mentor for that session is already booked. You will receive a confirmation email from Teamup after the booking.
            </p>
          </div>

          {/* Embedded Schedule */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Mentorship Day - Friday August 29, 2025
              </h2>
              <Button variant="ghost" size="icon">
                <Search className="w-5 h-5 text-gray-500" />
              </Button>
            </div>

            <div className="flex items-center justify-end gap-2 mb-6">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-700"
              >
                Timeline
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-700"
              >
                Agenda
              </Button>
            </div>

            <Link to={createPageUrl('Schedule')}>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                <Calendar className="w-4 h-4 mr-2" />
                View Full Schedule & Book Sessions
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}