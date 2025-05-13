import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Worker } from '../types/Scenario';

interface WorkersState {
    workers: Worker | null;
}

const initialState: WorkersState = {
    workers: null,
};

const workersSlice = createSlice({
    name: 'workers',
    initialState,
    reducers: {
        setWorkers(state, action: PayloadAction<Worker>) {
            state.workers = action.payload;
        }
    },
});

export const { setWorkers } = workersSlice.actions;
export default workersSlice.reducer;