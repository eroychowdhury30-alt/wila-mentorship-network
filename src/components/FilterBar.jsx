import React from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function FilterBar({ filters, onFilterChange, onClearAll }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-8 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-purple-500" />
          <h3 className="text-sm font-semibold text-gray-700">Filter & Sort</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-100 h-7 px-2"
        >
          <X className="w-3 h-3 mr-1" />
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-700 mb-2 block uppercase tracking-wide">
            Sort By
          </label>
          <Select
            value={filters.sortBy}
            onValueChange={(value) => onFilterChange('sortBy', value)}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="First Name" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="firstName">First Name</SelectItem>
              <SelectItem value="lastName">Last Name</SelectItem>
              <SelectItem value="experience">Experience</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 mb-2 block uppercase tracking-wide">
            Experience Level
          </label>
          <Select
            value={filters.experience}
            onValueChange={(value) => onFilterChange('experience', value)}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Any experience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any experience</SelectItem>
              <SelectItem value="< 5 years">Less than 5 years</SelectItem>
              <SelectItem value="5-10 years">5-10 years</SelectItem>
              <SelectItem value="11-20 years">11-20 years</SelectItem>
              <SelectItem value="Over 20 years">Over 20 years</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 mb-2 block uppercase tracking-wide">
            Area of Expertise
          </label>
          <Select
            value={filters.expertise}
            onValueChange={(value) => onFilterChange('expertise', value)}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Any expertise" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any expertise</SelectItem>
              <SelectItem value="Executive Leadership">Executive Leadership</SelectItem>
              <SelectItem value="People and Team Management">People and Team Management</SelectItem>
              <SelectItem value="Career Advancement & Transition">Career Advancement & Transition</SelectItem>
              <SelectItem value="Entrepreneurship & Startups">Entrepreneurship & Startups</SelectItem>
              <SelectItem value="Job Application & Interview Skills">Job Application & Interview Skills</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 mb-2 block uppercase tracking-wide">
            Target Mentees
          </label>
          <Select
            value={filters.mentees}
            onValueChange={(value) => onFilterChange('mentees', value)}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Any mentee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any mentee</SelectItem>
              <SelectItem value="Early-career professionals">Early-career professionals</SelectItem>
              <SelectItem value="Mid-career leaders">Mid-career leaders</SelectItem>
              <SelectItem value="Entrepreneurs/Founders">Entrepreneurs/Founders</SelectItem>
              <SelectItem value="College/Graduate Students">College/Graduate Students</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}