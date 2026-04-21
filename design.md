# 设计规范：Intent → Skill → Agent → Auto-UI 生成平台

## 1. 产品定位

面向开发者 / 业务人员的低代码 AI 工作台：
用户输入自然语言意图 → 系统自动解析意图 → 动态生成可执行 Skill → Agent 调度执行 → 自动生成可预览前端页面并展示。

风格定位：科技、极简、专业、清晰、模块化
对标产品风格：LangChain 后台、Vercel、Cursor IDE、Cloudflare 控制台

## 2. 整体风格约束

- 风格：现代中台工具风 + 轻暗色代码感
- 气质：专业、理性、干净、高效
- 视觉：卡片分层、柔和阴影、充足留白、弱化装饰
- 动画：仅用于状态变化，不花哨、不抢注意力
- 适配：桌面优先，支持基础响应式

## 3. 色彩系统

### 主色调
- primary: #165DFF（AI 科技蓝，用于按钮、高亮、进度、激活态）
- secondary: #7B61FF（辅助紫，用于 Skill、模块卡片强调）

### 功能色
- success: #00B96B
- warning: #FF7D00
- danger: #F53F3F
- info: #86909C

### 中性色（浅色模式）
- bg-body: #F7F8FA
- bg-card: #FFFFFF
- border: #E5E6EB
- text-primary: #1D2129
- text-secondary: #4E5969
- text-tertiary: #86909C

### 代码块深色
- code-bg: #1E1E2F
- code-text: #E0E0E0
- code-keyword: #FF79C6
- code-string: #A8FF60
- code-comment: #6272A4

## 4. 布局结构（固定不可随意修改）

整体采用经典 **三栏布局**：

### 左侧侧边栏 Sidebar（固定 240px）
- 项目 Logo + 标题
- 导航菜单：工作台 / 历史记录 / Skill 管理 / 执行日志 / 设置
- 折叠功能
- 底部：版本信息

### 中间主内容区 Main（弹性宽度）
从上至下垂直卡片流：
1. 意图输入区（大输入框）
2. 意图解析结果（结构化展示）
3. 自动生成的 Skill（代码卡片）
4. Agent 执行过程（步骤日志）
5. 自动生成的 UI 预览区（内嵌展示）

### 右侧信息面板 RightPanel（固定 280px）
- 上下文信息 / 模型状态 / 执行统计