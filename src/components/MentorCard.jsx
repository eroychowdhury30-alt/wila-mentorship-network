import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Linkedin, Calendar, MapPin, Award } from 'lucide-react';

export default function MentorCard({ mentor, isMentee = false, hasAvailability = true }) {
  const avatarColors = [
    'from-[#003262] to-[#004080]',
    'from-[#002244] to-[#003262]',
    'from-[#003262] to-[#005090]',
    'from-[#001a35] to-[#003262]',
  ];
  const colorIndex = mentor.full_name?.length % avatarColors.length || 0;
  const gradientClass = avatarColors[colorIndex];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">
      {/* Top accent bar */}
      <div className="h-1.5" style={{background: 'linear-gradient(to right, #003262, #FDB515)'}} />

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
            <p className="text-sm font-medium mt-0.5 leading-snug" style={{color:'#003262'}}>
              {mentor.title}
            </p>
            <p className="text-sm text-gray-400 mt-0.5">{mentor.company}</p>
          </div>
        </div>

        {/* Experience */}
        {mentor.experience_years && (
          <div className="flex items-center gap-1.5 mb-4">
            <Award className="w-3.5 h-3.5" style={{color:'#FDB515'}} />
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
                <span key={idx} className="text-xs px-2.5 py-1 rounded-full font-medium border" style={{color:'#003262', background:'#EDF2F8', borderColor:'#c5d4e8'}}>
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
              className="h-9 px-3 border-gray-200 hover:border-[#003262] hover:text-[#003262]"
              onClick={() => window.open(mentor.linkedin_url, '_blank')}
            >
              <Linkedin className="w-4 h-4" />
            </Button>
          )}
          {hasAvailability ? (
           <Link to={`${createPageUrl('Sessions')}?mentor=${encodeURIComponent(mentor.full_name)}`} className="flex-1">
             <Button className="w-full h-9 text-white text-sm font-medium rounded-lg hover:opacity-90" style={{background:'#003262'}}>
               <Calendar className="w-3.5 h-3.5 mr-2" />
               Book Session
             </Button>
           </Link>
          ) : (
           <Link to={createPageUrl('Sessions')} className="flex-1">
             <Button className="flex-1 h-9 text-sm text-white rounded-lg hover:opacity-90" style={{background:'#9CA3AF'}}>
               <Calendar className="w-3.5 h-3.5 mr-2" />
               Check Availability
             </Button>
           </Link>
          )}
        </div>
      </div>
    </div>
  );
}