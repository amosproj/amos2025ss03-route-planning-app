import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ExcludedAppointmentsState {
  [date: string]: number[];
}

const initialState: ExcludedAppointmentsState = {};

const excludedAppointmentsSlice = createSlice({
  name: 'excludedAppointments',
  initialState,
  reducers: {
    toggleExcludedAppointment(
      state,
      action: PayloadAction<{ date: string; idx: number }>
    ) {
      const { date, idx } = action.payload;
      const list = state[date] ?? [];
      if (list.includes(idx)) {
        state[date] = list.filter((i) => i !== idx);
      } else {
        state[date] = [...list, idx];
      }
    },
    clearExcludedAppointments(state, action: PayloadAction<string>) {
      delete state[action.payload];
    },
    setExcludedAppointments(
      state,
      action: PayloadAction<{ date: string; idxList: number[] }>
    ) {
      const { date, idxList } = action.payload;
      state[date] = idxList;
    },
  },
});

export const {
  toggleExcludedAppointment,
  clearExcludedAppointments,
  setExcludedAppointments,
} = excludedAppointmentsSlice.actions;
export default excludedAppointmentsSlice.reducer;
