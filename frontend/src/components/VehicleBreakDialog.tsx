import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VehicleBreak } from '@/types/Vehicle';

interface VehicleBreakDialogProps {
  open: boolean;
  vehicleIndex: number | null;
  initialBreak?: VehicleBreak | null;
  onSave: (breakInfo: VehicleBreak) => void;
  onClose: () => void;
}

const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (mins: number): string => {
  const hours = Math.floor(mins / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (mins % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const VehicleBreakDialog: React.FC<VehicleBreakDialogProps> = ({
  open,
  vehicleIndex,
  initialBreak,
  onSave,
  onClose,
}) => {
  const [start, setStart] = useState('12:00');
  const [end, setEnd] = useState('13:00');
  const [duration, setDuration] = useState('30');

  useEffect(() => {
    if (initialBreak) {
      setStart(minutesToTime(initialBreak.start_min));
      setEnd(minutesToTime(initialBreak.start_max));
      setDuration(initialBreak.duration.toString());
    } else {
      setStart('12:00');
      setEnd('14:00');
      setDuration('30');
    }
  }, [initialBreak]);

  const durationNum = parseInt(duration, 10);
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);

  const valid =
    !isNaN(durationNum) &&
    durationNum > 0 &&
    startMin >= 0 &&
    endMin > startMin;

  const handleSave = () => {
    if (!valid) return;
    onSave({
      duration: durationNum,
      start_min: startMin,
      start_max: endMin,
    });
  };

  return (
    <Dialog open={open} modal onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Configure Break Time</DialogTitle>
          <DialogDescription>
            Set preferred break window and total duration for Vehicle{' '}
            {vehicleIndex !== null ? vehicleIndex + 1 : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-1">
            <Label>Earliest Break Start</Label>
            <Input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <Label>Latest Break Start</Label>
            <Input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <Label>Break Duration (minutes)</Label>
            <Input
              type="number"
              min="1"
              step="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" disabled={!valid} onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleBreakDialog;
