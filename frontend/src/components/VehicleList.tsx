import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';
import {
  toggleExcludedVehicle,
  setExcludedVehicles,
} from '@/store/excludedVehiclesSlice';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { getRouteColor } from '@/utils/routeColors';
import { Truck, Clock, Users, Warehouse, MapPin } from 'lucide-react';
import { minutesToTime } from '@/utils/helper';

const formatAddress = (address: {
  street: string;
  zip_code: string;
  city: string;
}): string => {
  const parts = [];
  if (address.street) parts.push(address.street);
  return parts.join(', ') || 'No address';
};

interface VehicleListProps {
  date: string;
}

export default function VehicleList({ date }: VehicleListProps) {
  const dispatch = useDispatch<AppDispatch>();

  // Get the current date
  const currentDate = date;

  // Get company info for the current date
  const companyInfo = useSelector(
    (s: RootState) => s.companyInfo[currentDate.split('"')[1]] ?? null,
  );

  // Get excluded vehicles for this date
  const excludedVehicles = useSelector(
    (s: RootState) => s.excludedVehicles[currentDate] ?? [],
  );

  if (!companyInfo || !companyInfo.vehicles.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-4">
        <Truck className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">
          No Fleet Configured
        </h3>
        <p className="text-sm text-gray-500">
          Configure your fleet in the Company Settings to see vehicles here.
        </p>
      </div>
    );
  }

  const vehicles = companyInfo.vehicles;
  const allCount = vehicles.length;
  const excludedCount = excludedVehicles.length;
  const isAllSelected = excludedCount === 0 && allCount > 0;
  const isIndeterminate = excludedCount > 0 && excludedCount < allCount;

  const handleToggleAll = (selectAll: boolean) => {
    const allVehicleIds = vehicles.map((v) => v.vehicle_id);
    dispatch(
      setExcludedVehicles({
        date: currentDate,
        vehicleIds: selectAll ? [] : allVehicleIds,
      }),
    );
  };

  const handleToggleVehicle = (vehicleId: number) => {
    dispatch(
      toggleExcludedVehicle({
        date: currentDate,
        vehicleId,
      }),
    );
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white w-80 p-4">
      {/* Header with title and Select All control */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Fleet</h2>
        <label className="flex items-center cursor-pointer">
          <Checkbox
            checked={isAllSelected}
            onClick={() => handleToggleAll(!isAllSelected)}
            aria-label="Select all vehicles"
            aria-checked={isIndeterminate ? 'mixed' : isAllSelected}
            className="mr-2"
          />
          <span className="text-sm">Select All</span>
        </label>
      </div>

      <div className="text-xs text-gray-500 mb-4">
        {allCount - excludedCount} of {allCount} vehicles selected for
        optimization
      </div>

      {/* Vehicle List */}
      <div className="space-y-3 flex-1 overflow-y-auto">
        {vehicles.map((vehicle, index) => {
          const isExcluded = excludedVehicles.includes(vehicle.vehicle_id);
          const vehicleColor = getRouteColor(vehicle.vehicle_id);
          const hasDepot = Boolean(vehicle.depot);

          return (
            <Card
              key={vehicle.vehicle_id}
              className={`p-4 border-l-4 transition-all duration-200 ${
                isExcluded
                  ? 'opacity-50 bg-gray-50 border-gray-300'
                  : 'hover:shadow-md cursor-pointer'
              }`}
              style={{
                borderLeftColor: isExcluded ? '#d1d5db' : vehicleColor,
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {/* Vehicle Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`font-medium text-sm ${
                          isExcluded ? 'text-gray-400' : 'text-gray-900'
                        }`}
                      >
                        Vehicle {index + 1}
                      </div>
                      <Checkbox
                        checked={!isExcluded}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleVehicle(vehicle.vehicle_id);
                        }}
                        className="flex-shrink-0"
                      />
                    </div>

                    {/* Workers */}
                    <div
                      className={`flex items-center space-x-1 mb-2 text-xs ${
                        isExcluded ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      <Users className="h-3 w-3" />
                      <span>
                        {vehicle.worker_amount} worker
                        {vehicle.worker_amount !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Operation Hours */}
                    <div
                      className={`flex items-center space-x-1 mb-2 text-xs ${
                        isExcluded ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      <span>
                        {minutesToTime(vehicle.operation_hours.start_minutes)} -{' '}
                        {minutesToTime(vehicle.operation_hours.end_minutes)}
                      </span>
                    </div>

                    {/* Skills */}
                    {vehicle.skills && (
                      <div className="mb-2">
                        <div className="flex flex-wrap gap-1">
                          {vehicle.skills
                            .split(',')
                            .map((skill, skillIndex) => (
                              <Badge
                                key={skillIndex}
                                variant="default"
                                className={`text-xs  ${
                                  isExcluded ? 'bg-gray-100 text-gray-400' : ''
                                }`}
                              >
                                {skill.trim()}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Additional Info Icons */}
                    <div className="flex items-center space-x-2 mt-2">
                      {hasDepot && (
                        <div
                          className={`flex items-center space-x-1 text-xs ${
                            isExcluded ? 'text-gray-400' : 'text-blue-600'
                          }`}
                        >
                          <Warehouse className="h-3 w-3" />
                          <span>Custom Depot</span>
                        </div>
                      )}
                    </div>

                    {/* Depot Address if available */}
                    {hasDepot && vehicle.depot && (
                      <div
                        className={`mt-2 text-xs ${
                          isExcluded ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        <div className="flex items-start space-x-1">
                          <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span className="break-words">
                            {formatAddress(vehicle.depot.start)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
