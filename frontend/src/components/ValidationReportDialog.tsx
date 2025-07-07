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
            Below are the errors that were found during optimization:
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 max-h-[300px] overflow-y-auto">
          {report.errors.length > 0 ? (
            <ul className="list-disc list-inside text-sm text-red-600">
              {report.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No errors found.</p>
          )}
        </div>

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
