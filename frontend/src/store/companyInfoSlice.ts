// filepath: frontend/src/store/companyInfoSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CompanyInfo } from '../types/CompanyInfo';

interface CompanyInfoState {
  [date: string]: CompanyInfo;
}

const defaultAddress = { street: '', zip_code: '', city: '' };
const defaultCompanyInfo: CompanyInfo = {
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

const initialState: CompanyInfoState = {};

const companyInfoSlice = createSlice({
  name: 'companyInfo',
  initialState,
  reducers: {
    setCompanyInfo(state, action: PayloadAction<{ date: string; companyInfo: CompanyInfo }>) {
      state[action.payload.date] = action.payload.companyInfo;
    },
    resetCompanyInfo(state, action: PayloadAction<string>) {
      state[action.payload] = defaultCompanyInfo;
    },
  },
});

export const { setCompanyInfo, resetCompanyInfo } = companyInfoSlice.actions;
export default companyInfoSlice.reducer;
