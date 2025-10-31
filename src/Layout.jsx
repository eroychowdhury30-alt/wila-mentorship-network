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
    const publicPages = ['Welcome'];
    
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsLoading(false);
      
      // If logged in and on Welcome, redirect to Home
      if (currentPage === 'Welcome' && currentUser.onboarding_completed) {
        navigate(createPageUrl('Home'), { replace: true });
        return;
      }
      
      // Handle onboarding
      if (!currentUser.onboarding_completed || !currentUser.user_type) {
        const intendedUserType = localStorage.getItem('intended_user_type');
        
        if (intendedUserType && currentPage !== 'MenteeQuestionnaire') {
          await base44.auth.updateMe({ user_type: intendedUserType });
          localStorage.removeItem('intended_user_type');
          
          if (intendedUserType === 'mentee') {
            navigate(createPageUrl('MenteeQuestionnaire'), { replace: true });
          } else {
            navigate(createPageUrl('MentorDashboard'), { replace: true });
          }
        }
      }
    } catch (error) {
      // Not logged in
      setUser(null);
      setIsLoading(false);
      
      // Redirect to Welcome if not on a public page
      if (!publicPages.includes(currentPage)) {
        navigate(createPageUrl('Welcome'), { replace: true });
      }
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('Home')} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <div className="text-white font-bold text-sm">WILA</div>
              </div>
              <span className="text-xl font-bold text-gray-900">Mentorship Network</span>
            </Link>

            <div className="flex items-center gap-4">
              {user?.role === 'admin' && (
                <Link to={createPageUrl('AdminDashboard')}>
                  <Button variant="ghost" className="gap-2">
                    <Shield className="w-4 h-4" />
                    <span className="hidden md:inline">Admin Panel</span>
                  </Button>
                </Link>
              )}

              {user?.user_type === 'mentee' && (
                <>
                  <Link to={createPageUrl('Home')}>
                    <Button variant="ghost" className="gap-2">
                      <Users className="w-4 h-4" />
                      <span className="hidden md:inline">Browse Mentors</span>
                    </Button>
                  </Link>
                  <Link to={createPageUrl('Sessions')}>
                    <Button variant="ghost" className="gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="hidden md:inline">Book Sessions</span>
                    </Button>
                  </Link>
                </>
              )}

              {user?.user_type === 'mentor' && (
                <>
                  <Link to={createPageUrl('Home')}>
                    <Button variant="ghost" className="gap-2">
                      <Users className="w-4 h-4" />
                      <span className="hidden md:inline">Browse Mentors</span>
                    </Button>
                  </Link>
                  <Link to={createPageUrl('MentorDashboard')}>
                    <Button variant="ghost" className="gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      <span className="hidden md:inline">Dashboard</span>
                    </Button>
                  </Link>
                </>
              )}

              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {user.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                      </div>
                      <div className="text-left hidden md:block">
                        <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.user_type || 'User'}</p>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-2">
                      <p className="text-sm font-medium">{user.full_name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <p className="text-xs text-purple-600 capitalize mt-1">{user.user_type} Account</p>
                      {user.role === 'admin' && (
                        <Badge className="mt-1 bg-orange-500">Admin</Badge>
                      )}
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
                          <Link to={createPageUrl('Home')} className="cursor-pointer">
                            <Users className="w-4 h-4 mr-2" />
                            Browse Mentors
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl('MentorDashboard')} className="cursor-pointer">
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            My Dashboard
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