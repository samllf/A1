import { configureStore } from '@reduxjs/toolkit';
import appReducer from './appSlice';
import projectsReducer from './projectsSlice';
import revenueReducer from './revenueSlice';
import { useDispatch, useSelector } from 'react-redux';

export const store = configureStore({
  reducer: {
    app: appReducer,
    projects: projectsReducer,
    revenue: revenueReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
