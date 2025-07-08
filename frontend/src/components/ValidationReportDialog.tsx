import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SolutionValidationReport } from '@/types/Solution';

interface ValidationReportDialogProps {
  open: boolean;
  report: SolutionValidationReport;
  onClose: () => void;
}

const ValidationReportDialog: React.FC<ValidationReportDialogProps> = ({
  open,
  report,
  onClose,
}) => {
  return (
    <Dialog open={open} modal onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Validation Report</DialogTitle>
          <DialogDescription>
            Below are the errors that were found after optimization:
          </DialogDescription>
        </DialogHeader>

        {/* Appointment Errors */}
        {report.errors.length > 0 && (
          <div className="grid gap-y-2 py-4 max-h-[400px] overflow-y-auto">
            <h6 className="text-sm underline font-semibold">
              Appointment Errors:
            </h6>

            <ul className="list-disc list-outside pl-5 text-sm text-red-600">
              {report.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        {/* Route Errors*/}
        {report.route_level_errors.length > 0 && (
          <div className="grid gap-y-2 py-4 max-h-[400px] overflow-y-auto">
            <p className="text-sm underline font-semibold">Vehicle Errors:</p>
            {report.route_level_errors.map((routeError) => (
              <div key={routeError.route_id} className="mb-2">
                <h6 className="text-sm font-medium">
                  Vehicle ID: {routeError.route_id}
                </h6>
                <ul className="list-disc list-inside text-sm text-red-600">
                  {routeError.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ValidationReportDialog;
