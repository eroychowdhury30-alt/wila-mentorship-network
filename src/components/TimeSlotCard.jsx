import React from 'react';
import { Button } from '@/components/ui/button';

export default function TimeSlotCard({ session, onClick, disabled = false }) {
  const isDisabled = session.is_booked || disabled;
  
  return (
    <Button
      onClick={onClick}
      disabled={isDisabled}
      className="w-full text-white text-xs px-2 py-1.5 h-auto rounded justify-start font-normal disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
      style={isDisabled ? {} : {background: '#003262'}}
    >
      <span className="truncate">
        {session.time_slot} {session.mentor_name}
      </span>
    </Button>
  );
}