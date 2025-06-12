import React, { useState } from 'react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { TabsContent } from '@/components/ui/tabs';

export interface Address {
  street: string;
  zip_code: string;
  city: string;
}

interface AddressSectionProps {
  initialStartValue: string;
  initialFinishValue: string;
  onChangeStart: (addr: Address, value: string) => void;
  onChangeFinish: (addr: Address, value: string) => void;
}

const parseAddress = (place: google.maps.places.PlaceResult): Address => {
  let streetNum = '', route = '', zip = '', city = '';
  place.address_components?.forEach((comp) => {
    if (comp.types.includes('street_number')) streetNum = comp.long_name;
    if (comp.types.includes('route')) route = comp.long_name;
    if (comp.types.includes('postal_code')) zip = comp.long_name;
    if (comp.types.includes('locality') || comp.types.includes('postal_town'))
      city = comp.long_name;
  });
  return { street: `${streetNum} ${route}`.trim(), zip_code: zip, city };
};

export const AddressSection: React.FC<AddressSectionProps> = ({
  initialStartValue,
  initialFinishValue,
  onChangeStart,
  onChangeFinish,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });
  const [startAuto, setStartAuto] = useState<google.maps.places.Autocomplete | null>(null);
  const [finishAuto, setFinishAuto] = useState<google.maps.places.Autocomplete | null>(null);

  if (loadError) return <div>Error loading Google Maps</div>;
  if (!isLoaded) return <div>Loading address autocomplete...</div>;

  return (
    <TabsContent value="addresses" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Addresses</CardTitle>
          <CardDescription>
            Configure the start and finish addresses for your company operations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField
            name="startAddress"
            render={({}) => (
              <FormItem>
                <FormLabel>Start Address</FormLabel>
                <FormControl>
                  <Autocomplete
                    onLoad={setStartAuto}
                    onPlaceChanged={() => {
                      if (startAuto) {
                        const place = startAuto.getPlace();
                        const addr = parseAddress(place);
                        const display = place.formatted_address || `${addr.street}, ${addr.zip_code} ${addr.city}`;
                        onChangeStart(addr, display);
                      }
                    }}
                  >
                    <Input
                      value={initialStartValue}
                      placeholder="Enter start address"
                      onChange={(e) => onChangeStart({ street: '', zip_code: '', city: '' }, e.target.value)}
                    />
                  </Autocomplete>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="finishAddress"
            render={({}) => (
              <FormItem>
                <FormLabel>Finish Address</FormLabel>
                <FormControl>
                  <Autocomplete
                    onLoad={setFinishAuto}
                    onPlaceChanged={() => {
                      if (finishAuto) {
                        const place = finishAuto.getPlace();
                        const addr = parseAddress(place);
                        const display = place.formatted_address || `${addr.street}, ${addr.zip_code} ${addr.city}`;
                        onChangeFinish(addr, display);
                      }
                    }}
                  >
                    <Input
                      value={initialFinishValue}
                      placeholder="Enter finish address"
                      onChange={(e) => onChangeFinish({ street: '', zip_code: '', city: '' }, e.target.value)}
                    />
                  </Autocomplete>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </TabsContent>
  );
};
