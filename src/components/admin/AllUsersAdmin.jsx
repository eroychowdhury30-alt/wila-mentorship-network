import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';

export default function AllUsersAdmin({ users, currentUserId }) {
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState(null);
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();

  const openEdit = (u) => {
    setEditing(u);
    setEditData({ full_name: u.full_name || '', user_type: u.user_type || 'none' });
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      await base44.entities.User.update(editing.id, {
        full_name: editData.full_name.trim(),
        user_type: editData.user_type === 'none' ? '' : editData.user_type,
      });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      queryClient.invalidateQueries({ queryKey: ['all-admins'] });
      toast.success('User updated');
      setEditing(null);
    } catch (error) {
      toast.error('Failed to update user: ' + error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (u) => {
    if (!confirm(`Permanently delete ${u.full_name || u.email}'s account? This cannot be undone.`)) {
      return;
    }
    setBusy(true);
    try {
      await base44.entities.User.delete(u.id);
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      queryClient.invalidateQueries({ queryKey: ['all-admins'] });
      toast.success('User deleted');
    } catch (error) {
      toast.error('Failed to delete user: ' + error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {users.length === 0 && (
        <p className="text-center text-gray-500 py-8">No users</p>
      )}
      {users.map((u) => (
        <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-medium">{u.full_name || '(no name)'}</p>
              <p className="text-sm text-gray-600">{u.email}</p>
            </div>
            <Badge
              className={
                u.role === 'superadmin' ? 'bg-amber-600 text-white text-xs' :
                u.role === 'admin' ? 'bg-purple-600 text-white text-xs' :
                u.role === 'moderator' ? 'bg-blue-600 text-white text-xs' : 'bg-gray-100 text-gray-700 text-xs'
              }
            >
              {u.role}
            </Badge>
            {u.user_type && <Badge variant="outline" className="text-xs capitalize">{u.user_type}</Badge>}
          </div>
          {u.id === currentUserId ? (
            <Badge className="bg-green-100 text-green-700">You</Badge>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => openEdit(u)} disabled={busy}>
                <Pencil className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleDelete(u)}
                disabled={busy}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
      ))}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit User (SuperAdmin)</DialogTitle>
          </DialogHeader>
          {editData && (
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="edit-user-name">Full Name</Label>
                <Input
                  id="edit-user-name"
                  value={editData.full_name}
                  onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>User Type</Label>
                <Select
                  value={editData.user_type}
                  onValueChange={(value) => setEditData({ ...editData, user_type: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mentor">Mentor</SelectItem>
                    <SelectItem value="mentee">Mentee</SelectItem>
                    <SelectItem value="none">Unassigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button onClick={handleSave} disabled={busy} className="bg-amber-600 hover:bg-amber-700">
                  {busy ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}