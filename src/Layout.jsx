import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Users, Calendar, LayoutDashboard, LogOut } from "lucide-react";

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  // Don't show nav on onboarding page
  if (location.pathname.includes('Onboarding')) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('Home')} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <div className="text-white font-bold text-sm">WILA</div>
              </div>
              <span className="text-xl font-bold text-gray-900">Mentorship Network</span>
            </Link>

            <div className="flex items-center gap-4">
              {user?.user_type === 'mentee' && (
                <>
                  <Link to={createPageUrl('Home')}>
                    <Button variant="ghost" className="gap-2">
                      <Users className="w-4 h-4" />
                      Browse Mentors
                    </Button>
                  </Link>
                  <Link to={createPageUrl('Sessions')}>
                    <Button variant="ghost" className="gap-2">
                      <Calendar className="w-4 h-4" />
                      Book Sessions
                    </Button>
                  </Link>
                </>
              )}

              {user?.user_type === 'mentor' && (
                <Link to={createPageUrl('MentorDashboard')}>
                  <Button variant="ghost" className="gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
              )}

              {user && (
                <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.user_type || 'User'}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {children}
    </div>
  );
}