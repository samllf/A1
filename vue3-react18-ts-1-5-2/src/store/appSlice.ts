import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  darkMode: boolean;
  bigScreen: boolean;
  hasUnsavedChanges: boolean;
  syncNotice: string;
}

const initialState: AppState = {
  darkMode: localStorage.getItem('mealRevenue.theme') === 'dark',
  bigScreen: false,
  hasUnsavedChanges: false,
  syncNotice: ''
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.darkMode = !state.darkMode;
      localStorage.setItem('mealRevenue.theme', state.darkMode ? 'dark' : 'light');
    },
    setBigScreen(state, action: PayloadAction<boolean>) {
      state.bigScreen = action.payload;
    },
    setUnsavedChanges(state, action: PayloadAction<boolean>) {
      state.hasUnsavedChanges = action.payload;
    },
    setSyncNotice(state, action: PayloadAction<string>) {
      state.syncNotice = action.payload;
    }
  }
});

export const { setBigScreen, setSyncNotice, setUnsavedChanges, toggleTheme } = appSlice.actions;
export default appSlice.reducer;
