import React from 'react';
import { Button } from '@/components/ui/button';

export default function TimeSlotCard({ session, displaySlot, onClick, disabled = false }) {
  const isDisabled = session.is_booked || disabled;

  return (
    <Button
      onClick={onClick}
      disabled={isDisabled}
      className="text-white text-sm px-4 py-2 h-auto rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 shadow-sm"
      style={isDisabled ? {background: '#9ca3af'} : {background: '#003262'}}
    >
      <span>
        {session.mentor_name}
        {session.is_booked ? ' · Booked' : ''}
      </span>
    </Button>
  );
}