import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Edit3, Plus, Search, Trash2 } from 'lucide-react';
import { LoadingPanel } from '../components/LoadingPanel';
import { Modal } from '../components/Modal';
import { useAppDispatch, useAppSelector } from '../store';
import { createProject, deleteProject, fetchProjects, setProjectPage, setProjectSearch, setSelectedProject, updateProject } from '../store/projectsSlice';
import type { Project, ProjectInput, ProjectStatus } from '../types';
import { todayISO } from '../utils/date';

const statusLabels: Record<ProjectStatus, string> = {
  preparing: '筹备中',
  active: '运营中',
  paused: '暂停',
  closed: '已结束'
};

const blankForm: ProjectInput = {
  name: '',
  location: '',
  date: todayISO(),
  status: 'active'
};

export const ProjectsPage = () => {
  const dispatch = useAppDispatch();
  const { items, total, page, pageSize, search, loading, saving, error, selectedProjectId } = useAppSelector((state) => state.projects);
  const [form, setForm] = useState<ProjectInput>(blankForm);
  const [editing, setEditing] = useState<Project | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleteText, setDeleteText] = useState('');
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    const request = dispatch(fetchProjects());
    return () => request.abort();
  }, [dispatch, page, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(blankForm);
    setIsProjectModalOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditing(project);
    setIsProjectModalOpen(true);
    setForm({
      name: project.name,
      location: project.location,
      date: project.date,
      status: project.status
    });
  };

  const modalTitle = useMemo(() => (editing ? '编辑项目' : '新建项目'), [editing]);

  const submitProject = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.location.trim()) {
      alert('项目名称和地点不能为空');
      return;
    }
    try {
      if (editing) {
        await dispatch(updateProject({ id: editing.id, input: form })).unwrap();
      } else {
        await dispatch(createProject(form)).unwrap();
      }
      setEditing(null);
      setIsProjectModalOpen(false);
      setForm(blankForm);
      dispatch(fetchProjects());
    } catch (error) {
      console.warn('项目保存失败', error);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleteText !== deleteTarget.name) return;
    try {
      await dispatch(deleteProject(deleteTarget.id)).unwrap();
      setDeleteTarget(null);
      setDeleteText('');
      dispatch(fetchProjects());
    } catch (error) {
      console.warn('项目删除失败', error);
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">多项目管理</p>
          <h1>项目列表</h1>
        </div>
        <button className="button button--primary" type="button" onClick={openCreate}>
          <Plus size={18} />
          新建项目
        </button>
      </div>

      <div className="toolbar">
        <label className="search-box">
          <Search size={18} />
          <input value={search} placeholder="按项目名称搜索" onChange={(event) => dispatch(setProjectSearch(event.target.value))} />
        </label>
      </div>

      <LoadingPanel loading={loading} error={error} onRetry={() => dispatch(fetchProjects())}>
        <div className="card-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>名称</th>
                <th>地点</th>
                <th>日期</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((project) => (
                <tr key={project.id} className={selectedProjectId === project.id ? 'is-selected-row' : ''}>
                  <td>
                    <strong>{project.name}</strong>
                  </td>
                  <td>{project.location}</td>
                  <td>{project.date}</td>
                  <td>
                    <span className={`status-badge status-badge--${project.status}`}>{statusLabels[project.status]}</span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-button" title="设为当前项目" type="button" onClick={() => dispatch(setSelectedProject(project.id))}>
                        <CheckCircle2 size={16} />
                      </button>
                      <button className="icon-button" title="编辑" type="button" onClick={() => openEdit(project)}>
                        <Edit3 size={16} />
                      </button>
                      <button className="icon-button icon-button--danger" title="删除" type="button" onClick={() => setDeleteTarget(project)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="pagination">
          <button className="button button--secondary" type="button" disabled={page <= 1} onClick={() => dispatch(setProjectPage(page - 1))}>
            上一页
          </button>
          <span>
            第 {page} / {totalPages} 页，每页 {pageSize} 条
          </span>
          <button className="button button--secondary" type="button" disabled={page >= totalPages} onClick={() => dispatch(setProjectPage(page + 1))}>
            下一页
          </button>
        </footer>
      </LoadingPanel>

      {isProjectModalOpen ? (
        <Modal
          title={modalTitle}
          onClose={() => {
            setEditing(null);
            setForm(blankForm);
            setIsProjectModalOpen(false);
          }}
          footer={
            <>
              <button className="button button--secondary" type="button" onClick={() => setForm(blankForm)}>
                重置
              </button>
              <button className="button button--primary" form="project-form" type="submit" disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </button>
            </>
          }
        >
          <form id="project-form" className="form-grid" onSubmit={submitProject}>
            <label className="field">
              <span>项目名称</span>
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label className="field">
              <span>地点</span>
              <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
            </label>
            <label className="field">
              <span>日期</span>
              <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
            </label>
            <label className="field">
              <span>状态</span>
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ProjectStatus })}>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </form>
        </Modal>
      ) : null}

      {deleteTarget ? (
        <Modal
          title="删除项目确认"
          onClose={() => setDeleteTarget(null)}
          footer={
            <>
              <button className="button button--secondary" type="button" onClick={() => setDeleteTarget(null)}>
                取消
              </button>
              <button className="button button--danger" type="button" disabled={deleteText !== deleteTarget.name || saving} onClick={confirmDelete}>
                确认删除
              </button>
            </>
          }
        >
          <p className="danger-copy">删除项目会同时删除该项目所有营收记录。请输入项目名称完成二次确认。</p>
          <label className="field">
            <span>{deleteTarget.name}</span>
            <input value={deleteText} onChange={(event) => setDeleteText(event.target.value)} />
          </label>
        </Modal>
      ) : null}
    </section>
  );
};
