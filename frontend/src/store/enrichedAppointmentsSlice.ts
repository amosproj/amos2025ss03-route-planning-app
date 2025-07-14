import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { EnhancedAddressResponse } from '../types/EnhancedAddressResponse';

interface EnrichedAppointmentsState {
  [date: string]: EnhancedAddressResponse[];
}

const initialState: EnrichedAppointmentsState = {};

const enrichedAppointmentsSlice = createSlice({
  name: 'enrichedAppointments',
  initialState,
  reducers: {
    setEnrichedAppointments(
      state,
      action: PayloadAction<{ date: string; address_responses: EnhancedAddressResponse[] }>
    ) {
      state[action.payload.date] = action.payload.address_responses;
    },
    clearEnrichedAppointments(state, action: PayloadAction<string>) {
      delete state[action.payload];
    },
    resetEnrichedAppointments(state) {
      Object.keys(state).forEach(date => {
        delete state[date];
      });
    }
  },
});

export const { setEnrichedAppointments, clearEnrichedAppointments, resetEnrichedAppointments } = enrichedAppointmentsSlice.actions;
export default enrichedAppointmentsSlice.reducer;
