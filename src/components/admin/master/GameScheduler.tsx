import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useGameSchedules } from '@/hooks/useGameSchedules';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, Plus, Trash2, Edit, RefreshCw, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface GameSchedulerProps {
  gameType: string;
  gameName: string;
}

export const GameScheduler: React.FC<GameSchedulerProps> = ({ gameType, gameName }) => {
  const { schedules, createSchedule, updateSchedule, deleteSchedule, isCreating } = useGameSchedules(gameType);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [formData, setFormData] = useState({
    schedule_type: 'maintenance',
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    is_recurring: false,
    recurrence_pattern: {
      type: 'daily',
      interval: 1,
      days: [],
    },
    action_config: {
      pause_game: true,
      show_message: '',
      redirect_url: '',
    },
    is_active: true,
  });

  const scheduleTypes = [
    { value: 'maintenance', label: 'Maintenance', color: 'bg-orange-500' },
    { value: 'event', label: 'Special Event', color: 'bg-purple-500' },
    { value: 'promotion', label: 'Promotion', color: 'bg-green-500' },
    { value: 'auto_restart', label: 'Auto Restart', color: 'bg-blue-500' },
  ];

  const handleSubmit = () => {
    if (editingSchedule) {
      updateSchedule({
        id: editingSchedule.id,
        updates: {
          ...formData,
          game_type: gameType,
        },
      });
    } else {
      createSchedule({
        ...formData,
        game_type: gameType,
      });
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      schedule_type: 'maintenance',
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      is_recurring: false,
      recurrence_pattern: {
        type: 'daily',
        interval: 1,
        days: [],
      },
      action_config: {
        pause_game: true,
        show_message: '',
        redirect_url: '',
      },
      is_active: true,
    });
    setEditingSchedule(null);
  };

  const handleEdit = (schedule: any) => {
    setEditingSchedule(schedule);
    setFormData({
      schedule_type: schedule.schedule_type,
      title: schedule.title,
      description: schedule.description || '',
      start_time: schedule.start_time,
      end_time: schedule.end_time || '',
      is_recurring: schedule.is_recurring,
      recurrence_pattern: schedule.recurrence_pattern || {
        type: 'daily',
        interval: 1,
        days: [],
      },
      action_config: schedule.action_config || {
        pause_game: true,
        show_message: '',
        redirect_url: '',
      },
      is_active: schedule.is_active,
    });
    setIsDialogOpen(true);
  };

  const getScheduleTypeColor = (type: string) => {
    return scheduleTypes.find(t => t.value === type)?.color || 'bg-gray-500';
  };

  const getScheduleStatus = (schedule: any) => {
    const now = new Date();
    const start = new Date(schedule.start_time);
    const end = schedule.end_time ? new Date(schedule.end_time) : null;

    if (!schedule.is_active) return 'inactive';
    if (now < start) return 'upcoming';
    if (end && now > end) return 'completed';
    return 'active';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white">Active</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-500 text-white">Upcoming</Badge>;
      case 'completed':
        return <Badge className="bg-gray-500 text-white">Completed</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Schedule Management for {gameName}</h3>
          <p className="text-sm text-muted-foreground">
            Set up maintenance windows, events, and automated actions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              New Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
              </DialogTitle>
              <DialogDescription>
                Configure scheduled actions for {gameName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Schedule Type</Label>
                  <Select
                    value={formData.schedule_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, schedule_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {scheduleTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${type.color}`} />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <span className="text-sm">
                      {formData.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Weekly Maintenance"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe the purpose of this schedule..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) =>
                      setFormData({ ...formData, start_time: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time (Optional)</Label>
                  <Input
                    id="end-time"
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) =>
                      setFormData({ ...formData, end_time: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_recurring: checked })
                    }
                  />
                  <Label>Recurring Schedule</Label>
                </div>
                {formData.is_recurring && (
                  <div className="pl-8 space-y-2">
                    <Select
                      value={formData.recurrence_pattern.type}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          recurrence_pattern: {
                            ...formData.recurrence_pattern,
                            type: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Action Configuration</Label>
                <div className="space-y-2 pl-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.action_config.pause_game}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          action_config: {
                            ...formData.action_config,
                            pause_game: checked,
                          },
                        })
                      }
                    />
                    <Label className="text-sm">Pause Game</Label>
                  </div>
                  <Input
                    placeholder="Message to show users..."
                    value={formData.action_config.show_message}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        action_config: {
                          ...formData.action_config,
                          show_message: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isCreating}>
                  {editingSchedule ? 'Update' : 'Create'} Schedule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {schedules?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No schedules configured for this game</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Schedule
              </Button>
            </CardContent>
          </Card>
        ) : (
          schedules?.map((schedule) => {
            const status = getScheduleStatus(schedule);
            return (
              <Card key={schedule.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${getScheduleTypeColor(
                            schedule.schedule_type
                          )}`}
                        />
                        <h4 className="font-semibold">{schedule.title}</h4>
                        {getStatusBadge(status)}
                        {schedule.is_recurring && (
                          <Badge variant="outline">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Recurring
                          </Badge>
                        )}
                      </div>
                      {schedule.description && (
                        <p className="text-sm text-muted-foreground">
                          {schedule.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(schedule.start_time), 'MMM dd, yyyy')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(schedule.start_time), 'HH:mm')}
                          {schedule.end_time &&
                            ` - ${format(new Date(schedule.end_time), 'HH:mm')}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(schedule)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteSchedule(schedule.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};