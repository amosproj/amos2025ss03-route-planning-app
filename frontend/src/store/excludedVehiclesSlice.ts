import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ExcludedVehiclesState {
  [date: string]: number[];
}

const initialState: ExcludedVehiclesState = {};

const excludedVehiclesSlice = createSlice({
  name: 'excludedVehicles',
  initialState,
  reducers: {
    toggleExcludedVehicle(
      state,
      action: PayloadAction<{ date: string; vehicleId: number }>
    ) {
      const { date, vehicleId } = action.payload;
      const list = state[date] ?? [];
      if (list.includes(vehicleId)) {
        state[date] = list.filter((id) => id !== vehicleId);
      } else {
        state[date] = [...list, vehicleId];
      }
    },
    clearExcludedVehicles(state, action: PayloadAction<string>) {
      delete state[action.payload];
    },
    setExcludedVehicles(
      state,
      action: PayloadAction<{ date: string; vehicleIds: number[] }>
    ) {
      const { date, vehicleIds } = action.payload;
      state[date] = vehicleIds;
    },
  },
});

export const {
  toggleExcludedVehicle,
  clearExcludedVehicles,
  setExcludedVehicles,
} = excludedVehiclesSlice.actions;
export default excludedVehiclesSlice.reducer;
