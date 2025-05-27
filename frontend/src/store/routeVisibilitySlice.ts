import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface RouteVisibilityState {
  byDate: Record<string, Record<number, boolean>>;
}

const initialState: RouteVisibilityState = { byDate: {} };

const routeVisibilitySlice = createSlice({
  name: 'routeVisibility',
  initialState,
  reducers: {
    setRouteVisibility(
      state,
      action: PayloadAction<{ date: string; routeId: number; isVisible: boolean }>,
    ) {
      const { date, routeId, isVisible } = action.payload;
      if (!state.byDate[date]) state.byDate[date] = {};
      state.byDate[date][routeId] = isVisible;
    },
  },
});

export const { setRouteVisibility } = routeVisibilitySlice.actions;
export default routeVisibilitySlice.reducer;
