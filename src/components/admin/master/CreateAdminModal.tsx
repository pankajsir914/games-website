import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
<<<<<<< HEAD
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
=======
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
import { useMasterAdminActions } from '@/hooks/useMasterAdminActions';
import { Loader2 } from 'lucide-react';

interface CreateAdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateAdminModal = ({ open, onOpenChange }: CreateAdminModalProps) => {
  const { createAdmin, creating } = useMasterAdminActions();
<<<<<<< HEAD
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', points: '', role: 'admin' });
=======
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', points: '' });
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const pts = parseFloat(form.points || '0');
<<<<<<< HEAD
    createAdmin({ 
      fullName: form.fullName, 
      email: form.email, 
      phone: form.phone, 
      password: form.password, 
      points: isNaN(pts) ? 0 : pts,
      role: form.role as 'admin' | 'moderator'
    }, {
      onSuccess: () => {
        setForm({ fullName: '', email: '', phone: '', password: '', points: '', role: 'admin' });
=======
    createAdmin({ fullName: form.fullName, email: form.email, phone: form.phone, password: form.password, points: isNaN(pts) ? 0 : pts }, {
      onSuccess: () => {
        setForm({ fullName: '', email: '', phone: '', password: '', points: '' });
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create Admin</DialogTitle>
          <DialogDescription>Master Admin can create Admin accounts and allocate initial points.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div>
<<<<<<< HEAD
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
=======
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
            <Label>Initial Points</Label>
            <Input type="number" min={0} step="1" value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Admin
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
