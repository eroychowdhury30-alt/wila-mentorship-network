import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, UserCheck, UserX, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        toast.error('Access denied - Admin only');
        navigate(createPageUrl('Home'));
        return;
      }
      setUser(currentUser);
    } catch (error) {
      console.error('Error checking admin:', error);
      navigate(createPageUrl('Home'));
    }
  };

  const { data: pendingMentors = [], isLoading: mentorsLoading } = useQuery({
    queryKey: ['pending-mentors'],
    queryFn: () => base44.entities.Mentor.filter({ status: 'pending' }),
  });

  const { data: approvedMentors = [] } = useQuery({
    queryKey: ['approved-mentors'],
    queryFn: () => base44.entities.Mentor.filter({ status: 'approved' }),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: allSessions = [] } = useQuery({
    queryKey: ['all-sessions'],
    queryFn: () => base44.entities.Session.list(),
  });

  const approveMentorMutation = useMutation({
    mutationFn: (mentorId) => base44.entities.Mentor.update(mentorId, { status: 'approved' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['pending-mentors']);
      queryClient.invalidateQueries(['approved-mentors']);
      toast.success('Mentor approved!');
    },
  });

  const rejectMentorMutation = useMutation({
    mutationFn: (mentorId) => base44.entities.Mentor.update(mentorId, { status: 'rejected' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['pending-mentors']);
      toast.success('Mentor rejected');
    },
  });

  const deleteMentorMutation = useMutation({
    mutationFn: (mentorId) => base44.entities.Mentor.delete(mentorId),
    onSuccess: () => {
      queryClient.invalidateQueries(['pending-mentors']);
      queryClient.invalidateQueries(['approved-mentors']);
      toast.success('Mentor removed');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => base44.entities.User.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-users']);
      toast.success('User removed');
    },
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const menteeUsers = allUsers.filter(u => u.user_type === 'mentee');
  const mentorUsers = allUsers.filter(u => u.user_type === 'mentor');
  const bookedSessions = allSessions.filter(s => s.is_booked);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <p className="text-gray-600">Manage mentors, mentees, and platform operations</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{pendingMentors.length}</div>
              <p className="text-xs text-gray-500 mt-1">Mentors awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Active Mentors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{approvedMentors.length}</div>
              <p className="text-xs text-gray-500 mt-1">Approved mentors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Mentees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{menteeUsers.length}</div>
              <p className="text-xs text-gray-500 mt-1">Registered mentees</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Booked Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{bookedSessions.length}</div>
              <p className="text-xs text-gray-500 mt-1">Total bookings</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" />
              Pending Mentors ({pendingMentors.length})
            </TabsTrigger>
            <TabsTrigger value="mentors" className="gap-2">
              <UserCheck className="w-4 h-4" />
              Active Mentors ({approvedMentors.length})
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              All Users ({allUsers.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Mentors */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Mentor Applications Pending Approval</CardTitle>
              </CardHeader>
              <CardContent>
                {mentorsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  </div>
                ) : pendingMentors.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No pending applications</p>
                ) : (
                  <div className="space-y-4">
                    {pendingMentors.map((mentor) => (
                      <div key={mentor.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
                                {mentor.full_name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{mentor.full_name}</h3>
                                <p className="text-sm text-gray-600">{mentor.title} at {mentor.company}</p>
                              </div>
                            </div>
                            <div className="ml-15 space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{mentor.experience_years}</Badge>
                              </div>
                              {mentor.expertise && mentor.expertise.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Expertise:</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {mentor.expertise.map((exp, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {exp}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {mentor.bio && (
                                <p className="text-sm text-gray-600 mt-2">{mentor.bio}</p>
                              )}
                              {mentor.linkedin_url && (
                                <a 
                                  href={mentor.linkedin_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline"
                                >
                                  View LinkedIn Profile →
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              onClick={() => approveMentorMutation.mutate(mentor.id)}
                              disabled={approveMentorMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => rejectMentorMutation.mutate(mentor.id)}
                              disabled={rejectMentorMutation.isPending}
                              variant="destructive"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Mentors */}
          <TabsContent value="mentors">
            <Card>
              <CardHeader>
                <CardTitle>Active Mentors</CardTitle>
              </CardHeader>
              <CardContent>
                {approvedMentors.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No approved mentors yet</p>
                ) : (
                  <div className="space-y-3">
                    {approvedMentors.map((mentor) => (
                      <div key={mentor.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold text-sm">
                            {mentor.full_name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium">{mentor.full_name}</p>
                            <p className="text-sm text-gray-600">{mentor.title} at {mentor.company}</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            if (confirm(`Remove ${mentor.full_name} from the platform?`)) {
                              deleteMentorMutation.mutate(mentor.id);
                            }
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Users */}
          <TabsContent value="users">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mentees ({menteeUsers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {menteeUsers.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No mentees registered</p>
                  ) : (
                    <div className="space-y-2">
                      {menteeUsers.map((mentee) => (
                        <div key={mentee.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div>
                            <p className="font-medium">{mentee.full_name}</p>
                            <p className="text-sm text-gray-600">{mentee.email}</p>
                          </div>
                          <Button
                            onClick={() => {
                              if (confirm(`Remove ${mentee.full_name} from the platform?`)) {
                                deleteUserMutation.mutate(mentee.id);
                              }
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mentor Users ({mentorUsers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {mentorUsers.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No mentor users</p>
                  ) : (
                    <div className="space-y-2">
                      {mentorUsers.map((mentor) => (
                        <div key={mentor.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div>
                            <p className="font-medium">{mentor.full_name}</p>
                            <p className="text-sm text-gray-600">{mentor.email}</p>
                          </div>
                          <Button
                            onClick={() => {
                              if (confirm(`Remove ${mentor.full_name} from the platform?`)) {
                                deleteUserMutation.mutate(mentor.id);
                              }
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}