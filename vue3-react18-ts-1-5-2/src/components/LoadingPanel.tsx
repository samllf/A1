import type { ReactNode } from 'react';

interface LoadingPanelProps {
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  children?: ReactNode;
}

export const LoadingPanel = ({ loading, error, onRetry, children }: LoadingPanelProps) => {
  if (loading) {
    return (
      <div className="state-panel" role="status">
        <span className="spinner" />
        正在加载数据...
      </div>
    );
  }

  if (error) {
    return (
      <div className="state-panel state-panel--error" role="alert">
        <strong>{error}</strong>
        {onRetry ? (
          <button type="button" className="button button--secondary" onClick={onRetry}>
            重试
          </button>
        ) : null}
      </div>
    );
  }

  return <>{children}</>;
};
