import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, LayoutDashboard, LogOut, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'WILA Mentorship Network';
    loadUser();
  }, [location.pathname]);

  const loadUser = async () => {
    const currentPage = location.pathname.split('/').pop() || 'Welcome';
    const publicPages = ['Welcome', 'Home', 'Sessions', '']; // Public pages that don't require login
    
    // If on root path with no page, redirect to Welcome
    if (!currentPage || currentPage === '' || location.pathname === '/') {
      navigate(createPageUrl('Welcome'), { replace: true });
      return;
    }
    
    try {
      const isAuthenticated = await base44.auth.isAuthenticated();
      
      if (!isAuthenticated) {
        // Not logged in - only redirect to Welcome from protected pages
        setUser(null);
        setIsLoading(false);
        const protectedPages = ['MentorDashboard', 'AdminDashboard', 'Onboarding', 'MenteeQuestionnaire'];
        if (protectedPages.includes(currentPage)) {
          navigate(createPageUrl('Welcome'), { replace: true });
        }
        setIsLoading(false);
        return;
        return;
      }
      
      const currentUser = await base44.auth.me();
      
      // Check if user has a pre-created mentor profile (by email) - case insensitive
      if (!currentUser.user_type) {
        const allMentors = await base44.entities.Mentor.list();
        const mentorByEmail = allMentors.find(m => 
          m.email && m.email.toLowerCase() === currentUser.email.toLowerCase()
        );
        if (mentorByEmail) {
          // User has a mentor profile - set them as mentor
          await base44.auth.updateMe({ user_type: 'mentor', onboarding_completed: true });
          currentUser.user_type = 'mentor';
          currentUser.onboarding_completed = true;
          setUser(currentUser);
          localStorage.removeItem('intended_user_type');
          if (currentPage === 'Welcome') {
            navigate(createPageUrl('MentorDashboard'), { replace: true });
          }
          setIsLoading(false);
          return;
        }
      }
      
      setUser(currentUser);
      
      // Check for intended user type from localStorage (from Welcome page selection)
      const intendedUserType = localStorage.getItem('intended_user_type');
      
      // If user doesn't have user_type yet, set it from intended type
      if (intendedUserType && !currentUser.user_type) {
        await base44.auth.updateMe({ user_type: intendedUserType, onboarding_completed: true });
        localStorage.removeItem('intended_user_type');
        
        // Redirect based on intended type
        if (intendedUserType === 'mentor') {
          navigate(createPageUrl('MentorDashboard'), { replace: true });
        } else {
          navigate(createPageUrl('Home'), { replace: true });
        }
        setIsLoading(false);
        return;
      }
      
      // If user has intended type in localStorage but already has user_type, just clean up
      // Don't redirect - let them stay on current page (important for session booking flow)
      if (intendedUserType && currentUser.user_type) {
        localStorage.removeItem('intended_user_type');
        setIsLoading(false);
        return;
      }
      
      // If logged in and on Welcome page, redirect based on existing user type
      if (currentPage === 'Welcome' && currentUser.user_type) {
        if (currentUser.user_type === 'mentor') {
          navigate(createPageUrl('MentorDashboard'), { replace: true });
        } else {
          navigate(createPageUrl('Home'), { replace: true });
        }
        setIsLoading(false);
        return;
      }
      
      setIsLoading(false);
    } catch (error) {
      // Error checking auth
      setUser(null);
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const currentPage = location.pathname.split('/').pop();
  const noNavPages = ['Welcome', 'Onboarding', 'MenteeQuestionnaire'];
  
  // Don't show nav on certain pages
  if (noNavPages.includes(currentPage)) {
    if (isLoading) {
      return <div className="min-h-screen">{children}</div>;
    }
    return <div className="min-h-screen">{children}</div>;
  }

  // Show minimal loading for protected pages
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{borderColor:'#003262'}}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm" style={{borderBottomColor:'#003262', borderBottomWidth:'2px'}}>
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <Link 
                            to={createPageUrl('Welcome')} 
                            className="flex items-center gap-3 group"
                          >
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fd42c0ae0bd67c5e62c6ca/6b67e9115_ScreenShot2025-11-29at60408PM.png" 
                alt="WILA Logo" 
                className="h-10 w-auto"
              />
              <span className="text-xl font-bold hidden sm:inline transition-colors" style={{color:'#003262'}}>WILA Mentorship Network</span>
            </Link>

            <div className="flex items-center gap-2">
              {(user?.role === 'admin' || user?.role === 'superadmin') && (
                <Link to={createPageUrl('AdminDashboard')}>
                  <Button variant="ghost" className="gap-2 hover:bg-blue-50" style={{}} onMouseEnter={e=>e.currentTarget.style.color='#003262'} onMouseLeave={e=>e.currentTarget.style.color=''}>
                    <Shield className="w-4 h-4" />
                    <span className="hidden md:inline">Admin</span>
                  </Button>
                </Link>
              )}

              {user?.user_type === 'mentee' && (
                <>
                  <Link to={createPageUrl('Home')}>
                    <Button variant="ghost" className="gap-2 hover:bg-blue-50 hover:text-[#003262]">
                      <Users className="w-4 h-4" />
                      <span className="hidden md:inline">Mentors</span>
                    </Button>
                  </Link>
                  <Link to={createPageUrl('Sessions')}>
                    <Button variant="ghost" className="gap-2 hover:bg-blue-50 hover:text-[#003262]">
                      <Calendar className="w-4 h-4" />
                      <span className="hidden md:inline">Sessions</span>
                    </Button>
                  </Link>
                </>
              )}

              {user?.user_type === 'mentor' && (
                <>
                  <Link to={createPageUrl('MentorDashboard')}>
                    <Button variant="ghost" className="gap-2 hover:bg-blue-50 hover:text-[#003262]">
                      <LayoutDashboard className="w-4 h-4" />
                      <span className="hidden md:inline">Dashboard</span>
                    </Button>
                  </Link>
                  <Link to={createPageUrl('Home')}>
                    <Button variant="ghost" className="gap-2 hover:bg-blue-50 hover:text-[#003262]">
                      <Users className="w-4 h-4" />
                      <span className="hidden md:inline">Mentors</span>
                    </Button>
                  </Link>
                </>
              )}

              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 hover:bg-gray-50 ml-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm" style={{background:'linear-gradient(135deg, #003262, #004080)'}}>
                        {user.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                      </div>
                      <div className="text-left hidden lg:block">
                        <p className="text-sm font-medium text-gray-900 leading-none">{user.full_name}</p>
                        <p className="text-xs text-gray-500 capitalize mt-0.5">{user.user_type || 'User'}</p>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-2">
                      <p className="text-sm font-medium">{user.full_name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="text-xs capitalize" style={{background:'#EDF2F8', color:'#003262'}}>{user.user_type}</Badge>
                        {user.role === 'admin' && (
                          <Badge className="bg-orange-100 text-orange-700 text-xs">Admin</Badge>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    {user.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl('AdminDashboard')} className="cursor-pointer">
                          <Shield className="w-4 h-4 mr-2" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user.user_type === 'mentee' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl('Home')} className="cursor-pointer">
                            <Users className="w-4 h-4 mr-2" />
                            Browse Mentors
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl('Sessions')} className="cursor-pointer">
                            <Calendar className="w-4 h-4 mr-2" />
                            Book Sessions
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    {user.user_type === 'mentor' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl('MentorDashboard')} className="cursor-pointer">
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            My Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl('Home')} className="cursor-pointer">
                            <Users className="w-4 h-4 mr-2" />
                            Browse Mentors
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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