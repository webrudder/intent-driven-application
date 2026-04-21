# ID-App Runtime — 意图驱动动态应用运行时系统

## 产品定位

"用户自然语言意图 → 自动生成Skill → Agent执行 → 自动渲染UE前端"的全流程自动化系统。软件服务行业专用，基于UE客户端 + Node.js后端 + LLM大模型，无需人工编码即可快速生成动态应用。

## 技术栈

| 层 | 技术 |
|---|---|
| UE客户端 | UE5.0+, Puerts, TypeScript, UMG |
| 后端 | Node.js 16.x+, TypeScript, Express, better-sqlite3/mysql2, OpenAI SDK |
| 管理后台 | React, Ant Design Pro, TypeScript, Monaco Editor |
| 大模型 | OpenAI兼容格式（DeepSeek/Qwen/vLLM/Ollama） |
| 数据库 | SQLite 3.x（默认）, MySQL 8.0（可选） |

## 核心架构

```
UE客户端 → HTTP/HTTPS(token) → Node.js后端 → HTTP(OpenAI格式) → 大模型服务
                                    ↕
                              数据库(SQLite/MySQL)
```

后端分层：接口层 → 意图解析层 → Skill引擎层 → LLM对接层 → 数据访问层 + 缓存层(node-cache)

## 核心流程（run-intent）

1. **意图解析**: 用户输入 → 调用默认大模型 → 输出结构化意图JSON(intent, params, needUI, uiType)，耗时≤1s
2. **Skill匹配/生成**: 查询技能库 → 有匹配则复用(≤0.5s) → 无匹配则调用LLM自动生成(≤2s)，保存到技能库
3. **Skill执行**: 沙箱环境(new Function)执行代码 → 校验输入参数与Schema → 捕获异常 → 返回结果(≤1s)
4. **UI Schema生成**: 执行结果 + 意图 → 调用LLM生成UE UMG可渲染的UI Schema(≤1s)
5. **UE渲染**: 客户端解析UI Schema → 动态创建UMG组件(card/table/chart)

端到端总耗时≤3s，缓存命中时≤1s。

## 后端项目结构

```
/backend/src/
  ├── index.ts           # 服务入口
  ├── config/            # 配置(端口、缓存、数据库)
  ├── api/
  │   ├── router.ts      # 路由注册
  │   ├── auth.ts        # 鉴权中间件(jwt)
  │   ├── client.ts      # 终端用户接口
  │   └── admin.ts       # 管理员接口
  ├── core/
  │   ├── intent.ts      # 意图解析
  │   ├── skill.ts       # Skill生成、执行
  │   ├── llm.ts         # LLM对接(OpenAI SDK)
  │   └── ui.ts          # UI Schema生成
  ├── db/
  │   ├── index.ts       # 数据库连接
  │   ├── llmConfig.ts   # 大模型配置CRUD
  │   ├── skillStore.ts  # Skill CRUD
  │   └── log.ts         # 日志CRUD
  ├── utils/
  │   ├── encrypt.ts     # AES加密/解密
  │   ├── validate.ts    # 参数校验
  │   └── retry.ts       # 重试机制
  └── types/             # TS类型定义
```

## API接口规范

### 终端接口

- `POST /api/v1/run-intent` — 接收 `{user_input, token}`，返回 `{uiSchema, result}`

### 管理员接口

- 大模型配置: `/api/admin/llm/*` (列表/新增/编辑/删除/启用禁用/设默认/测试)
- Skill管理: `/api/admin/skill/*` (列表/新增/编辑/删除/启用禁用/版本/测试)
- 日志管理: `/api/admin/log/*` (操作日志/LLM调用日志)

### 响应格式

成功: `{code: 0, data: {...}}`  失败: `{code: -1, error: "错误信息"}`  未授权: `{code: -1, error: "未授权访问"}`

## 数据库表

- `llm_config` — 大模型配置(名称, apiKey加密, baseUrl, 模型名, 状态, 是否默认, 创建时间)
- `skill_store` — Skill(技能名, 绑定意图, 代码TS函数, 输入/输出Schema, 版本, 状态, 描述, 创建时间)
- `operation_log` — 操作日志(操作人, 类型, 内容, 时间, 结果)
- `llm_call_log` — LLM调用日志(时间, 模型名, 意图, 响应时间, 结果, 请求参数, 响应内容)

## 关键技术约束

- **LLM调用参数**: temperature=0.1, response_format={type: "json_object"}, system+user双消息
- **Skill沙箱**: new Function执行，禁止fs/child_process等高危API
- **密钥安全**: apiKey AES加密存储，不暴露前端/日志，查询时解密
- **鉴权**: jsonwebtoken token验证，管理员接口和UE接口均需合法token
- **缓存**: node-cache，有效期可配置(默认1小时)，Skill/模型配置修改后自动刷新
- **LLM重试**: 调用失败自动重试1次，间隔1秒
- **UI Schema组件映射**: 数字→card, 数组→table, 时间序列→chart

## UE客户端模块

- 输入交互: UMG EditableText + Button，绑定TS事件(Puerts)
- 网络请求: fetch封装，请求头含Authorization: Bearer token，超时10s(AbortSignal)
- UI渲染: 解析UI Schema component.type → 动态创建UMG组件(TextBlock+Border/TableView/ECharts适配)
- 状态管理: loading/success/error三态，对应加载动画/结果界面/错误提示+重试

## 管理后台模块

- 大模型配置页: 列表(筛选/分页) + 新增/编辑弹窗 + 删除确认 + 测试按钮
- Skill管理页: 列表(搜索/筛选/分页) + 新增/编辑弹窗(Monaco Editor代码编辑) + 版本管理
- 日志管理页: 操作日志/LLM调用日志双标签页，筛选+详情查看

## 用户角色

| 角色 | 范围 | 关键操作 |
|---|---|---|
| 终端用户 | UE客户端 | 输入意图、查看界面、刷新、重试 |
| 管理员 | Web后台 | 大模型配置管理、Skill管理、日志查看 |
| 研发 | 系统维护 | 后端核心模块、UE渲染组件、管理后台扩展 |

## 性能指标

- 端到端响应≤3s，缓存命中≤1s
- 并发100用户无卡顿，后端20次LLM调用/s
- 连续运行72小时无崩溃无内存泄漏

## 版本规划

- **V1.0**: 核心流程 + 大模型/Skill基础管理 + 密钥加密 + token鉴权 + 沙箱执行
- **V1.1**: 日志管理 + Skill版本/测试 + 模型测试 + 缓存优化 + MySQL支持
- **V1.2**: 多Skill串联(任务编排) + 本地模型深度对接 + 界面自定义 + 批量操作 + 多角色权限