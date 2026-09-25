import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Send } from 'lucide-react';

export default function AnnouncementComposer({ counts }) {
  const [audience, setAudience] = useState('all');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const audienceCounts = {
    all: counts?.all || 0,
    mentors: counts?.mentors || 0,
    mentees: counts?.mentees || 0,
  };
  const audienceLabel = { all: 'all users', mentors: 'mentors', mentees: 'mentees' }[audience];

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Please enter both a subject and a message');
      return;
    }
    if (audienceCounts[audience] === 0) {
      toast.error('There are no recipients in this audience');
      return;
    }
    if (!confirm(`Send this announcement to ${audienceCounts[audience]} ${audienceLabel}?`)) {
      return;
    }

    setSending(true);
    try {
      const res = await base44.functions.invoke('sendAnnouncementEmail', {
        audience,
        subject: subject.trim(),
        body: body.trim(),
      });
      const sent = res.data?.sent || 0;
      const failed = res.data?.failed_count || 0;
      if (failed > 0) {
        toast.warning(`Sent to ${sent} recipients — ${failed} failed. Try again or check the logs for details.`);
      } else {
        toast.success(`Announcement sent to ${sent} recipients!`);
      }
      setSubject('');
      setBody('');
    } catch (error) {
      console.error('Announcement error:', error);
      toast.error('Failed to send announcement: ' + (error?.response?.data?.error || error.message));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <Label htmlFor="announcement-audience">Audience</Label>
        <Select value={audience} onValueChange={setAudience}>
          <SelectTrigger id="announcement-audience" className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users ({audienceCounts.all})</SelectItem>
            <SelectItem value="mentors">Mentors ({audienceCounts.mentors})</SelectItem>
            <SelectItem value="mentees">Mentees ({audienceCounts.mentees})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="announcement-subject">Subject</Label>
        <Input
          id="announcement-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Announcement subject"
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="announcement-body">Message</Label>
        <Textarea
          id="announcement-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your announcement..."
          rows={6}
          className="mt-2"
        />
      </div>

      <Button
        onClick={handleSend}
        disabled={sending || !subject.trim() || !body.trim()}
        className="bg-amber-600 hover:bg-amber-700"
      >
        <Send className="w-4 h-4 mr-2" />
        {sending ? 'Sending...' : `Send to ${audienceCounts[audience]} ${audienceLabel}`}
      </Button>
    </div>
  );
}