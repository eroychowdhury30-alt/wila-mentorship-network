import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, ArrowRight, CheckCircle } from 'lucide-react';
import MatchingModal from '../components/MatchingModal';

export default function Welcome() {
  const [showMatchingModal, setShowMatchingModal] = useState(false);

  const handleMenteeClick = () => {
    setShowMatchingModal(true);
  };

  const handleMentorClick = async () => {
    localStorage.setItem('intended_user_type', 'mentor');
    const isAuth = await base44.auth.isAuthenticated();
    if (isAuth) {
      window.location.href = createPageUrl('MentorDashboard');
    } else {
      base44.auth.redirectToLogin(window.location.origin + createPageUrl('MentorDashboard'));
    }
  };

  const handleMatchingModeSelect = async (mode) => {
    // Mentees can browse without logging in — login only required to book
    window.location.href = createPageUrl('Home');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #001f3f 0%, #003262 50%, #004080 100%)' }}>
      <MatchingModal
        open={showMatchingModal}
        onOpenChange={setShowMatchingModal}
        onSelectMode={handleMatchingModeSelect} />
      

      {/* Top gold accent bar */}
      <div className="h-1 w-full" style={{ background: '#FDB515' }} />

      {/* Header */}
      









      

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-5xl w-full">

          {/* Hero text */}
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-6 tracking-wider uppercase" style={{ background: 'rgba(253,181,21,0.15)', color: '#FDB515', border: '1px solid rgba(253,181,21,0.3)' }}>
              Berkeley Haas Community
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Welcome to<br />
              <span style={{ color: '#FDB515' }}>Haas Women Mentorship Network</span>
            </h1>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto leading-relaxed">
              Connecting Berkeley Haas women in leadership with the next generation of ambitious professionals.
            </p>

            <div className="mt-8 max-w-xl mx-auto rounded-xl px-6 py-5 text-center" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <p className="text-lg font-semibold text-white mb-2">Our next Haas Women Mentorship Day is Oct 30 2026.</p>
              <p className="text-blue-200 text-sm">
                Alumnae Panel &amp; Kickoff from 9-10AM PT{' '}
                <a
                  href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Haas%20Women%20Mentorship%20Day%20-%20Alumnae%20Panel%20%26%20Kickoff&dates=20261030T160000Z/20261030T170000Z&details=Alumnae%20Panel%20%26%20Kickoff%20from%209-10AM%20PT"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline hover:opacity-80"
                  style={{ color: '#FDB515' }}
                >
                  [Add to Calendar]
                </a>
              </p>
              <p className="text-blue-200 text-sm mt-1">
                1:1 mentorship sessions from 10-4PM PT <span className="text-blue-300">[Come back after Oct 12 to sign up]</span>
              </p>
            </div>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Mentee Card */}
            <div
              className="rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)' }}
              onClick={handleMenteeClick}>
              
              <div className="p-1" style={{ background: 'linear-gradient(90deg, #003262, #0052a5)' }} />
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: 'rgba(253,181,21,0.15)' }}>
                    <Users className="w-7 h-7" style={{ color: '#FDB515' }} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">I'm a Mentee</h2>
                    <p className="text-blue-300 text-sm">Find your mentor</p>
                  </div>
                </div>

                <p className="text-blue-200 mb-6 leading-relaxed">
                  Connect with experienced leaders and get personalized guidance for your professional journey.
                </p>

                <ul className="space-y-3 mb-8">
                  {['Browse mentor profiles', 'Book 1-on-1 sessions', 'Get career guidance', 'Access mentorship resources'].map((item) =>
                  <li key={item} className="flex items-center gap-3 text-sm text-blue-100">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#FDB515' }} />
                      {item}
                    </li>
                  )}
                </ul>

                <Button
                  onClick={handleMenteeClick}
                  className="w-full text-white font-semibold py-3 text-base rounded-xl group-hover:opacity-95 transition-all flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #003262, #0052a5)' }}
                  size="lg">
                  
                  Browse Mentors
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>

            {/* Mentor Card */}
            <div
              className="rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              style={{ background: 'rgba(253,181,21,0.06)', border: '1px solid rgba(253,181,21,0.25)', backdropFilter: 'blur(12px)' }}
              onClick={handleMentorClick}>
              
              <div className="p-1" style={{ background: 'linear-gradient(90deg, #FDB515, #e8a510)' }} />
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: 'rgba(253,181,21,0.15)' }}>
                    <UserCheck className="w-7 h-7" style={{ color: '#FDB515' }} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">I'm a Mentor</h2>
                    <p className="text-yellow-200 text-sm">Share your expertise</p>
                  </div>
                </div>

                <p className="text-blue-200 mb-4 leading-relaxed">
                  Share your expertise and help guide the next generation of women in leadership and business.
                </p>

                <div className="mb-6 p-3 rounded-lg" style={{ background: 'rgba(253,181,21,0.15)', border: '1px solid rgba(253,181,21,0.3)' }}>
                  <p className="text-sm font-semibold" style={{ color: '#FDB515' }}>Availability is due by October 8.</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {['Create your mentor profile', 'Set your availability', 'Share your expertise', 'Make a difference'].map((item) =>
                  <li key={item} className="flex items-center gap-3 text-sm text-blue-100">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#FDB515' }} />
                      {item}
                    </li>
                  )}
                </ul>

                <Button
                  onClick={handleMentorClick}
                  className="w-full font-semibold py-3 text-base rounded-xl transition-all flex items-center justify-center gap-2 hover:opacity-90"
                  style={{ background: '#FDB515', color: '#003262' }}
                  size="lg">
                  
                  Sign Up / Sign In
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-blue-400 text-sm">
        © {new Date().getFullYear()} WILA Mentorship Network · UC Berkeley Haas School of Business
      </footer>

      {/* Bottom gold accent bar */}
      <div className="h-1 w-full" style={{ background: '#FDB515' }} />
    </div>);

}