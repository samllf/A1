import type { Project, RevenueRecord } from '../types';
import { createSeedProjects, createSeedRevenue } from '../data/seed';

const PROJECTS_KEY = 'mealRevenue.projects';
const REVENUE_KEY = 'mealRevenue.revenue';

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = <T,>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const ensureSeedData = (): void => {
  if (!localStorage.getItem(PROJECTS_KEY) || !localStorage.getItem(REVENUE_KEY)) {
    const projects = createSeedProjects();
    writeJson(PROJECTS_KEY, projects);
    writeJson(REVENUE_KEY, createSeedRevenue(projects));
  }
};

export const readProjects = (): Project[] => {
  ensureSeedData();
  return readJson<Project[]>(PROJECTS_KEY, []);
};

export const writeProjects = (projects: Project[]): void => {
  writeJson(PROJECTS_KEY, projects);
};

export const readRevenue = (): RevenueRecord[] => {
  ensureSeedData();
  return readJson<RevenueRecord[]>(REVENUE_KEY, []);
};

export const writeRevenue = (records: RevenueRecord[]): void => {
  writeJson(REVENUE_KEY, records);
};
