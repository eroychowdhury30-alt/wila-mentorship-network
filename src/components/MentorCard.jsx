import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Users, Clock, ExternalLink, Calendar } from 'lucide-react';

export default function MentorCard({ mentor, isMentee = false, hasAvailability = true }) {
  const getExperienceBadgeColor = (exp) => {
    if (!exp) return 'bg-gray-50 text-gray-700 border-gray-200';
    if (exp.includes('Over 20')) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    if (exp.includes('11-20')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (exp.includes('6-10')) return 'bg-teal-50 text-teal-700 border-teal-200';
    if (exp.includes('< 5') || exp.includes('5-10')) return 'bg-green-50 text-green-700 border-green-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <Card className="bg-white hover:shadow-xl transition-all duration-200 border-gray-200 overflow-hidden group">
      <div className="p-6">
        {/* Header with Avatar and Name */}
        <div className="flex items-start gap-4 mb-5">
          {mentor.photo_url ? (
            <img
              src={mentor.photo_url}
              alt={mentor.full_name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-purple-100"
            />
          ) : (
            <div 
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-semibold shadow-sm ${mentor.avatar_color || 'bg-gradient-to-br from-purple-500 to-purple-600'}`}
            >
              {mentor.initials || mentor.full_name.split(' ').map(n => n[0]).join('')}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
              {mentor.full_name}
            </h3>
            <p className="text-sm text-gray-600 leading-snug">
              {mentor.title}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {mentor.company}
            </p>
          </div>
        </div>

        {/* Experience Badge */}
        <div className="mb-4">
          <Badge variant="outline" className={`${getExperienceBadgeColor(mentor.experience_years)} border font-medium`}>
            {mentor.experience_years}
          </Badge>
        </div>

        {/* Expertise */}
        {mentor.expertise && mentor.expertise.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Expertise</p>
            <div className="flex flex-wrap gap-1.5">
              {mentor.expertise.slice(0, 3).map((exp, idx) => (
                <span key={idx} className="text-xs text-gray-700 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md">
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

        {/* Mentors To */}
        {mentor.mentors_to && mentor.mentors_to.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Mentors</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              {mentor.mentors_to.slice(0, 2).join(', ')}
              {mentor.mentors_to.length > 2 && ` +${mentor.mentors_to.length - 2} more`}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-100">
          {mentor.linkedin_url && (
            <Button 
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white h-10"
              onClick={() => window.open(mentor.linkedin_url, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              LinkedIn
            </Button>
          )}
          {hasAvailability ? (
            <Link to={`${createPageUrl('Sessions')}?mentor=${encodeURIComponent(mentor.full_name)}`} className="flex-1">
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white h-10"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Book Session
              </Button>
            </Link>
          ) : (
            <div className="flex-1">
              <Button 
                disabled
                className="w-full bg-gray-300 text-gray-500 h-10 cursor-not-allowed"
              >
                Currently Unavailable
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}