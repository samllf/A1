import type {
  BatchRevenueInput,
  ImportMode,
  PaginatedResult,
  Project,
  ProjectInput,
  RevenueQuery,
  RevenueRecord
} from '../types';
import { isWithinRange, todayISO } from '../utils/date';
import { duplicateKey } from '../utils/revenue';
import { publishSync } from './sync';
import { readProjects, readRevenue, writeProjects, writeRevenue } from './storage';

const randomId = (prefix: string): string => {
  const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return `${prefix}-${uuid}`;
};

const simulateDelay = async <T,>(result: () => T, signal?: AbortSignal, failRate = 0.03): Promise<T> => {
  const duration = 350 + Math.random() * 600;

  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, duration);
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer);
        reject(new DOMException('请求已取消', 'AbortError'));
      },
      { once: true }
    );
  });

  if (signal?.aborted) {
    throw new DOMException('请求已取消', 'AbortError');
  }

  if (Math.random() < failRate) {
    throw new Error('模拟后端暂时不可用，请稍后重试');
  }

  return result();
};

export const api = {
  getProjects(params: { search: string; page: number; pageSize: number }, signal?: AbortSignal): Promise<PaginatedResult<Project>> {
    return simulateDelay(() => {
      const search = params.search.trim().toLowerCase();
      const filtered = readProjects()
        .filter((project) => project.name.toLowerCase().includes(search))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      const start = (params.page - 1) * params.pageSize;
      return {
        items: filtered.slice(start, start + params.pageSize),
        total: filtered.length,
        page: params.page,
        pageSize: params.pageSize
      };
    }, signal);
  },

  createProject(input: ProjectInput, signal?: AbortSignal): Promise<Project> {
    return simulateDelay(() => {
      const project: Project = {
        id: randomId('project'),
        ...input,
        updatedAt: new Date().toISOString()
      };
      writeProjects([project, ...readProjects()]);
      publishSync({ type: 'projects:changed' });
      return project;
    }, signal);
  },

  updateProject(id: string, input: Partial<ProjectInput>, signal?: AbortSignal): Promise<Project> {
    return simulateDelay(() => {
      const projects = readProjects();
      const index = projects.findIndex((project) => project.id === id);
      if (index < 0) throw new Error('项目不存在或已被删除');
      const next = {
        ...projects[index],
        ...input,
        updatedAt: new Date().toISOString()
      };
      projects[index] = next;
      writeProjects(projects);
      publishSync({ type: 'projects:changed' });
      return next;
    }, signal);
  },

  deleteProject(id: string, signal?: AbortSignal): Promise<{ id: string }> {
    return simulateDelay(() => {
      writeProjects(readProjects().filter((project) => project.id !== id));
      writeRevenue(readRevenue().filter((record) => record.projectId !== id));
      publishSync({ type: 'projects:changed' });
      publishSync({ type: 'revenue:changed', projectId: id });
      return { id };
    }, signal);
  },

  getRevenue(query: RevenueQuery, signal?: AbortSignal): Promise<RevenueRecord[]> {
    return simulateDelay(() => {
      return readRevenue()
        .filter((record) => record.projectId === query.projectId && isWithinRange(record.date, query.start, query.end))
        .sort((a, b) => b.date.localeCompare(a.date) || b.hour - a.hour || b.createdAt.localeCompare(a.createdAt));
    }, signal);
  },

  getTodayRevenue(projectId: string, signal?: AbortSignal): Promise<RevenueRecord[]> {
    return api.getRevenue({ projectId, start: todayISO(), end: todayISO() }, signal);
  },

  saveBatch(projectId: string, date: string, rows: BatchRevenueInput[], signal?: AbortSignal): Promise<RevenueRecord[]> {
    return simulateDelay(() => {
      const now = new Date();
      const createdAt = now.toISOString();
      const hour = now.getHours();
      const newRecords = rows.map((row) => ({
        id: randomId('rev'),
        projectId,
        date,
        hour,
        stall: row.stall,
        breakfast: row.breakfast,
        lunch: row.lunch,
        dinner: row.dinner,
        midnight: row.midnight,
        takeaway: row.takeaway,
        orders: row.orders,
        createdAt
      }));
      writeRevenue([...newRecords, ...readRevenue()]);
      publishSync({ type: 'revenue:changed', projectId });
      return newRecords;
    }, signal);
  },

  importRevenue(projectId: string, incoming: RevenueRecord[], mode: ImportMode, signal?: AbortSignal): Promise<RevenueRecord[]> {
    return simulateDelay(() => {
      const normalized = incoming.map((record) => ({
        ...record,
        id: randomId('rev'),
        projectId,
        createdAt: new Date().toISOString()
      }));
      const incomingKeys = new Set(normalized.map(duplicateKey));
      const existing = readRevenue();
      const kept =
        mode === 'overwrite'
          ? existing.filter((record) => record.projectId !== projectId || !incomingKeys.has(duplicateKey(record)))
          : existing;

      writeRevenue([...normalized, ...kept]);
      publishSync({ type: 'revenue:changed', projectId });
      return normalized;
    }, signal);
  }
};
