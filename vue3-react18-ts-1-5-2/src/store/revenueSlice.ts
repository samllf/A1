import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../api/mockApi';
import type { BatchRevenueInput, ImportMode, RevenueQuery, RevenueRecord } from '../types';
import { todayISO } from '../utils/date';

interface RevenueState {
  records: RevenueRecord[];
  todayRecords: RevenueRecord[];
  range: {
    start: string;
    end: string;
  };
  loading: boolean;
  saving: boolean;
  error: string;
}

const today = todayISO();

const initialState: RevenueState = {
  records: [],
  todayRecords: [],
  range: {
    start: today,
    end: today
  },
  loading: false,
  saving: false,
  error: ''
};

export const fetchRevenue = createAsyncThunk<RevenueRecord[], RevenueQuery, { rejectValue: string }>(
  'revenue/fetch',
  async (query, { signal, rejectWithValue }) => {
    try {
      return await api.getRevenue(query, signal);
    } catch (error) {
      if ((error as Error).name === 'AbortError') throw error;
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchTodayRevenue = createAsyncThunk<RevenueRecord[], string, { rejectValue: string }>(
  'revenue/fetchToday',
  async (projectId, { signal, rejectWithValue }) => {
    try {
      return await api.getTodayRevenue(projectId, signal);
    } catch (error) {
      if ((error as Error).name === 'AbortError') throw error;
      return rejectWithValue((error as Error).message);
    }
  }
);

export const saveBatchRevenue = createAsyncThunk<
  RevenueRecord[],
  { projectId: string; date: string; rows: BatchRevenueInput[] },
  { rejectValue: string }
>('revenue/saveBatch', async ({ projectId, date, rows }, { signal, rejectWithValue }) => {
  try {
    return await api.saveBatch(projectId, date, rows, signal);
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    return rejectWithValue((error as Error).message);
  }
});

export const importRevenue = createAsyncThunk<
  RevenueRecord[],
  { projectId: string; records: RevenueRecord[]; mode: ImportMode },
  { rejectValue: string }
>('revenue/import', async ({ projectId, records, mode }, { signal, rejectWithValue }) => {
  try {
    return await api.importRevenue(projectId, records, mode, signal);
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    return rejectWithValue((error as Error).message);
  }
});

const revenueSlice = createSlice({
  name: 'revenue',
  initialState,
  reducers: {
    setRevenueRange(state, action: PayloadAction<{ start: string; end: string }>) {
      state.range = action.payload;
    },
    clearRevenueError(state) {
      state.error = '';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRevenue.pending, (state, action) => {
        state.loading = true;
        state.error = '';
        state.range = { start: action.meta.arg.start, end: action.meta.arg.end };
      })
      .addCase(fetchRevenue.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchRevenue.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'AbortError') {
          state.error = action.payload ?? action.error.message ?? '营收数据加载失败';
        }
      })
      .addCase(fetchTodayRevenue.pending, (state) => {
        state.error = '';
      })
      .addCase(fetchTodayRevenue.fulfilled, (state, action) => {
        state.todayRecords = action.payload;
      })
      .addCase(fetchTodayRevenue.rejected, (state, action) => {
        if (action.error.name !== 'AbortError') {
          state.error = action.payload ?? action.error.message ?? '实时看板刷新失败';
        }
      })
      .addCase(saveBatchRevenue.pending, (state) => {
        state.saving = true;
        state.error = '';
      })
      .addCase(saveBatchRevenue.fulfilled, (state, action) => {
        state.saving = false;
        state.records = [...action.payload, ...state.records];
        const today = todayISO();
        state.todayRecords = [...action.payload.filter((record) => record.date === today), ...state.todayRecords];
      })
      .addCase(saveBatchRevenue.rejected, (state, action) => {
        state.saving = false;
        if (action.error.name !== 'AbortError') {
          state.error = action.payload ?? action.error.message ?? '批量录入失败';
        }
      })
      .addCase(importRevenue.pending, (state) => {
        state.saving = true;
        state.error = '';
      })
      .addCase(importRevenue.fulfilled, (state, action) => {
        state.saving = false;
        state.records = [...action.payload, ...state.records];
      })
      .addCase(importRevenue.rejected, (state, action) => {
        state.saving = false;
        if (action.error.name !== 'AbortError') {
          state.error = action.payload ?? action.error.message ?? '导入失败';
        }
      });
  }
});

export const { clearRevenueError, setRevenueRange } = revenueSlice.actions;
export default revenueSlice.reducer;
