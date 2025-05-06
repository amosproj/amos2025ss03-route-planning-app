// Create a slice to manage parsed CSV scenarios
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Scenario } from '../types/Scenario';

interface ScenariosState {
  scenarios: Scenario[];
}

const initialState: ScenariosState = {
  scenarios: [],
};

const scenariosSlice = createSlice({
  name: 'scenarios',
  initialState,
  reducers: {
    setScenarios(state, action: PayloadAction<Scenario[]>) {
      state.scenarios = action.payload;
    },
  },
});

export const { setScenarios } = scenariosSlice.actions;
export default scenariosSlice.reducer;