import type { Project, ProjectStatus, RevenueRecord } from '../types';
import { addDays, todayISO } from '../utils/date';

const statuses: ProjectStatus[] = ['active', 'preparing', 'paused', 'closed'];
const locations = ['A区员工餐厅', 'B区综合楼', '研发园区', '制造中心', '总部食堂', '城市配餐点'];
const stalls = ['川湘热菜', '清真窗口', '轻食沙拉', '面点档', '粤式烧腊', '咖啡饮品', '夜宵档', '外卖小站'];

const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10_000;
  return x - Math.floor(x);
};

export const createSeedProjects = (): Project[] => {
  const today = todayISO();
  return Array.from({ length: 14 }, (_, index) => ({
    id: `project-${index + 1}`,
    name: `团餐项目 ${index + 1}`,
    location: locations[index % locations.length],
    date: addDays(today, index % 2 === 0 ? -index : index),
    status: statuses[index % statuses.length],
    updatedAt: new Date().toISOString()
  }));
};

export const createSeedRevenue = (projects: Project[]): RevenueRecord[] => {
  const today = todayISO();
  const records: RevenueRecord[] = [];

  projects.slice(0, 6).forEach((project, projectIndex) => {
    const dayCount = projectIndex === 0 ? 48 : 16;
    for (let dayOffset = 0; dayOffset < dayCount; dayOffset += 1) {
      const date = addDays(today, -dayOffset);
      stalls.forEach((stall, stallIndex) => {
        [7, 11, 12, 17, 18, 21].forEach((baseHour, hourIndex) => {
          const hour = projectIndex === 0 && dayOffset === 0 ? hourIndex * 4 : Math.min(23, baseHour + Math.floor(seededRandom(dayOffset + stallIndex + hourIndex) * 2));
          const seed = projectIndex * 1000 + dayOffset * 100 + stallIndex * 10 + hourIndex;
          const orders = Math.floor(20 + seededRandom(seed) * 160);
          const mealBoost = 1 + seededRandom(seed + 4) * 0.7;
          records.push({
            id: `rev-${project.id}-${dayOffset}-${stallIndex}-${hourIndex}`,
            projectId: project.id,
            date,
            hour,
            stall,
            breakfast: hour < 10 ? Math.round(orders * 9 * mealBoost) : 0,
            lunch: hour >= 10 && hour < 15 ? Math.round(orders * 18 * mealBoost) : 0,
            dinner: hour >= 16 && hour < 20 ? Math.round(orders * 21 * mealBoost) : 0,
            midnight: hour >= 20 ? Math.round(orders * 15 * mealBoost) : 0,
            takeaway: Math.round(orders * 5 * seededRandom(seed + 8)),
            orders,
            createdAt: new Date().toISOString()
          });
        });
      });
    }
  });

  return records;
};
