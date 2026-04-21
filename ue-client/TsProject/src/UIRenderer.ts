import type { UISchema, UIComponent } from './Types';

// UMG Widget types — these are UE-specific and will be provided by Puerts
// In actual UE deployment, import from UE module bindings
// For standalone TS compilation, we use interface stubs

interface UMGWidget {
  AddChild(child: UMGWidget): void;
  RemoveChild(child: UMGWidget): void;
  RemoveFromParent(): void;
}

interface UMGContainer extends UMGWidget {
  ClearChildren(): void;
  GetChildren(): UMGWidget[];
}

interface UMGTextBlock extends UMGWidget {
  SetText(text: string): void;
  SetFontSize(size: number): void;
  SetColor(color: { R: number; G: number; B: number; A: number }): void;
}

interface UMGBorder extends UMGWidget {
  SetBackgroundColor(color: { R: number; G: number; B: number; A: number }): void;
  SetPadding(padding: { Left: number; Right: number; Top: number; Bottom: number }): void;
  AddChild(child: UMGWidget): void;
}

interface UMGVerticalBox extends UMGContainer {}
interface UMGHorizontalBox extends UMGContainer {}
interface UMGOverlay extends UMGContainer {}

// Render UI Schema into a UMG container
export function renderSchema(schema: UISchema, container: UMGContainer): void {
  clearContainer(container);

  // Render page title
  const titleWidget = createTextBlock(schema.title, 24, { R: 1, G: 1, B: 1, A: 1 });
  container.AddChild(titleWidget);

  // Render each component
  for (const component of schema.components) {
    const widget = createComponent(component);
    if (widget) {
      container.AddChild(widget);
    }
  }
}

// Clear all children from a container
export function clearContainer(container: UMGContainer): void {
  container.ClearChildren();
}

// Create a component widget based on type
function createComponent(comp: UIComponent): UMGWidget | null {
  switch (comp.type) {
    case 'card':
      return createCardComponent(comp);
    case 'table':
      return createTableComponent(comp);
    case 'chart':
      return createChartComponent(comp);
    case 'form':
      return createFormComponent(comp);
    default:
      return null;
  }
}

// Card component — displays a single value/statistic
function createCardComponent(comp: UIComponent): UMGWidget {
  const data = comp.data as { value: number | string; label: string; unit?: string };
  const cardBorder = createBorder({ R: 0.06, G: 0.13, B: 0.38, A: 1 });
  const vbox = createVerticalBox();

  // Title
  if (comp.title) {
    vbox.AddChild(createTextBlock(comp.title, 16, { R: 0.8, G: 0.8, B: 0.8, A: 1 }));
  }

  // Value
  const valueText = `${data.value}${data.unit || ''}`;
  vbox.AddChild(createTextBlock(valueText, 28, { R: 1, G: 1, B: 1, A: 1 }));

  // Label
  vbox.AddChild(createTextBlock(data.label, 14, { R: 0.6, G: 0.6, B: 0.6, A: 1 }));

  cardBorder.AddChild(vbox);
  return cardBorder;
}

// Table component — displays a list of items
function createTableComponent(comp: UIComponent): UMGWidget {
  const data = comp.data as { columns: { key: string; label: string }[]; rows: Record<string, unknown>[] };
  const vbox = createVerticalBox();

  // Title
  if (comp.title) {
    vbox.AddChild(createTextBlock(comp.title, 18, { R: 1, G: 1, B: 1, A: 1 }));
  }

  // Header row
  const headerRow = createHorizontalBox();
  for (const col of data.columns) {
    headerRow.AddChild(createTextBlock(col.label, 14, { R: 0.7, G: 0.7, B: 0.7, A: 1 }));
  }
  vbox.AddChild(headerRow);

  // Data rows
  for (const row of data.rows) {
    const dataRow = createHorizontalBox();
    for (const col of data.columns) {
      const cellValue = String(row[col.key] ?? '');
      dataRow.AddChild(createTextBlock(cellValue, 14, { R: 1, G: 1, B: 1, A: 1 }));
    }
    vbox.AddChild(dataRow);
  }

  return vbox;
}

