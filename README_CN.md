# 退休模拟器

一款带 AI 顾问面板的蒙特卡洛退休模拟器。输入您的退休储蓄，设置提款规则，即可获得投资组合在 30 年以上存续的概率——模拟计算全部在浏览器中完成，AI 顾问通过服务端接口支持 Claude 或 GPT。

**在线演示：** _(部署到 Vercel 后获取您的 URL)_

---

## 功能介绍

大多数退休工具使用静态的 4% 提款规则。本模拟器基于真实的标普 500 历史收益率和 CPI 通胀数据（2004–2025 年）运行 **1,000 次模拟未来场景**，并向您展示：

- **成功概率** — 例如"资金持续 30 年的概率为 87%"
- **扇形图表** — 从最差的 10% 到最优的 90% 的投资组合价值走势图
- **逐年明细表** — 每年的投资组合中位数价值、提款金额及各资金桶余额
- **风险指标** — 最坏情况下的耗尽年份、最好情况下的增长情况、安全提款下限
- **AI 顾问面板** — 模拟结束后，向 Claude 或 GPT 提问，解读您的退休计划

### 智能资金桶顺序

核心差异化功能：根据市场状况按顺序提款，以保护长期增长。

| 市场状况 | 提款顺序 |
|---|---|
| 熊市（收益率 < 0%）| 现金 → 债券 → 股票 |
| 中性（0% 至通胀率+2%）| 债券 → 现金 → 股票 |
| 牛市（收益率 > 通胀率+2%）| 股票 → 债券 → 现金 |

仅此一项，相较于随机顺序提款，即可将投资组合寿命延长 3–5 年。

---

## 技术栈

| 层级 | 选择 |
|---|---|
| 框架 | Next.js 15（App Router） |
| 前端框架 | React 19 + TypeScript |
| 样式 | Tailwind CSS v3 |
| 图表 | Recharts |
| 模拟计算 | Web Worker（非阻塞，在浏览器中运行） |
| 大语言模型 | Anthropic Claude 或 OpenAI（服务端 API 路由） |
| 部署 | Vercel（免费套餐可用于 SPA；AI 顾问需配置环境变量） |
| 数据 | `public/data/` 中的静态 JSON 文件 |

蒙特卡洛引擎完全在浏览器中运行（Web Worker），仅 AI 顾问调用走服务端。

---

## 快速开始

### 环境要求

- Node.js 22+
- npm 10+
- Git Bash（Windows）或任意 Unix Shell

### 安装与运行

```bash
git clone https://github.com/techfrenza/retirement_planning_web_app.git
cd retirement_planning_web_app
npm install
```

