import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import { subscribeSync } from './api/sync';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { DataPage } from './pages/DataPage';
import { BatchEntryPage } from './pages/BatchEntryPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { setSyncNotice } from './store/appSlice';
import { useAppDispatch, useAppSelector } from './store';
import { fetchProjects } from './store/projectsSlice';
import { fetchRevenue, fetchTodayRevenue } from './store/revenueSlice';

export const App = () => {
  const dispatch = useAppDispatch();
  const selectedProjectId = useAppSelector((state) => state.projects.selectedProjectId);
  const range = useAppSelector((state) => state.revenue.range);

  useEffect(() => {
    const request = dispatch(fetchProjects());
    return () => request.abort();
  }, [dispatch]);

  useEffect(() => {
    return subscribeSync((message) => {
      dispatch(setSyncNotice(message.type === 'projects:changed' ? '项目数据已同步' : '营收数据已同步'));
      window.setTimeout(() => dispatch(setSyncNotice('')), 2400);
      if (message.type === 'projects:changed') dispatch(fetchProjects());
      if (message.type === 'revenue:changed' && (!message.projectId || message.projectId === selectedProjectId)) {
        if (!selectedProjectId) return;
        dispatch(fetchTodayRevenue(selectedProjectId));
        dispatch(fetchRevenue({ projectId: selectedProjectId, start: range.start, end: range.end }));
      }
    });
  }, [dispatch, range.end, range.start, selectedProjectId]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/entry" element={<BatchEntryPage />} />
        <Route path="/data" element={<DataPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
