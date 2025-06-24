'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store';
import { formSchema, FormSchemaType } from '@/schemas/formSchema';
import { Address } from '@/types/Address';
import { CompanyInfo } from '@/types/CompanyInfo';
import { setCompanyInfo } from '@/store/companyInfoSlice';
import { Button } from '@/components/ui/button';
import {
  Form,
} from '@/components/ui/form';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from './ui/sonner';
import { toast } from 'sonner';
import {AddressSection} from './AddressSection';
import {VehiclesSection} from './VehiclesSection';
import {DepotDialog} from './DepotDialog';
import VehicleCostDialog from './VehicleCostDialog';

import { MapPin, Truck } from 'lucide-react';

// default address for fallbacks
const defaultAddr: Address = { street: '', zip_code: '', city: '' };


export function CompanyConfigForm() {
  const dispatch = useDispatch<AppDispatch>();

  // Get default company info for all scenarios
  const scenarios = useSelector((s: RootState) => s.scenarios.scenarios);
  const firstScenarioDate =
    scenarios.length > 0 ? scenarios[0].date.toString() : null;
  const existingCompany = useSelector((state: RootState) =>
    firstScenarioDate ? state.companyInfo[firstScenarioDate] : null,
  );

  const [startAddrObj, setStartAddrObj] = useState<Address>(defaultAddr);
  const [finishAddrObj, setFinishAddrObj] = useState<Address>(defaultAddr);

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'vehicles',
  });

  // Depot dialog state and handlers
  const [depotOpen, setDepotOpen] = useState(false);
  const [currentDepotIdx, setCurrentDepotIdx] = useState<number | null>(null);
  const initialDepot = currentDepotIdx !== null ? (form.getValues(`vehicles.${currentDepotIdx}.depot`) || null) : null;
  const openDepotDialog = (idx: number) => { setCurrentDepotIdx(idx); setDepotOpen(true); };
  const closeDepotDialog = () => { setDepotOpen(false); setCurrentDepotIdx(null); };
  const handleSaveDepot = (depot: { start: Address; finish: Address }) => {
    if (currentDepotIdx !== null) {
      form.setValue(`vehicles.${currentDepotIdx}.depot`, depot);
    }
    closeDepotDialog();
  };
  const handleRemoveDepot = () => {
    if (currentDepotIdx !== null) {
      form.setValue(`vehicles.${currentDepotIdx}.depot`, undefined);
    }
    closeDepotDialog();
  };

  // Cost dialog state and handlers
  const [costOpen, setCostOpen] = useState(false);
  const [currentCostIdx, setCurrentCostIdx] = useState<number | null>(null);
  const initialCost = currentCostIdx !== null ? {
    cost_per_km: form.getValues(`vehicles.${currentCostIdx}.cost_per_km`),
    cost_per_hour: form.getValues(`vehicles.${currentCostIdx}.cost_per_hour`),
  } : null;
  const openCostDialog = (idx: number) => { setCurrentCostIdx(idx); setCostOpen(true); };
  const closeCostDialog = () => { setCostOpen(false); setCurrentCostIdx(null); };
  const handleSaveCost = (costs: { cost_per_km: number; cost_per_hour: number }) => {
    if (currentCostIdx !== null) {
      form.setValue(`vehicles.${currentCostIdx}.cost_per_km`, costs.cost_per_km);
      form.setValue(`vehicles.${currentCostIdx}.cost_per_hour`, costs.cost_per_hour);
    }
    closeCostDialog();
  };

  useEffect(() => {
    if (existingCompany) {
      const hasStart =
        existingCompany.start_address.street ||
        existingCompany.start_address.zip_code ||
        existingCompany.start_address.city;
      const hasFinish =
        existingCompany.finish_address.street ||
        existingCompany.finish_address.zip_code ||
        existingCompany.finish_address.city;

      const displayStart = hasStart
        ? `${existingCompany.start_address.street}${existingCompany.start_address.street && ','} ${existingCompany.start_address.zip_code} ${existingCompany.start_address.city}`.trim()
        : '';
      const displayFinish = hasFinish
        ? `${existingCompany.finish_address.street}${existingCompany.finish_address.street && ','} ${existingCompany.finish_address.zip_code} ${existingCompany.finish_address.city}`.trim()
        : '';

      form.reset({
        startAddress: displayStart,
        finishAddress: displayFinish,
        vehicles:
          existingCompany.vehicles.length > 0
            ? existingCompany.vehicles.map((vehicle) => ({
                ...vehicle,
                operation_hours: vehicle.operation_hours || {
                  start_minutes: 480,
                  end_minutes: 960,
                },
                cost_per_km: vehicle.cost_per_km ?? 0.5,
                cost_per_hour: vehicle.cost_per_hour ?? 45.0,
              }))
            : [
                {
                  vehicle_id: 0,
                  skills: null,
                  worker_amount: 1,
                  operation_hours: { start_minutes: 480, end_minutes: 960 },
                  cost_per_km: 0.5,
                  cost_per_hour: 45.0,
                },
              ],
      });

      setStartAddrObj(existingCompany.start_address);
      setFinishAddrObj(existingCompany.finish_address);
    }
  }, [existingCompany, form]);



  const onSubmit = (values: FormSchemaType) => {
    console.log('Form submitted with values:', values);
    const companyInfo: CompanyInfo = {
      start_address: startAddrObj,
      finish_address: finishAddrObj,
      vehicles: values.vehicles,
    };

    // Apply to all scenarios
    scenarios.forEach((scenario) => {
      dispatch(
        setCompanyInfo({
          date: scenario.date.toString(),
          companyInfo,
        }),
      );
    });

    toast('Company configuration saved successfully!');
  };

  const addVehicle = () => {
    const newId =
      fields.length > 0 ? Math.max(...fields.map((f) => f.vehicle_id)) + 1 : 0;
    append({
      vehicle_id: newId,
      skills: null,
      worker_amount: 1,
      operation_hours: { start_minutes: 480, end_minutes: 960 }, // 8:00 AM to 4:00 PM
      cost_per_km: 0.5,
      cost_per_hour: 45.0,
    });
  };


  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          console.error('Form validation errors:', errors);
        })}
        noValidate
        className="space-y-8"
      >
        <Toaster />
        <Tabs defaultValue="addresses" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="addresses"><span className="flex items-center gap-2"><MapPin className="h-4 w-4" />Addresses</span></TabsTrigger>
            <TabsTrigger value="vehicles"><span className="flex items-center gap-2"><Truck className="h-4 w-4" />Vehicles</span></TabsTrigger>
          </TabsList>
          <AddressSection
            initialStartValue={form.watch('startAddress')}
            initialFinishValue={form.watch('finishAddress')}
            onChangeStart={(addr, value) => {
              setStartAddrObj(addr);
              form.setValue('startAddress', value);
            }}
            onChangeFinish={(addr, value) => {
              setFinishAddrObj(addr);
              form.setValue('finishAddress', value);
            }}
          />
          <VehiclesSection
            fields={fields}
            control={form.control}
            append={addVehicle}
            remove={remove}
            onEditDepot={openDepotDialog}
            onEditCost={openCostDialog}
          />
        </Tabs>

        <div className="flex justify-end space-x-4">
          <Button type="submit" size="lg">
            Save Company Configuration
          </Button>
        </div>

        {/* Depot dialog */}
        <DepotDialog
          open={depotOpen}
          vehicleIndex={currentDepotIdx}
          initialDepot={initialDepot}
          onSave={handleSaveDepot}
          onRemove={handleRemoveDepot}
          onClose={closeDepotDialog}
        />
        <VehicleCostDialog
          open={costOpen}
          vehicleIndex={currentCostIdx}
          initialCosts={initialCost}
          onSave={handleSaveCost}
          onClose={closeCostDialog}
        />
      </form>
    </Form>
  );
}
