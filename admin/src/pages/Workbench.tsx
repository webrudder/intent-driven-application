import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { UISchema, UIComponent } from '../types';

type StepState = 'idle' | 'parsing' | 'generating' | 'executing' | 'rendering' | 'done' | 'error';

const STEPS = [
  { key: 'parsing', label: '意图解析' },
  { key: 'generating', label: '生成 Skill' },
  { key: 'executing', label: '执行 Skill' },
  { key: 'rendering', label: '生成 UI' },
  { key: 'done', label: '完成' },
];

export default function Workbench() {
  const { token } = useAuth();
  const [userInput, setUserInput] = useState('');
  const [step, setStep] = useState<StepState>('idle');
  const [intentResult, setIntentResult] = useState<{ intent: string; uiType: string; needUI: boolean } | null>(null);
  const [executionResult, setExecutionResult] = useState<unknown>(null);
  const [uiSchema, setUiSchema] = useState<UISchema | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [elapsed, setElapsed] = useState(0);

  const runIntent = async () => {
    if (!userInput.trim()) return;
    setStep('parsing');
    setErrorMsg('');
    setIntentResult(null);
    setExecutionResult(null);
    setUiSchema(null);
    const now = Date.now();

    try {
      const response = await fetch('/api/v1/run-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ user_input: userInput.trim() }),
      });

      const data = await response.json();
      setElapsed(Math.round((Date.now() - now) / 1000));

      if (data.code !== 0) {
        setStep('error');
        setErrorMsg(data.error || '处理失败');
        return;
      }

      setIntentResult({ intent: data.data.intent, needUI: !!data.data.uiSchema, uiType: data.data.uiSchema?.components?.[0]?.type || 'card' });
      setStep('executing');
      setExecutionResult(data.data.result);
      setStep('rendering');
      setUiSchema(data.data.uiSchema);
      setStep('done');
    } catch (e) {
      setStep('error');
      setErrorMsg((e as Error).message || '请求失败');
    }
  };

  const getStepStatus = (stepKey: string): 'pending' | 'active' | 'done' | 'error' => {
    const order: string[] = ['parsing', 'generating', 'executing', 'rendering', 'done'];
    const currentIdx = order.indexOf(step);
    const stepIdx = order.indexOf(stepKey);
    if (step === 'error') return stepIdx <= currentIdx ? 'error' : 'pending';
    if (stepIdx < currentIdx) return 'done';
    if (stepIdx === currentIdx) return 'active';
    return 'pending';
  };

  const showSpinner = step !== 'idle' && step !== 'error' && step !== 'done';

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {/* Intent Input */}
        <div className="card">
          <div className="card-title">意图输入</div>
          <div className="flex gap-3">
            <textarea value={userInput} onChange={e => setUserInput(e.target.value)}
              placeholder="请输入您的需求，例如：帮我查今天的订单金额"
              className="intent-input flex-1"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); runIntent(); } }}
            />
            <button onClick={runIntent} disabled={showSpinner} className="btn-primary self-end flex items-center gap-2">
              {showSpinner && <Spinner />}
              执行
            </button>
          </div>
        </div>

        {/* Stepper */}
        {step !== 'idle' && (
          <div className="card">
            <div className="card-title">执行流程</div>
            <div className="flex items-center gap-4">
              {STEPS.map((s, i) => {
                const status = getStepStatus(s.key);
                return (
                  <div key={s.key} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                      ${status === 'done' ? 'bg-success text-white' :
                        status === 'active' ? 'bg-primary text-white animate-pulse' :
                        status === 'error' ? 'bg-danger text-white' :
                        'bg-border text-text-tertiary'}`}>
                      {status === 'done' ? '✓' : status === 'error' ? '✗' : i + 1}
                    </div>
                    <span className={`text-sm ${status === 'active' ? 'text-primary font-medium' : status === 'done' ? 'text-success' : 'text-text-tertiary'}`}>
                      {s.label}
                    </span>
                    {i < STEPS.length - 1 ? <div className="w-8 h-px bg-border" /> : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 'error' && errorMsg ? (
          <div className="card border-danger/30">
            <div className="text-danger text-sm">{errorMsg}</div>
            <button onClick={runIntent} className="btn-secondary mt-3 text-sm">重试</button>
          </div>
        ) : null}

        {intentResult ? (
          <CollapsibleCard title="意图解析结果">
            <div className="code-block p-4 text-sm">
              <pre>{JSON.stringify(intentResult, null, 2)}</pre>
            </div>
          </CollapsibleCard>
        ) : null}

        {executionResult ? (
          <CollapsibleCard title="Skill 执行结果">
            <div className="code-block p-4 text-sm">
              <pre>{JSON.stringify(executionResult, null, 2)}</pre>
            </div>
          </CollapsibleCard>
        ) : null}

        {uiSchema ? (
          <div className="card">
            <div className="card-title">自动生成 UI 预览</div>
            <UIPreview schema={uiSchema} />
          </div>
        ) : null}
      </div>

      {/* Right Panel */}
      <div className="w-[280px] border-l border-border bg-bg-card p-4 space-y-4 overflow-auto">
        <div className="text-sm font-medium text-text-primary mb-2">任务信息</div>
        <div className="space-y-3">
          <InfoRow label="状态" value={step === 'idle' ? '待输入' : step === 'done' ? '已完成' : step === 'error' ? '失败' : '处理中'}
            valueClass={step === 'done' ? 'text-success' : step === 'error' ? 'text-danger' : step === 'idle' ? 'text-text-tertiary' : 'text-primary'} />
          <InfoRow label="耗时" value={elapsed > 0 ? `${elapsed}s` : '-'} />
          <InfoRow label="意图" value={intentResult?.intent || '-'} />
          <InfoRow label="UI类型" value={intentResult?.uiType || '-'} />
        </div>
        <div className="border-t border-border pt-3">
          <div className="text-sm font-medium text-text-primary mb-2">快捷帮助</div>
          <div className="text-xs text-text-tertiary space-y-1">
            <p>Enter 发送意图，Shift+Enter 换行</p>
            <p>输入自然语言描述业务需求</p>
            <p>系统自动解析意图并生成应用</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />;
}

function InfoRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-text-tertiary">{label}</span>
      <span className={`font-medium ${valueClass || 'text-text-primary'}`}>{value}</span>
    </div>
  );
}

function CollapsibleCard({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="card">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="card-title">{title}</div>
        <span className="text-text-tertiary text-sm">{open ? '▼' : '▶'}</span>
      </div>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

function UIPreview({ schema }: { schema: UISchema }) {
  return (
    <div className="bg-bg-body rounded-lg p-4">
      <div className="text-lg font-semibold text-text-primary mb-4">{schema.title}</div>
      <div className="space-y-4">
        {schema.components.map((comp: UIComponent, idx: number) => {
          if (comp.type === 'card') return <PreviewCard key={idx} comp={comp} />;
          if (comp.type === 'table') return <PreviewTable key={idx} comp={comp} />;
          if (comp.type === 'chart') return <PreviewChart key={idx} comp={comp} />;
          return <PreviewCard key={idx} comp={comp} />;
        })}
      </div>
    </div>
  );
}

function PreviewCard({ comp }: { comp: UIComponent }) {
  const d = comp.data as { value: number | string; label: string; unit?: string };
  return (
    <div className="bg-bg-code/5 rounded-lg p-4 border border-border">
      {comp.title && <div className="text-sm text-text-tertiary mb-1">{comp.title}</div>}
      <div className="text-2xl font-bold text-text-primary">{d.value}{d.unit || ''}</div>
      <div className="text-sm text-text-tertiary mt-1">{d.label}</div>
    </div>
  );
}

function PreviewTable({ comp }: { comp: UIComponent }) {
  const d = comp.data as { columns: { key: string; label: string }[]; rows: Record<string, unknown>[] };
  return (
    <div>
      {comp.title && <div className="text-sm font-medium text-text-primary mb-2">{comp.title}</div>}
      <table className="w-full text-sm">
        <thead><tr className="border-b border-border">
          {d.columns.map(c => <th key={c.key} className="py-2 px-3 text-text-tertiary text-left">{c.label}</th>)}
        </tr></thead>
        <tbody>{d.rows.map((row, i) => (
          <tr key={i} className="border-b border-border/50">
            {d.columns.map(c => <td key={c.key} className="py-2 px-3 text-text-primary">{String(row[c.key] ?? '')}</td>)}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function PreviewChart({ comp }: { comp: UIComponent }) {
  const d = comp.data as { chartType: string };
  return (
    <div className="bg-bg-code/5 rounded-lg p-4 border border-border text-center">
      {comp.title && <div className="text-sm font-medium text-text-primary mb-2">{comp.title}</div>}
      <div className="text-text-tertiary text-sm">[图表: {d.chartType}] — ECharts 渲染占位</div>
    </div>
  );
}