// filepath: frontend/src/store/companyInfoSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CompanyInfo } from '../types/CompanyInfo';

const defaultAddress = { street: '', zip_code: '', city: '' };
export const defaultCompanyInfo: CompanyInfo = {
  start_address: defaultAddress,
  finish_address: defaultAddress,
  vehicles: [{
    vehicle_id: 0,
    skills: [],
    worker_amount: 1,
    operation_hours: { start_minutes: 480, end_minutes: 960 },
    cost_per_km: 0.5,
    cost_per_hour: 45.0,
  }],
};

const initialState: CompanyInfo = defaultCompanyInfo;

const companyInfoSlice = createSlice({
  name: 'companyInfo',
  initialState,
  reducers: {
    setCompanyInfo: (_, action: PayloadAction<CompanyInfo>) => action.payload,
    resetCompanyInfo: () => defaultCompanyInfo,
  },
});

export const { setCompanyInfo, resetCompanyInfo } = companyInfoSlice.actions;
export default companyInfoSlice.reducer;
