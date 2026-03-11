import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Linkedin, Calendar, MapPin, Award } from 'lucide-react';

export default function MentorCard({ mentor, isMentee = false, hasAvailability = true }) {
  const avatarColors = [
    'from-purple-500 to-purple-700',
    'from-indigo-500 to-purple-600',
    'from-violet-500 to-indigo-600',
    'from-fuchsia-500 to-purple-600',
  ];
  const colorIndex = mentor.full_name?.length % avatarColors.length || 0;
  const gradientClass = avatarColors[colorIndex];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
      {/* Top accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-purple-500 to-purple-700" />

      <div className="p-6 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          {mentor.photo_url ? (
            <img
              src={mentor.photo_url}
              alt={mentor.full_name}
              className="w-16 h-16 rounded-xl object-cover shadow-sm flex-shrink-0"
            />
          ) : (
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white text-xl font-bold shadow-sm flex-shrink-0`}>
              {mentor.initials || mentor.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 leading-tight">
              {mentor.full_name}
            </h3>
            <p className="text-sm text-purple-600 font-medium mt-0.5 leading-snug">
              {mentor.title}
            </p>
            <p className="text-sm text-gray-400 mt-0.5">{mentor.company}</p>
          </div>
        </div>

        {/* Experience */}
        {mentor.experience_years && (
          <div className="flex items-center gap-1.5 mb-4">
            <Award className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs text-gray-500 font-medium">{mentor.experience_years} experience</span>
          </div>
        )}

        {/* Bio snippet */}
        {mentor.bio && (
          <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2">{mentor.bio}</p>
        )}

        {/* Expertise */}
        {mentor.expertise && mentor.expertise.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Expertise</p>
            <div className="flex flex-wrap gap-1.5">
              {mentor.expertise.slice(0, 3).map((exp, idx) => (
                <span key={idx} className="text-xs text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full font-medium">
                  {exp}
                </span>
              ))}
              {mentor.expertise.length > 3 && (
                <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
                  +{mentor.expertise.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Mentors To */}
        {mentor.mentors_to && mentor.mentors_to.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Mentors</p>
            <div className="flex flex-wrap gap-1.5">
              {mentor.mentors_to.slice(0, 2).map((group, idx) => (
                <span key={idx} className="text-xs text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
                  {group}
                </span>
              ))}
              {mentor.mentors_to.length > 2 && (
                <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
                  +{mentor.mentors_to.length - 2}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Availability indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-2 h-2 rounded-full ${hasAvailability ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className={`text-xs font-medium ${hasAvailability ? 'text-green-600' : 'text-gray-400'}`}>
            {hasAvailability ? 'Session available' : 'No availability'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-100">
          {mentor.linkedin_url && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 border-gray-200 hover:border-purple-300 hover:text-purple-600"
              onClick={() => window.open(mentor.linkedin_url, '_blank')}
            >
              <Linkedin className="w-4 h-4" />
            </Button>
          )}
          {hasAvailability ? (
            <Link to={`${createPageUrl('Sessions')}?mentor=${encodeURIComponent(mentor.full_name)}`} className="flex-1">
              <Button className="w-full h-9 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg">
                <Calendar className="w-3.5 h-3.5 mr-2" />
                Book Session
              </Button>
            </Link>
          ) : (
            <Button disabled className="flex-1 h-9 text-sm bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed">
              Unavailable
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}