import React from 'react';
import { Button } from '@/components/ui/button';

export default function TimeSlotCard({ session, onClick }) {
  return (
    <Button
      onClick={onClick}
      disabled={session.is_booked}
      className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1.5 h-auto rounded justify-start font-normal disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="truncate">
        {session.time_slot} {session.mentor_name}
      </span>
    </Button>
  );
}