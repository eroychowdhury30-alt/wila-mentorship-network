import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, UserCheck, XCircle, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ModeratorDashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (!['moderator', 'admin', 'superadmin'].includes(currentUser.role)) {
        toast.error('Access denied');
        navigate(createPageUrl('Home'));
        return;
      }
      setUser(currentUser);
    } catch {
      navigate(createPageUrl('Home'));
    }
  };

  const { data: pendingMentors = [], isLoading: pendingLoading } = useQuery({
    queryKey: ['mod-pending-mentors'],
    queryFn: () => base44.entities.Mentor.filter({ status: 'pending' }),
    enabled: !!user,
  });

  const { data: approvedMentors = [] } = useQuery({
    queryKey: ['mod-approved-mentors'],
    queryFn: () => base44.entities.Mentor.filter({ status: 'approved' }),
    enabled: !!user,
  });

  const { data: rejectedMentors = [] } = useQuery({
    queryKey: ['mod-rejected-mentors'],
    queryFn: () => base44.entities.Mentor.filter({ status: 'rejected' }),
    enabled: !!user,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['mod-all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user,
  });

  const approveMutation = useMutation({
    mutationFn: (id) => base44.entities.Mentor.update(id, { status: 'approved' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['mod-pending-mentors']);
      queryClient.invalidateQueries(['mod-approved-mentors']);
      toast.success('Mentor approved!');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => base44.entities.Mentor.update(id, { status: 'rejected' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['mod-pending-mentors']);
      queryClient.invalidateQueries(['mod-rejected-mentors']);
      toast.success('Mentor rejected');
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const menteeUsers = allUsers.filter(u => u.user_type === 'mentee');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Moderator Dashboard</h1>
            <p className="text-gray-600">Review mentor applications and view platform data</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{pendingMentors.length}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Active Mentors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{approvedMentors.length}</div>
              <p className="text-xs text-gray-500 mt-1">Approved & visible</p>
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
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" />
              Pending ({pendingMentors.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-2">
              <UserCheck className="w-4 h-4" />
              Active ({approvedMentors.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <XCircle className="w-4 h-4" />
              Rejected ({rejectedMentors.length})
            </TabsTrigger>
            <TabsTrigger value="mentees" className="gap-2">
              <Users className="w-4 h-4" />
              Mentees ({menteeUsers.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Mentor Applications Pending Approval</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingLoading ? (
                  <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
                ) : pendingMentors.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No pending applications</p>
                ) : (
                  <div className="space-y-4">
                    {pendingMentors.map((mentor) => (
                      <div key={mentor.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                                {mentor.full_name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{mentor.full_name}</h3>
                                <p className="text-sm text-gray-600">{mentor.title} at {mentor.company}</p>
                              </div>
                            </div>
                            {mentor.expertise?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {mentor.expertise.map((exp, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">{exp}</Badge>
                                ))}
                              </div>
                            )}
                            {mentor.bio && <p className="text-sm text-gray-600 mt-2">{mentor.bio}</p>}
                            {mentor.linkedin_url && (
                              <a href={mentor.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 block">
                                View LinkedIn →
                              </a>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              onClick={() => approveMutation.mutate(mentor.id)}
                              disabled={approveMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => rejectMutation.mutate(mentor.id)}
                              disabled={rejectMutation.isPending}
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

          {/* Active Mentors - read only */}
          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Active Mentors</CardTitle>
              </CardHeader>
              <CardContent>
                {approvedMentors.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No active mentors</p>
                ) : (
                  <div className="space-y-3">
                    {approvedMentors.map((mentor) => (
                      <div key={mentor.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold text-sm">
                            {mentor.full_name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{mentor.full_name}</p>
                              <Badge className="bg-green-600 text-white text-xs">Active</Badge>
                            </div>
                            <p className="text-sm text-gray-600">{mentor.title} at {mentor.company}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rejected - read only */}
          <TabsContent value="rejected">
            <Card>
              <CardHeader>
                <CardTitle>Rejected Applications</CardTitle>
              </CardHeader>
              <CardContent>
                {rejectedMentors.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No rejected mentors</p>
                ) : (
                  <div className="space-y-3">
                    {rejectedMentors.map((mentor) => (
                      <div key={mentor.id} className="flex items-center p-3 border border-red-200 rounded-lg hover:bg-red-50 gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-semibold text-sm">
                          {mentor.full_name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{mentor.full_name}</p>
                            <Badge className="bg-red-600 text-white text-xs">Rejected</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{mentor.title} at {mentor.company}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mentees - read only */}
          <TabsContent value="mentees">
            <Card>
              <CardHeader>
                <CardTitle>Registered Mentees ({menteeUsers.length})</CardTitle>
                <p className="text-sm text-gray-500 mt-1">View only — moderators cannot modify mentee accounts</p>
              </CardHeader>
              <CardContent>
                {menteeUsers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No mentees registered</p>
                ) : (
                  <div className="space-y-2">
                    {menteeUsers.map((mentee) => (
                      <div key={mentee.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm mr-3">
                          {mentee.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </div>
                        <div>
                          <p className="font-medium">{mentee.full_name}</p>
                          <p className="text-sm text-gray-600">{mentee.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}