import React, { useState } from 'react';

export default function MentorAvatar({ mentor, sizeClass = 'w-16 h-16', textClass = 'text-xl', roundedClass = 'rounded-xl' }) {
  const [imgError, setImgError] = useState(false);
  const showPhoto = mentor.photo_url && !imgError;

  const avatarColors = [
    'from-[#003262] to-[#004080]',
    'from-[#002244] to-[#003262]',
    'from-[#003262] to-[#005090]',
    'from-[#001a35] to-[#003262]',
  ];
  const colorIndex = mentor.full_name?.length % avatarColors.length || 0;
  const gradientClass = avatarColors[colorIndex];
  const initials = mentor.initials || mentor.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2);

  if (showPhoto) {
    return (
      <img
        src={mentor.photo_url}
        alt={mentor.full_name}
        onError={() => setImgError(true)}
        className={`${sizeClass} ${roundedClass} object-cover shadow-sm flex-shrink-0`}
      />
    );
  }

  return (
    <div className={`${sizeClass} ${roundedClass} bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white ${textClass} font-bold shadow-sm flex-shrink-0`}>
      {initials}
    </div>
  );
}