import { useEffect } from 'react';
import { fetchProjects, setSelectedProject } from '../store/projectsSlice';
import { useAppDispatch, useAppSelector } from '../store';

export const ProjectSelect = () => {
  const dispatch = useAppDispatch();
  const { items, selectedProjectId, loading } = useAppSelector((state) => state.projects);

  useEffect(() => {
    if (!items.length) {
      const request = dispatch(fetchProjects());
      return () => request.abort();
    }
    return undefined;
  }, [dispatch, items.length]);

  return (
    <label className="field field--inline">
      <span>项目</span>
      <select value={selectedProjectId} disabled={loading} onChange={(event) => dispatch(setSelectedProject(event.target.value))}>
        {items.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
    </label>
  );
};
