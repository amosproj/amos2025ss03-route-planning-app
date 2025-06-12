import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface VehicleCostDialogProps {
  open: boolean;
  vehicleIndex: number | null;
  initialCosts: { cost_per_km?: number; cost_per_hour?: number } | null;
  onSave: (costs: { cost_per_km: number; cost_per_hour: number }) => void;
  onClose: () => void;
}

const VehicleCostDialog: React.FC<VehicleCostDialogProps> = ({
  open,
  vehicleIndex,
  initialCosts,
  onSave,
  onClose,
}) => {
  const [costKm, setCostKm] = useState<string>('');
  const [costHr, setCostHr] = useState<string>('');

  useEffect(() => {
    if (initialCosts) {
      setCostKm(initialCosts.cost_per_km?.toString() ?? '');
      setCostHr(initialCosts.cost_per_hour?.toString() ?? '');
    } else {
      setCostKm('');
      setCostHr('');
    }
  }, [initialCosts]);

  const km = parseFloat(costKm);
  const hr = parseFloat(costHr);
  const valid = !isNaN(km) && !isNaN(hr) && km >= 0 && hr >= 0;

  return (
    <Dialog open={open} modal onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Configure Vehicle Cost</DialogTitle>
          <DialogDescription>
            Set cost parameters for Vehicle {vehicleIndex !== null ? vehicleIndex + 1 : ''}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <label className="text-sm font-medium">Cost per km</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={costKm}
              onChange={(e) => setCostKm(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Cost per hour</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={costHr}
              onChange={(e) => setCostHr(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => onSave({ cost_per_km: km, cost_per_hour: hr })} disabled={!valid}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleCostDialog;
