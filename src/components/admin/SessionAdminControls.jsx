import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Pencil, XCircle, Trash2 } from 'lucide-react';

const TIME_SLOTS = [
  '10am-10:30am', '10:30am-11am', '11am-11:30am', '11:30am-12pm',
  '12pm-12:30pm', '12:30pm-1pm', '1pm-1:30pm', '1:30pm-2pm',
  '2pm-2:30pm', '2:30pm-3pm', '3pm-3:30pm', '3:30pm-4pm',
];

export default function SessionAdminControls({ session, approvedMentors = [] }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editData, setEditData] = useState(null);
  const queryClient = useQueryClient();

  const mentorNames = approvedMentors.map(m => m.full_name);
  const slotOptions = editData && editData.time_slot && !TIME_SLOTS.includes(editData.time_slot)
    ? [editData.time_slot, ...TIME_SLOTS]
    : TIME_SLOTS;
  const mentorOptions = editData && editData.mentor_name && !mentorNames.includes(editData.mentor_name)
    ? [editData.mentor_name, ...mentorNames]
    : mentorNames;

  const openEdit = () => {
    setEditData({
      mentor_name: session.mentor_name || '',
      mentor_email: session.mentor_email || '',
      meeting_link: session.meeting_link || '',
      date: session.date || '',
      time_slot: session.time_slot || '',
      status: session.status || 'scheduled',
    });
    setEditing(true);
  };

  const handleMentorChange = (name) => {
    const mentor = approvedMentors.find(m => m.full_name === name);
    setEditData(prev => ({
      ...prev,
      mentor_name: name,
      mentor_email: mentor?.email || prev.mentor_email,
      meeting_link: mentor?.meeting_link || prev.meeting_link,
    }));
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      await base44.entities.Session.update(session.id, editData);
      queryClient.invalidateQueries({ queryKey: ['all-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Session updated');
      setEditing(false);
    } catch (error) {
      toast.error('Failed to update session: ' + error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm(`Cancel this session with ${session.mentor_name}? The slot becomes available again.`)) {
      return;
    }
    setBusy(true);
    try {
      await base44.entities.Session.update(session.id, { status: 'cancelled', is_booked: false });
      queryClient.invalidateQueries({ queryKey: ['all-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Session cancelled');
    } catch (error) {
      toast.error('Failed to cancel session: ' + error.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Permanently delete this session record? This cannot be undone.')) {
      return;
    }
    setBusy(true);
    try {
      await base44.entities.Session.delete(session.id);
      queryClient.invalidateQueries({ queryKey: ['all-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Session deleted');
    } catch (error) {
      toast.error('Failed to delete session: ' + error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={openEdit} disabled={busy}>
        <Pencil className="w-4 h-4 mr-1" />
        Edit
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-orange-600 border-orange-300 hover:bg-orange-50"
        onClick={handleCancel}
        disabled={busy}
      >
        <XCircle className="w-4 h-4 mr-1" />
        Cancel
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={handleDelete}
        disabled={busy}
      >
        <Trash2 className="w-4 h-4 mr-1" />
        Delete
      </Button>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Session (SuperAdmin)</DialogTitle>
          </DialogHeader>
          {editData && (
            <div className="space-y-4 py-2">
              <div>
                <Label>Mentor</Label>
                <Select value={editData.mentor_name} onValueChange={handleMentorChange}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select mentor" />
                  </SelectTrigger>
                  <SelectContent>
                    {mentorOptions.map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Reassigning updates the mentor's email and meeting link.</p>
              </div>

              <div>
                <Label htmlFor="session-date">Date</Label>
                <Input
                  id="session-date"
                  type="date"
                  value={editData.date}
                  onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Time Slot</Label>
                <Select
                  value={editData.time_slot}
                  onValueChange={(value) => setEditData({ ...editData, time_slot: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {slotOptions.map((slot) => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={editData.status}
                  onValueChange={(value) => setEditData({ ...editData, status: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setEditing(false)}>Close</Button>
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