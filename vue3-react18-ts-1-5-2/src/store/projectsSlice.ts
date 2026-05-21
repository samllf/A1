import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../api/mockApi';
import type { PaginatedResult, Project, ProjectInput } from '../types';

interface ProjectState {
  items: Project[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  selectedProjectId: string;
  loading: boolean;
  saving: boolean;
  error: string;
  optimisticBackups: Record<string, Project>;
}

const initialState: ProjectState = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 5,
  search: '',
  selectedProjectId: '',
  loading: false,
  saving: false,
  error: '',
  optimisticBackups: {}
};

export const fetchProjects = createAsyncThunk<
  PaginatedResult<Project>,
  void,
  { state: { projects: ProjectState }; rejectValue: string }
>('projects/fetch', async (_, { getState, signal, rejectWithValue }) => {
  try {
    const { search, page, pageSize } = getState().projects;
    return await api.getProjects({ search, page, pageSize }, signal);
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    return rejectWithValue((error as Error).message);
  }
});

export const createProject = createAsyncThunk<Project, ProjectInput, { rejectValue: string }>(
  'projects/create',
  async (input, { signal, rejectWithValue }) => {
    try {
      return await api.createProject(input, signal);
    } catch (error) {
      if ((error as Error).name === 'AbortError') throw error;
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateProject = createAsyncThunk<Project, { id: string; input: Partial<ProjectInput> }, { rejectValue: string }>(
  'projects/update',
  async ({ id, input }, { signal, rejectWithValue }) => {
    try {
      return await api.updateProject(id, input, signal);
    } catch (error) {
      if ((error as Error).name === 'AbortError') throw error;
      return rejectWithValue((error as Error).message);
    }
  }
);

export const deleteProject = createAsyncThunk<{ id: string }, string, { rejectValue: string }>(
  'projects/delete',
  async (id, { signal, rejectWithValue }) => {
    try {
      return await api.deleteProject(id, signal);
    } catch (error) {
      if ((error as Error).name === 'AbortError') throw error;
      return rejectWithValue((error as Error).message);
    }
  }
);

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setProjectSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
      state.page = 1;
    },
    setProjectPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setSelectedProject(state, action: PayloadAction<string>) {
      state.selectedProjectId = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        if (!state.selectedProjectId && action.payload.items[0]) {
          state.selectedProjectId = action.payload.items[0].id;
        }
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'AbortError') {
          state.error = action.payload ?? action.error.message ?? '项目加载失败';
        }
      })
      .addCase(createProject.pending, (state) => {
        state.saving = true;
        state.error = '';
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.saving = false;
        state.items = [action.payload, ...state.items].slice(0, state.pageSize);
        state.total += 1;
        state.selectedProjectId = action.payload.id;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.saving = false;
        if (action.error.name !== 'AbortError') {
          state.error = action.payload ?? action.error.message ?? '项目创建失败';
        }
      })
      .addCase(updateProject.pending, (state, action) => {
        state.saving = true;
        const { id, input } = action.meta.arg;
        const current = state.items.find((project) => project.id === id);
        if (current) {
          state.optimisticBackups[id] = { ...current };
          Object.assign(current, input, { updatedAt: new Date().toISOString() });
        }
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.saving = false;
        const index = state.items.findIndex((project) => project.id === action.payload.id);
        if (index >= 0) state.items[index] = action.payload;
        delete state.optimisticBackups[action.payload.id];
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.saving = false;
        const id = action.meta.arg.id;
        const backup = state.optimisticBackups[id];
        const index = state.items.findIndex((project) => project.id === id);
        if (backup && index >= 0) state.items[index] = backup;
        delete state.optimisticBackups[id];
        if (action.error.name !== 'AbortError') {
          state.error = action.payload ?? action.error.message ?? '项目保存失败';
        }
      })
      .addCase(deleteProject.pending, (state, action) => {
        state.saving = true;
        const id = action.meta.arg;
        const current = state.items.find((project) => project.id === id);
        if (current) state.optimisticBackups[id] = { ...current };
        state.items = state.items.filter((project) => project.id !== id);
        state.total = Math.max(0, state.total - 1);
        if (state.selectedProjectId === id) state.selectedProjectId = state.items[0]?.id ?? '';
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.saving = false;
        delete state.optimisticBackups[action.payload.id];
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.saving = false;
        const id = action.meta.arg;
        const backup = state.optimisticBackups[id];
        if (backup && !state.items.some((project) => project.id === id)) {
          state.items = [backup, ...state.items].slice(0, state.pageSize);
          state.total += 1;
        }
        delete state.optimisticBackups[id];
        if (action.error.name !== 'AbortError') {
          state.error = action.payload ?? action.error.message ?? '项目删除失败';
        }
      });
  }
});

export const { setProjectPage, setProjectSearch, setSelectedProject } = projectsSlice.actions;
export default projectsSlice.reducer;
