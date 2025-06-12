import React, { useState, useEffect } from 'react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface Address {
  street: string;
  zip_code: string;
  city: string;
}

interface DepotDialogProps {
  open: boolean;
  vehicleIndex: number | null;
  initialDepot: { start: Address; finish: Address } | null;
  onSave: (depot: { start: Address; finish: Address }) => void;
  onRemove: () => void;
  onClose: () => void;
}

const parseAddress = (place: google.maps.places.PlaceResult): Address => {
  let streetNum = '', route = '', zip = '', city = '';
  place.address_components?.forEach((comp) => {
    if (comp.types.includes('street_number')) streetNum = comp.long_name;
    if (comp.types.includes('route')) route = comp.long_name;
    if (comp.types.includes('postal_code')) zip = comp.long_name;
    if (comp.types.includes('locality') || comp.types.includes('postal_town')) city = comp.long_name;
  });
  return { street: `${streetNum} ${route}`.trim(), zip_code: zip, city };
};

export const DepotDialog: React.FC<DepotDialogProps> = ({
  open,
  vehicleIndex,
  initialDepot,
  onSave,
  onRemove,
  onClose,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });
  const [auto, setAuto] = useState<google.maps.places.Autocomplete | null>(null);
  const [addressText, setAddressText] = useState(
    initialDepot ? initialDepot.start.street ? `${initialDepot.start.street}, ${initialDepot.start.zip_code} ${initialDepot.start.city}` : '' : ''
  );
  const [addrObj, setAddrObj] = useState<Address>(initialDepot ? initialDepot.start : { street: '', zip_code: '', city: '' });
  const [useCompanyStart, setUseCompanyStart] = useState(false);
  const [useCompanyFinish, setUseCompanyFinish] = useState(false);

  // when initialDepot changes (e.g. on reload or reopen), prefill dialog fields
  useEffect(() => {
    if (initialDepot) {
      const { start } = initialDepot;
      const text = `${start.street}${start.street ? ', ' : ''}${start.zip_code} ${start.city}`.trim();
      setAddressText(text);
      setAddrObj(start);
    } else {
      setAddressText('');
      setAddrObj({ street: '', zip_code: '', city: '' });
    }
    setUseCompanyStart(false);
    setUseCompanyFinish(false);
  }, [initialDepot]);

  if (loadError) return <div>Error loading Google Maps</div>;
  if (!isLoaded) return <div>Loading address autocomplete...</div>;

  const handlePlaceChanged = () => {
    if (auto) {
      const place = auto.getPlace();
      const addr = parseAddress(place);
      setAddrObj(addr);
      setAddressText(place.formatted_address || `${addr.street}, ${addr.zip_code} ${addr.city}`);
    }
  };

  const handleSave = () => {
    const start = useCompanyStart && initialDepot ? initialDepot.start : addrObj;
    const finish = useCompanyFinish && initialDepot ? initialDepot.finish : addrObj;
    onSave({ start, finish });
  };

  return (
    <Dialog open={open} modal onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configure Depot Address</DialogTitle>
          <DialogDescription>
            Set the depot address for Vehicle {vehicleIndex !== null ? vehicleIndex + 1 : ''}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <label className="text-sm font-medium">Depot Address</label>
            <Autocomplete onLoad={setAuto} onPlaceChanged={handlePlaceChanged}>
              <Input
                placeholder="Enter depot address"
                value={addressText}
                onChange={(e) => setAddressText(e.target.value)}
              />
            </Autocomplete>
          </div>

          <div className="flex flex-row gap-4 justify-between">
            <div className="flex items-center">
              <Switch checked={useCompanyStart} onCheckedChange={setUseCompanyStart} className="mr-2" />
              <label className="text-sm font-medium">company start</label>
            </div>
            <div className="flex items-center">
              <Switch checked={useCompanyFinish} onCheckedChange={setUseCompanyFinish} className="mr-2" />
              <label className="text-sm font-medium">company finish</label>
            </div>
          </div>

          <div className="flex justify-between gap-2">
            <div>
              {initialDepot && (
                <Button variant="destructive" size="sm" onClick={onRemove}>
                  Remove Depot
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!addrObj.street}>
                Save Depot
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
