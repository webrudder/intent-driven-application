const BLOCKED_GLOBALS = ['fs', 'child_process', 'process', 'require', '__dirname', '__filename'];

export function validateJSON(str: string): { valid: boolean; error?: string } {
  try {
    JSON.parse(str);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: `Invalid JSON: ${(e as Error).message}` };
  }
}

export function validateURL(url: string): { valid: boolean; error?: string } {
  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export function validateSkillCode(code: string): { valid: boolean; error?: string } {
  for (const g of BLOCKED_GLOBALS) {
    const pattern = new RegExp(`(?:require\\s*\\(\\s*['"]${g}['"]\\s*\\)|\\b${g}\\b)`);
    if (pattern.test(code)) {
      return { valid: false, error: `Blocked API detected: ${g}. Skill code cannot access system-level modules.` };
    }
  }

  // Try to compile as a function body (new Function wraps code as function body)
  // Support both: bare expression/arrow function and named/anonymous function declaration
  try {
    // If code contains function declaration, wrap it to be valid as function body
    const wrappedCode = wrapSkillCode(code);
    new Function(wrappedCode);
  } catch (e) {
    return { valid: false, error: `Syntax error in skill code: ${(e as Error).message}` };
  }

  return { valid: true };
}

export function wrapSkillCode(code: string): string {
  // If code starts with "function" or "async function", it's a declaration
  // Wrap as: return (function(...) { ... })(params)
  // so new Function(code) treats it as a valid function body
  const trimmed = code.trim();

  if (/^(async\s+)?function\s*\(/.test(trimmed)) {
    // Anonymous function: function(params) { ... } or async function(params) { ... }
    return `return (${trimmed})(params);`;
  }

  if (/^(async\s+)?function\s+\w+\s*\(/.test(trimmed)) {
    // Named function: function myFunc(params) { ... } — declare and call
    const fnNameMatch = trimmed.match(/^(async\s+)?function\s+(\w+)\s*\(/);
    const fnName = fnNameMatch ? fnNameMatch[2] : 'fn';
    return `${trimmed}\nreturn ${fnName}(params);`;
  }

  // Arrow function or bare expression — return directly
  return `return (${trimmed});`;
}

export function validateNotEmpty(value: string, field: string): { valid: boolean; error?: string } {
  if (!value || value.trim().length === 0) {
    return { valid: false, error: `${field} cannot be empty` };
  }
  return { valid: true };
}