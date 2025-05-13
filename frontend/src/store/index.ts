// Setup Redux store with persistence
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import scenariosReducer from './scenariosSlice';
import workersReducer from './workersSlice';
import enrichedAppointmentsReducer from './enrichedAppointmentsSlice';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import {
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['scenarios', 'workers', 'enrichedAppointments'],
};

const rootReducer = combineReducers({
  scenarios: scenariosReducer,
  workers: workersReducer,
  enrichedAppointments: enrichedAppointmentsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
