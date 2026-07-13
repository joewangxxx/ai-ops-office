# AI Ops Office

一个交互式 2D 像素办公室演示项目，用于呈现产品、开发与测试团队中，人类与 AI Agent 的协作方式，以及以标准化产物为单位的交接流程。

## 功能概览

- PM、Dev、QA 与中央 Artifact Hub 的可视化办公室地图
- 人物头像及 AI Agent 状态提示
- 以产物为中心的交接链路：PRD → Feature → Test Report
- 结合地图选择的详情面板和演示流程控制

## 本地运行

```bash
cd apps/office-demo
npm install
npm run dev
```

## 验证项目

```bash
cd apps/office-demo
npm test
npm run build
```

## 项目结构

- `apps/office-demo/`：React + Vite 交互式演示应用
- `docs/`：产品设计、布局与实施文档
- `images/`：源视觉素材
