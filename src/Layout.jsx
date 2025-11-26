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
    loadUser();
  }, [location.pathname]);

  const loadUser = async () => {
    const currentPage = location.pathname.split('/').pop();
    const publicPages = ['Welcome', 'Home', 'Sessions']; // Public pages that don't require login
    
    try {
      const isAuthenticated = await base44.auth.isAuthenticated();
      
      if (!isAuthenticated) {
        // Not logged in - redirect to Welcome if not on a public page
        setUser(null);
        setIsLoading(false);
        if (!publicPages.includes(currentPage)) {
          navigate(createPageUrl('Welcome'), { replace: true });
        }
        return;
      }
      
      const currentUser = await base44.auth.me();
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <Link 
              to={user?.user_type === 'mentor' ? createPageUrl('MentorDashboard') : createPageUrl('Home')} 
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <div className="text-white font-bold text-sm">WILA</div>
              </div>
              <span className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">WILA Connect</span>
            </Link>

            <div className="flex items-center gap-2">
              {user?.role === 'admin' && (
                <Link to={createPageUrl('AdminDashboard')}>
                  <Button variant="ghost" className="gap-2 hover:bg-purple-50 hover:text-purple-600">
                    <Shield className="w-4 h-4" />
                    <span className="hidden md:inline">Admin</span>
                  </Button>
                </Link>
              )}

              {user?.user_type === 'mentee' && (
                <>
                  <Link to={createPageUrl('Home')}>
                    <Button variant="ghost" className="gap-2 hover:bg-purple-50 hover:text-purple-600">
                      <Users className="w-4 h-4" />
                      <span className="hidden md:inline">Mentors</span>
                    </Button>
                  </Link>
                  <Link to={createPageUrl('Sessions')}>
                    <Button variant="ghost" className="gap-2 hover:bg-purple-50 hover:text-purple-600">
                      <Calendar className="w-4 h-4" />
                      <span className="hidden md:inline">Sessions</span>
                    </Button>
                  </Link>
                </>
              )}

              {user?.user_type === 'mentor' && (
                <>
                  <Link to={createPageUrl('MentorDashboard')}>
                    <Button variant="ghost" className="gap-2 hover:bg-purple-50 hover:text-purple-600">
                      <LayoutDashboard className="w-4 h-4" />
                      <span className="hidden md:inline">Dashboard</span>
                    </Button>
                  </Link>
                  <Link to={createPageUrl('Home')}>
                    <Button variant="ghost" className="gap-2 hover:bg-purple-50 hover:text-purple-600">
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
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm">
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
                        <Badge className="bg-purple-100 text-purple-700 text-xs capitalize">{user.user_type}</Badge>
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