import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SolutionValidationReport } from '@/types/Solution';
import { Ban, AlertTriangle, Info } from 'lucide-react';

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
          <div className="grid gap-y-4 py-4 max-h-[400px] overflow-y-auto">
            <h6 className="text-sm underline font-semibold">
              Appointment Errors:
            </h6>

            {/* Impossible Appointments */}
            {report.impossible_appointments?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-1">
                  <Ban className="w-4 h-4" />
                  <span>
                    Impossible Appointments{' '}
                    <sup className="text-xs align-super">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-3 h-3 inline cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            These appointments couldn’t be scheduled due to
                            conflicts or constraints.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </sup>
                  </span>
                </div>
                <ul className="list-disc list-outside pl-5 text-sm text-red-600">
                  {report.impossible_appointments.map((address, idx) => (
                    <li key={`impossible-${idx}`}>{address}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing Appointments (excluding impossible) */}
            {report.missing_appointments?.filter(
              (addr) => !report.impossible_appointments.includes(addr),
            ).length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-orange-700 font-semibold text-sm mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>
                    Missing Appointments{' '}
                    <sup className="text-xs align-super">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-3 h-3 inline cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Appointments that were not assigned to any route
                            after optimization.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </sup>
                  </span>
                </div>
                <ul className="list-disc list-outside pl-5 text-sm text-orange-600">
                  {report.missing_appointments
                    .filter(
                      (addr) => !report.impossible_appointments.includes(addr),
                    )
                    .map((address, idx) => (
                      <li key={`missing-${idx}`}>{address}</li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Route Errors*/}
        {report.route_level_errors.length > 0 && (
          <div className="grid gap-y-2 py-4 max-h-[400px] overflow-y-auto">
            <p className="text-sm underline font-semibold">Vehicle Errors:</p>
            {report.route_level_errors.map((routeError) => (
              <div key={routeError.route_id} className="mb-2">
                <h6 className="text-sm font-medium">
                  Vehicle: {routeError.route_id + 1}
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