配置环境变量（AI 顾问功能必须，详见 [AI 顾问配置](#ai-顾问配置)）：

```bash
cp .env.local.example .env.local
# 然后编辑 .env.local，填入您的 LLM 凭证
```

启动开发服务器：

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

> **端口冲突？** 若 3000 端口已被占用，Next.js 会自动选用下一个空闲端口（3001、3002……）。实际地址会打印在终端输出中，形如 `Local: http://localhost:XXXX`。

### 在 Git Bash 中对 AI 接口做冒烟测试

服务器启动后，运行以下命令验证 LLM 路由是否端到端正常：

```bash
curl -s -X POST "http://localhost:3000/api/llm" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role":"user","content":"ping"}],
    "simulationContext": {
      "portfolioValue": 1000000,
      "survivalProbability": 0.85,
      "withdrawalRules": [{"threshold":5,"rate":4}],
      "projectionYears": 30,
      "p50Final": 1200000,
      "p10Final": 200000,
      "p90Final": 3500000,
      "medianWithdrawalYear1": 40000
    }
  }'
```

预期输出：Claude 返回的纯文本流式响应（非错误 JSON）。

### 生产环境构建

```bash
npm run build
npm start
```

### 运行测试

```bash
npm test
```

---

## AI 顾问配置

AI 顾问面板在模拟结束后显示于结果页面，需要配置服务端 LLM 密钥。

1. 复制示例环境文件：
   ```bash
   cp .env.local.example .env.local
   ```

2. 填写凭证 — **选择一种方式：**

   **方式 A — SAP Hyperspace 代理（内部使用）：**
   ```env
   LLM_PROVIDER=anthropic
   ANTHROPIC_AUTH_TOKEN=<您的 SAP Hyperspace 令牌>
   ANTHROPIC_BASE_URL=http://localhost:6655/anthropic/
   ```

   **方式 B — 直接连接 Anthropic：**
   ```env
   LLM_PROVIDER=anthropic
   ANTHROPIC_API_KEY=sk-ant-...
   ```

   **方式 C — OpenAI：**
   ```env
   LLM_PROVIDER=openai
   OPENAI_API_KEY=sk-...
   ```

3. 重启 `npm run dev`，结果页面即可使用 AI 顾问面板。

未配置凭证时，应用仍可正常运行——发送消息时 AI 顾问面板会显示错误提示。

---

## 项目结构

```
retirement-simulator/
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── package.json
├── .env.local.example          # 复制为 .env.local 并填写 LLM 凭证
│
├── app/                        # Next.js App Router
│   ├── layout.tsx              # HTML 外壳，全局 CSS 导入
│   ├── page.tsx                # 入口页面（渲染 App 客户端组件）
│   └── api/
│       └── llm/
│           └── route.ts        # POST /api/llm — 流式 LLM 代理
│
├── lib/                        # 仅服务端 LLM 层
│   ├── claude.ts               # Anthropic 客户端（代理与直连认证切换）
│   ├── openai-llm.ts           # OpenAI 客户端
│   └── llm.ts                  # 统一接口 callLLM() / streamLLMMessage()
│
├── public/
│   └── data/
│       ├── sp500_returns.json  # 标普 500 年度收益率 2004–2025
│       └── inflation_rates.json # 美国 CPI 年度通胀率 2004–2025
│
└── src/
    ├── App.tsx                 # 根客户端组件
    ├── index.css               # Tailwind 指令
    │
    ├── engine/
    │   ├── types.ts            # TypeScript 接口定义（SimulationInput、SimulationOutput、SimulationContext 等）
    │   ├── simulator.ts        # 蒙特卡洛逻辑
    │   ├── simulator.worker.ts # Web Worker 封装
    │   └── __tests__/
    │       └── simulator.test.ts
    │
    ├── components/
    │   ├── Wizard.tsx
    │   ├── NestEggStep.tsx
    │   ├── StrategyStep.tsx
    │   ├── SimulationStep.tsx
    │   ├── ResultsDashboard.tsx
    │   ├── SurvivalMetric.tsx
    │   ├── FanChart.tsx
    │   ├── ResultsTable.tsx
    │   └── AdvisorPanel.tsx    # AI 顾问聊天面板
    │
    ├── utils/
    │   ├── sharing.ts          # 可分享链接的 URL 编码/解码
    │   └── formatting.ts       # 货币和百分比格式化工具
    │
    └── data/
        └── historical.ts       # 获取并缓存 JSON 数据文件
```

---

## 使用模拟器

**第一步 — 您的退休储蓄**
输入您的投资组合总价值，并将其分配到三个资金桶中：现金、债券和股票（合计必须为 100%）。

**第二步 — 提款规则**
选择预设方案（保守型 / 适中型 / 激进型），或自定义规则：
- _若市场收益率 ≥ 5%，则提取 4%_
- _若市场收益率 ≥ 0%，则提取 3%_
- _若市场收益率 < 0%，则提取 2.5%_

**第三步 — 开始模拟**
设置预测期限（默认：30 年），然后点击**运行模拟**。结果将在 2 秒内显示。

**AI 顾问**
结果加载后，点击**咨询 AI 顾问**打开聊天面板。可使用快捷问题按钮，或直接输入问题——例如"我的存续概率意味着什么？"或"我的提款比例是否过于激进？"

### 可分享链接

运行模拟后，点击**分享**即可复制一个将所有输入参数编码到查询字符串中的 URL。接收者打开链接即可看到完全相同的结果——无需账户。

---

## 更新历史数据

数据文件存放在 `public/data/` 目录下，每年更新一次。如需刷新：

```bash
npx tsx scripts/update-data.ts
```

---

## 部署

**Vercel（推荐）：**

```bash
npm install -g vercel
vercel login
vercel --prod
```

Vercel 自动识别 Next.js 项目。在 Vercel 控制台中设置 `ANTHROPIC_AUTH_TOKEN` / `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` 等环境变量，即可在生产环境中启用 AI 顾问功能。

---

## 构建状态

| 阶段 | 状态 |
|---|---|
| 第一阶段：基础搭建（脚手架、数据、类型）| ✅ 已完成 |
| 第二阶段：模拟引擎 | ✅ 已完成 |
| 第三阶段：UI 组件 | ✅ 已完成 |
| 第四阶段：Next.js 迁移 + AI 顾问 | ✅ 已完成 |
| 第五阶段：完善与部署 | 🔲 待处理 |

---

## 许可证

MIT
