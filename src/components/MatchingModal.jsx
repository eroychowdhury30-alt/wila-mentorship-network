import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Sparkles, Users } from 'lucide-react';

export default function MatchingModal({ open, onOpenChange, onSelectMode }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Find Your Perfect Mentor</DialogTitle>
          <DialogDescription>
            Choose how you'd like to discover your mentor match
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6">
          <button
            onClick={() => onSelectMode('manual')}
            className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-[#003262] hover:bg-blue-50 transition text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-gray-100 group-hover:bg-[#003262] group-hover:text-white flex items-center justify-center transition">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-[#003262]">Browse Manually</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Filter and explore mentors by expertise, experience, and focus areas
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelectMode('smart')}
            className="w-full p-6 border-2 border-[#003262] rounded-lg hover:bg-blue-50 transition text-left group bg-blue-50"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#003262] text-white flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Smart Match (Recommended)</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Answer a few questions and we'll find your ideal mentor match
                </p>
              </div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}