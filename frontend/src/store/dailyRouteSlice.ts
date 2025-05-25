import { createSlice, PayloadAction } from "@reduxjs/toolkit"

type SolutionData = {
    total_distance_traveled: number
    max_distance_traveled: number
    routes: any[]
    method_used: string
}

interface DailyRouteState {
    [date: string]: {
        [solutionKey: string]: SolutionData
    }
}

const initialState: DailyRouteState = {}

type SaveRoutePayload = {
    date: string // e.g., "25-05-2025"
    solutionKey: string // e.g., "solution1"
    data: SolutionData
}

const dailyRouteSlice = createSlice({
    name: "dailyRoute",
    initialState,
    reducers: {
        setRouteData: (state, action: PayloadAction<SaveRoutePayload>) => {
            const { date, solutionKey, data } = action.payload

            if (!state[date]) {
                state[date] = {}
            }

            state[date][solutionKey] = data
        },
        resetDailyRoute: () => initialState,
    },
})

export const { setRouteData, resetDailyRoute } = dailyRouteSlice.actions

export default dailyRouteSlice.reducer
