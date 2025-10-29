import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Users, Clock, ExternalLink, UserPlus } from 'lucide-react';

export default function MentorCard({ mentor, isMentee = false }) {
  const getExperienceBadgeColor = (exp) => {
    if (exp.includes('Over 20')) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (exp.includes('11-20')) return 'bg-purple-100 text-purple-800 border-purple-300';
    if (exp.includes('6-10')) return 'bg-teal-100 text-teal-800 border-teal-300';
    if (exp.includes('< 5') || exp.includes('5-10')) return 'bg-green-100 text-green-800 border-green-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start gap-4 mb-4">
        {mentor.photo_url ? (
          <img
            src={mentor.photo_url}
            alt={mentor.full_name}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div 
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold ${mentor.avatar_color || 'bg-purple-600'}`}
          >
            {mentor.initials || mentor.full_name.split(' ').map(n => n[0]).join('')}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {mentor.full_name}
          </h3>
          <div className="flex items-start gap-1 text-sm text-gray-600">
            <Briefcase className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="line-clamp-2">
              {mentor.title} <span className="text-gray-400">at</span> {mentor.company}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <Badge variant="outline" className={`${getExperienceBadgeColor(mentor.experience_years)} border`}>
            {mentor.experience_years}
          </Badge>
        </div>

        {mentor.expertise && mentor.expertise.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Expertise</span>
            </div>
            <div className="flex flex-wrap gap-1.5 ml-6">
              {mentor.expertise.slice(0, 3).map((exp, idx) => (
                <span key={idx} className="text-xs text-gray-700 bg-white border border-gray-200 px-2 py-1 rounded">
                  {exp}
                </span>
              ))}
              {mentor.expertise.length > 3 && (
                <span className="text-xs text-gray-500 px-2 py-1">
                  +{mentor.expertise.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {mentor.mentors_to && mentor.mentors_to.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Mentors</span>
            </div>
            <p className="text-sm text-gray-600 ml-6">
              {mentor.mentors_to.join(', ')}
            </p>
          </div>
        )}
      </div>

      <div className={`flex gap-2 pt-4 border-t ${!isMentee && 'justify-center'}`}>
        {mentor.linkedin_url && (
          <Button 
            className={`${isMentee ? 'flex-1' : ''} bg-purple-600 hover:bg-purple-700 text-white`}
            onClick={() => window.open(mentor.linkedin_url, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            LinkedIn
          </Button>
        )}
        {isMentee && (
          <Button 
            variant="outline"
            className="flex-1 border-gray-300 hover:bg-gray-50"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Sign Up
          </Button>
        )}
      </div>
    </Card>
  );
}