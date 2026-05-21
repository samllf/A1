# 团餐营收管理系统

单页应用，基于 React 18 + TypeScript + Vite。数据使用本地模拟后端，带请求延迟、AbortController 取消、LocalStorage 持久化和 BroadcastChannel 多端同步。

## 运行

```bash
npm install
npm run dev
```

常用命令：

```bash
npm run test
npm run lint
npm run build
```

## 功能覆盖

- 多项目管理：创建、编辑、删除、名称搜索、每页 5 条分页、删除二次确认。
- 实时营收看板：0-23 小时趋势图、KPI、点击小时查看档口明细、普通模式 10 秒刷新、大屏模式 5 秒刷新。
- 批量录入：动态增减行、餐别金额和订单数校验、一次性提交。
- Excel 导入导出：按项目和日期范围导出，导入支持追加和覆盖，同一天同档口重复时弹窗选择。
- 性能：超过 1000 条营收明细自动使用虚拟滚动，图表输入防抖、点击节流。
- UX：请求 loading、错误重试、未保存离开保护、暗色主题、响应式移动端底部导航和滑动切页。
- 加分项：Service Worker 缓存、项目更新/删除乐观更新、BroadcastChannel 模拟多端同步、web-vitals 控制台输出。

## 目录结构

```text
src/
  api/          模拟后端、缓存读写、多端同步
  components/   通用组件、图表、虚拟列表
  hooks/        防抖、节流、路由守卫、手势
  pages/        看板、项目、录入、数据页面
  store/        Redux Toolkit 状态管理
  utils/        日期、营收计算、Excel、虚拟滚动工具
  tests/        Vitest 单元测试
```

首次启动会自动生成种子项目和营收数据，可在浏览器 LocalStorage 中清理 `mealRevenue.*` 重新初始化。
