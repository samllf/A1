import { useCallback, useEffect } from 'react';
import { To, useNavigate } from 'react-router-dom';
import { setUnsavedChanges } from '../store/appSlice';
import { useAppDispatch, useAppSelector } from '../store';

const UNSAVED_MESSAGE = '当前表单还有未保存内容，确定要离开吗？';

export const useUnsavedGuard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const hasUnsavedChanges = useAppSelector((state) => state.app.hasUnsavedChanges);

  const guardedNavigate = useCallback(
    (to: To) => {
      if (hasUnsavedChanges && !window.confirm(UNSAVED_MESSAGE)) return;
      if (hasUnsavedChanges) dispatch(setUnsavedChanges(false));
      navigate(to);
    },
    [dispatch, hasUnsavedChanges, navigate]
  );

  return { guardedNavigate, hasUnsavedChanges };
};

export const UnsavedChangesGuard = () => {
  const dispatch = useAppDispatch();
  const hasUnsavedChanges = useAppSelector((state) => state.app.hasUnsavedChanges);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = UNSAVED_MESSAGE;
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const handler = () => {
      if (!hasUnsavedChanges) return;
      if (!window.confirm(UNSAVED_MESSAGE)) {
        window.history.forward();
        return;
      }
      dispatch(setUnsavedChanges(false));
    };

    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [dispatch, hasUnsavedChanges]);

  return null;
};