// Chart component — placeholder for future ECharts UE integration
function createChartComponent(comp: UIComponent): UMGWidget {
  const data = comp.data as { chartType: string; series: unknown[]; categories: string[] };
  const border = createBorder({ R: 0.06, G: 0.13, B: 0.38, A: 1 });
  const vbox = createVerticalBox();

  if (comp.title) {
    vbox.AddChild(createTextBlock(comp.title, 18, { R: 1, G: 1, B: 1, A: 1 }));
  }

  // Placeholder: chart rendering requires ECharts UE plugin
  vbox.AddChild(createTextBlock(`[图表: ${data.chartType}] — 需要ECharts UE插件支持`, 14, { R: 0.6, G: 0.6, B: 0.6, A: 1 }));

  border.AddChild(vbox);
  return border;
}

// Form component — placeholder for form rendering
function createFormComponent(comp: UIComponent): UMGWidget {
  const data = comp.data as { fields: { key: string; label: string; type: string; required: boolean }[] };
  const vbox = createVerticalBox();

  if (comp.title) {
    vbox.AddChild(createTextBlock(comp.title, 18, { R: 1, G: 1, B: 1, A: 1 }));
  }

  for (const field of data.fields) {
    const labelText = `${field.label}${field.required ? ' *' : ''}`;
    vbox.AddChild(createTextBlock(labelText, 14, { R: 0.8, G: 0.8, B: 0.8, A: 1 }));
    // Placeholder: actual input widget creation requires UMG EditableTextBox
    vbox.AddChild(createTextBlock(`[${field.type} 输入框]`, 12, { R: 0.5, G: 0.5, B: 0.5, A: 1 }));
  }

  return vbox;
}

// ===== Widget Creation Helpers =====
// These functions create UMG widgets — in actual UE deployment,
// they would use UE.CreateWidget() or Puerts UE bindings

function createTextBlock(text: string, fontSize: number, color: { R: number; G: number; B: number; A: number }): UMGTextBlock {
  // Stub: in UE, this would be WidgetTree.ConstructWidget(TextBlock)
  const widget: Partial<UMGTextBlock> = {};
  widget.SetText = (t: string) => { };
  widget.SetFontSize = (s: number) => { };
  widget.SetColor = (c: typeof color) => { };
  widget.AddChild = (c: UMGWidget) => { };
  widget.RemoveChild = (c: UMGWidget) => { };
  widget.RemoveFromParent = () => { };
  // Apply initial values
  widget.SetText(text);
  widget.SetFontSize(fontSize);
  widget.SetColor(color);
  return widget as UMGTextBlock;
}

function createBorder(color: { R: number; G: number; B: number; A: number }): UMGBorder {
  const widget: Partial<UMGBorder> = {};
  widget.SetBackgroundColor = (c: typeof color) => { };
  widget.SetPadding = (p: { Left: number; Right: number; Top: number; Bottom: number }) => { };
  widget.AddChild = (c: UMGWidget) => { };
  widget.RemoveChild = (c: UMGWidget) => { };
  widget.RemoveFromParent = () => { };
  widget.SetBackgroundColor(color);
  widget.SetPadding({ Left: 16, Right: 16, Top: 12, Bottom: 12 });
  return widget as UMGBorder;
}

function createVerticalBox(): UMGVerticalBox {
  const widget: Partial<UMGVerticalBox> = {};
  widget.ClearChildren = () => { };
  widget.GetChildren = () => [] as UMGWidget[];
  widget.AddChild = (c: UMGWidget) => { };
  widget.RemoveChild = (c: UMGWidget) => { };
  widget.RemoveFromParent = () => { };
  return widget as UMGVerticalBox;
}

function createHorizontalBox(): UMGHorizontalBox {
  const widget: Partial<UMGHorizontalBox> = {};
  widget.ClearChildren = () => { };
  widget.GetChildren = () => [] as UMGWidget[];
  widget.AddChild = (c: UMGWidget) => { };
  widget.RemoveChild = (c: UMGWidget) => { };
  widget.RemoveFromParent = () => { };
  return widget as UMGHorizontalBox;
}