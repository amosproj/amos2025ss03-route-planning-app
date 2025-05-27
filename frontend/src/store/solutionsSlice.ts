import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Solution } from '@/types/Solution';

interface SolutionsState {
  byDate: Record<string, Solution>;
}

const initialState: SolutionsState = { byDate: {} };

const solutionsSlice = createSlice({
  name: 'solutions',
  initialState,
  reducers: {
    addSolution(state, action: PayloadAction<{ date: string; solution: Solution }>) {
      const { date, solution } = action.payload;
      state.byDate[date] = solution;
    },
    clearSolutions(state) {
      state.byDate = {};
    },
  },
});

export const { addSolution, clearSolutions } = solutionsSlice.actions;
export default solutionsSlice.reducer;
