import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, ArrowRight, CheckCircle } from 'lucide-react';

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

  return (
    <div className="min-h-screen flex flex-col" style={{background: 'linear-gradient(160deg, #001f3f 0%, #003262 50%, #004080 100%)'}}>
      {showMatchingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">How would you like to find a mentor?</h3>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setShowMatchingModal(false);
                  window.location.href = createPageUrl('Home');
                }}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg"
              >
                Smart Matching
              </Button>
              <Button
                onClick={() => {
                  setShowMatchingModal(false);
                  window.location.href = createPageUrl('Home');
                }}
                variant="outline"
                className="w-full h-12 text-gray-900 border-2 border-gray-300 hover:bg-gray-50 font-semibold rounded-lg"
              >
                Browse All Mentors
              </Button>
              <Button
                onClick={() => setShowMatchingModal(false)}
                variant="ghost"
                className="w-full h-10 text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Top gold accent bar */}
      <div className="h-1 w-full" style={{background: '#FDB515'}} />

      {/* Header */}
      <header className="px-8 py-5 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd42c0ae0bd67c5e62c6ca/6b67e9115_ScreenShot2025-11-29at60408PM.png"
            alt="WILA Logo"
            className="h-10 w-auto"
          />
          <span className="text-white font-bold text-xl hidden sm:inline tracking-wide">WILA Mentorship Network</span>
        </div>
        <div className="text-sm text-blue-200">UC Berkeley Haas</div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-5xl w-full">

          {/* Hero text */}
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-6 tracking-wider uppercase" style={{background: 'rgba(253,181,21,0.15)', color: '#FDB515', border: '1px solid rgba(253,181,21,0.3)'}}>
              Berkeley Haas Community
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Welcome to<br />
              <span style={{color: '#FDB515'}}>WILA Mentorship</span>
            </h1>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto leading-relaxed">
              Connecting Berkeley Haas women in leadership with the next generation of ambitious professionals.
            </p>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Mentee Card */}
            <div
              className="rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              style={{background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)'}}
              onClick={handleMenteeClick}
            >
              <div className="p-1" style={{background: 'linear-gradient(90deg, #003262, #0052a5)'}} />
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{background: 'rgba(253,181,21,0.15)'}}>
                    <Users className="w-7 h-7" style={{color: '#FDB515'}} />
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
                  {['Browse mentor profiles', 'Book 1-on-1 sessions', 'Get career guidance', 'Access mentorship resources'].map(item => (
                    <li key={item} className="flex items-center gap-3 text-sm text-blue-100">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{color: '#FDB515'}} />
                      {item}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={handleMenteeClick}
                  className="w-full text-white font-semibold py-3 text-base rounded-xl group-hover:opacity-95 transition-all flex items-center justify-center gap-2"
                  style={{background: 'linear-gradient(135deg, #003262, #0052a5)'}}
                  size="lg"
                >
                  Browse Mentors
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>

            {/* Mentor Card */}
            <div
              className="rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              style={{background: 'rgba(253,181,21,0.06)', border: '1px solid rgba(253,181,21,0.25)', backdropFilter: 'blur(12px)'}}
              onClick={handleMentorClick}
            >
              <div className="p-1" style={{background: 'linear-gradient(90deg, #FDB515, #e8a510)'}} />
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{background: 'rgba(253,181,21,0.15)'}}>
                    <UserCheck className="w-7 h-7" style={{color: '#FDB515'}} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">I'm a Mentor</h2>
                    <p className="text-yellow-200 text-sm">Share your expertise</p>
                  </div>
                </div>

                <p className="text-blue-200 mb-6 leading-relaxed">
                  Share your expertise and help guide the next generation of women in leadership and business.
                </p>

                <ul className="space-y-3 mb-8">
                  {['Create your mentor profile', 'Set your availability', 'Share your expertise', 'Make a difference'].map(item => (
                    <li key={item} className="flex items-center gap-3 text-sm text-blue-100">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{color: '#FDB515'}} />
                      {item}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={handleMentorClick}
                  className="w-full font-semibold py-3 text-base rounded-xl transition-all flex items-center justify-center gap-2 hover:opacity-90"
                  style={{background: '#FDB515', color: '#003262'}}
                  size="lg"
                >
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
      <div className="h-1 w-full" style={{background: '#FDB515'}} />
    </div>
  );
}