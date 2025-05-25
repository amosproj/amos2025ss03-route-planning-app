import { Checkbox } from '@/components/ui/checkbox';
import { EnhancedAddressResponse } from '@/types/EnhancedAddressResponse';
import { Appointment } from '@/types/Appointment';


interface Props {
  jobs: Appointment[];
  locations: EnhancedAddressResponse[];
  excluded: number[];
  selectedIdx: number | null;
  onSelect: (idx: number) => void;
  onToggleExclude: (idx: number) => void;
}

export default function AppointmentList({
  jobs,
  locations,
  excluded,
  selectedIdx,
  onSelect,
  onToggleExclude,
}: Props) {
  return (
    <div
      className=" flex flex-col flex-1 min-h-0 bg-white border-r w-80 p-4"
    >

        <ul role="list" className="space-y-2 pr-1 flex-1">
          {jobs
            .map((job, idx) => ({ job, idx }))
            .sort(
              (a, b) =>
                Number(a.job.appointment_start) -
                Number(b.job.appointment_start),
            )
            .map(({ job, idx }) => {
              const loc = locations[idx];
              const hasError = loc?.could_be_fully_found === false;
              const isExcluded = excluded.includes(idx);
              return (
                <li
                  key={idx}
                  role="listitem"
                  aria-selected={!isExcluded && selectedIdx === idx}
                  aria-invalid={hasError}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSelect(idx);
                  }}
                  className={
                    `p-2 rounded flex justify-between items-center ` +
                    (isExcluded
                      ? 'opacity-50 line-through cursor-default '
                      : 'cursor-pointer ') +
                    (!isExcluded && selectedIdx === idx ? 'bg-blue-100 ' : '') +
                    (hasError
                      ? 'border border-red-500 text-red-600'
                      : 'hover:bg-gray-200 border border-blue-400')
                  }
                >
                  <div
                    onClick={() => {
                      if (!isExcluded && !hasError) onSelect(idx);
                    }}
                  >
                    <div className="text-sm font-medium text-left">
                      {new Date(job.appointment_start).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' - '}
                      {new Date(job.appointment_end).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="text-xs text-gray-700">
                      {job.address.street}, {job.address.zip_code}{' '}
                      {job.address.city}
                    </div>
                  </div>
                  <Checkbox
                    checked={!isExcluded && !hasError}
                    onClick={() => onToggleExclude(idx)}
                    className="mr-2"
                    aria-label={
                      isExcluded ? 'Include appointment' : 'Exclude appointment'
                    }
                  />
                  {hasError && <span className="text-red-500">⚠️</span>}
                </li>
              );
            })}
        </ul>
    </div>
  );
}
