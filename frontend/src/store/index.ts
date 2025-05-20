// Setup Redux store with persistence
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import scenariosReducer from './scenariosSlice';
import companyInfoReducer from './companyInfoSlice';
import enrichedAppointmentsReducer from './enrichedAppointmentsSlice';
import excludedAppointmentsReducer from './excludedAppointmentsSlice';
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
  whitelist: ['scenarios', 'companyInfo', 'enrichedAppointments', 'excludedAppointments'],
};

const rootReducer = combineReducers({
  scenarios: scenariosReducer,
  companyInfo: companyInfoReducer,
  enrichedAppointments: enrichedAppointmentsReducer,
  excludedAppointments: excludedAppointmentsReducer,
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
