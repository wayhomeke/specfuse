import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join, basename } from 'node:path'
import { parse } from 'yaml'

const TEMPLATES_DIR = join(import.meta.dirname, '..', 'src', 'design-md', 'templates')
const OUTPUT_DIR = join(import.meta.dirname, '..', 'docs', 'samples')

interface Template {
  id: string
  name: string
  category: string
  intent: { mood: string; density: string; philosophy: string }
  dimensions: { colorTemp: number; lightness: number; density: number; borderRadius: number; tone: number }
  anchors: {
    colors: { primary: string; auxiliary: string[] }
    typography: { baseSize: string; scale: number }
    spacing: { unit: string }
    radius: { base: string }
  }
  structure: { requiredSections: string[]; componentTokens: string[] }
}

// --- Color Utilities ---

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hslToHex(h: number, s: number, l: number): string {
  const s1 = s / 100, l1 = l / 100
  const c = (1 - Math.abs(2 * l1 - 1)) * s1
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = l1 - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function generateShades(hex: string): Record<string, string> {
  const [h, s] = hexToHsl(hex)
  const levels = [
    ['50', 97], ['100', 93], ['200', 86], ['300', 75], ['400', 62],
    ['500', 50], ['600', 40], ['700', 32], ['800', 24], ['900', 15]
  ] as const
  const shades: Record<string, string> = {}
  for (const [key, l] of levels) {
    shades[key] = hslToHex(h, s, l)
  }
  return shades
}

// --- CSS Generation ---

function generateCssVariables(t: Template): string {
  const primaryShades = generateShades(t.anchors.colors.primary)
  const auxShades = generateShades(t.anchors.colors.auxiliary[0])
  const baseSize = parseInt(t.anchors.typography.baseSize)
  const scale = t.anchors.typography.scale
  const spacingUnit = parseInt(t.anchors.spacing.unit)
  const radiusBase = parseInt(t.anchors.radius.base)

  const fontSizes = {
    xs: baseSize / scale / scale,
    sm: baseSize / scale,
    base: baseSize,
    lg: baseSize * scale,
    xl: baseSize * scale * scale,
    '2xl': baseSize * scale * scale * scale,
    '3xl': baseSize * scale * scale * scale * scale,
  }

  let vars = `:root {\n`
  vars += `  --color-primary: ${t.anchors.colors.primary};\n`
  for (const [k, v] of Object.entries(primaryShades)) vars += `  --color-primary-${k}: ${v};\n`
  vars += `  --color-auxiliary-1: ${t.anchors.colors.auxiliary[0]};\n`
  for (const [k, v] of Object.entries(auxShades)) vars += `  --color-auxiliary-1-${k}: ${v};\n`

  vars += `\n`
  for (const [k, v] of Object.entries(fontSizes)) vars += `  --font-size-${k}: ${v.toFixed(1)}px;\n`
  vars += `\n`
  const spacingMultipliers = [1, 2, 3, 4, 6, 8, 12, 16]
  for (const m of spacingMultipliers) vars += `  --spacing-${m}: ${spacingUnit * m}px;\n`
  vars += `\n`
  vars += `  --radius-sm: ${Math.round(radiusBase * 0.5)}px;\n`
  vars += `  --radius-md: ${radiusBase}px;\n`
  vars += `  --radius-lg: ${radiusBase * 2}px;\n`
  vars += `  --radius-xl: ${radiusBase * 3}px;\n`
  vars += `\n`
  vars += `  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);\n`
  vars += `  --shadow-md: 0 4px 6px rgba(0,0,0,0.07);\n`
  vars += `  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);\n`
  vars += `  --shadow-xl: 0 20px 25px rgba(0,0,0,0.15);\n`
  vars += `}\n`
  return vars
}

// --- Component Renderers ---

const COMPONENTS: Record<string, () => string> = {
  button: () => `
    <div class="component-group">
      <h4>Button</h4>
      <div class="component-row">
        <button class="btn btn-primary">Primary</button>
        <button class="btn btn-secondary">Secondary</button>
        <button class="btn btn-ghost">Ghost</button>
        <button class="btn btn-primary" disabled>Disabled</button>
      </div>
    </div>`,
  input: () => `
    <div class="component-group">
      <h4>Input</h4>
      <div class="component-row">
        <input type="text" class="input" placeholder="Normal input" />
        <input type="text" class="input input-error" placeholder="Error state" />
      </div>
    </div>`,
  card: () => `
    <div class="component-group">
      <h4>Card</h4>
      <div class="component-row">
        <div class="card">
          <div class="card-header">Card Title</div>
          <div class="card-body">Card content goes here. This demonstrates the card component with proper spacing and elevation.</div>
          <div class="card-footer">Footer action</div>
        </div>
      </div>
    </div>`,
  badge: () => `
    <div class="component-group">
      <h4>Badge</h4>
      <div class="component-row">
        <span class="badge badge-info">Info</span>
        <span class="badge badge-success">Success</span>
        <span class="badge badge-warning">Warning</span>
        <span class="badge badge-error">Error</span>
      </div>
    </div>`,
  table: () => `
    <div class="component-group">
      <h4>Table</h4>
      <table class="table">
        <thead><tr><th>Name</th><th>Status</th><th>Value</th></tr></thead>
        <tbody>
          <tr><td>Item Alpha</td><td><span class="badge badge-success">Active</span></td><td>1,234</td></tr>
          <tr><td>Item Beta</td><td><span class="badge badge-warning">Pending</span></td><td>567</td></tr>
          <tr><td>Item Gamma</td><td><span class="badge badge-error">Error</span></td><td>89</td></tr>
        </tbody>
      </table>
    </div>`,
  sidebar: () => `
    <div class="component-group">
      <h4>Sidebar</h4>
      <div class="sidebar-demo">
        <nav class="sidebar">
          <div class="sidebar-item active">Dashboard</div>
          <div class="sidebar-item">Analytics</div>
          <div class="sidebar-item">Settings</div>
          <div class="sidebar-item">Users</div>
        </nav>
      </div>
    </div>`,
  modal: () => `
    <div class="component-group">
      <h4>Modal</h4>
      <div class="modal-demo">
        <div class="modal">
          <div class="modal-header">Confirm Action</div>
          <div class="modal-body">Are you sure you want to proceed? This action cannot be undone.</div>
          <div class="modal-footer">
            <button class="btn btn-ghost">Cancel</button>
            <button class="btn btn-primary">Confirm</button>
          </div>
        </div>
      </div>
    </div>`,
  avatar: () => `
    <div class="component-group">
      <h4>Avatar</h4>
      <div class="component-row">
        <div class="avatar avatar-sm">A</div>
        <div class="avatar avatar-md">B</div>
        <div class="avatar avatar-lg">C</div>
      </div>
    </div>`,
  alert: () => `
    <div class="component-group">
      <h4>Alert</h4>
      <div class="alert alert-info">Informational message — something to note.</div>
      <div class="alert alert-success">Success — operation completed.</div>
      <div class="alert alert-warning">Warning — please review before continuing.</div>
      <div class="alert alert-error">Error — something went wrong.</div>
    </div>`,
  tooltip: () => `
    <div class="component-group">
      <h4>Tooltip</h4>
      <div class="component-row">
        <div class="tooltip-demo">
          <span class="tooltip-trigger">Hover me</span>
          <div class="tooltip-content">Tooltip text here</div>
        </div>
      </div>
    </div>`,
  navigation: () => `
    <div class="component-group">
      <h4>Navigation</h4>
      <nav class="nav-bar">
        <div class="nav-brand">Brand</div>
        <div class="nav-links">
          <a class="nav-link active">Home</a>
          <a class="nav-link">Products</a>
          <a class="nav-link">About</a>
          <a class="nav-link">Contact</a>
        </div>
      </nav>
    </div>`,
  'hero-section': () => `
    <div class="component-group">
      <h4>Hero Section</h4>
      <div class="hero">
        <h2 class="hero-title">Build Something Amazing</h2>
        <p class="hero-subtitle">A powerful platform for modern teams to create, collaborate, and ship faster.</p>
        <div class="component-row">
          <button class="btn btn-primary">Get Started</button>
          <button class="btn btn-ghost">Learn More</button>
        </div>
      </div>
    </div>`,
  footer: () => `
    <div class="component-group">
      <h4>Footer</h4>
      <footer class="site-footer">
        <div class="footer-cols">
          <div class="footer-col"><strong>Product</strong><br/>Features<br/>Pricing<br/>Docs</div>
          <div class="footer-col"><strong>Company</strong><br/>About<br/>Blog<br/>Careers</div>
          <div class="footer-col"><strong>Support</strong><br/>Help<br/>Status<br/>Contact</div>
        </div>
        <div class="footer-bottom">&copy; 2026 Company. All rights reserved.</div>
      </footer>
    </div>`,
  testimonial: () => `
    <div class="component-group">
      <h4>Testimonial</h4>
      <div class="testimonial">
        <blockquote class="testimonial-quote">"This product transformed how our team works. Incredible experience from day one."</blockquote>
        <div class="testimonial-author">— Jane Smith, CTO at TechCorp</div>
      </div>
    </div>`,
  marquee: () => `
    <div class="component-group">
      <h4>Marquee</h4>
      <div class="marquee">
        <div class="marquee-content">LAUNCH DAY &bull; NEW FEATURE &bull; LIMITED OFFER &bull; LAUNCH DAY &bull; NEW FEATURE &bull; LIMITED OFFER &bull;</div>
      </div>
    </div>`,
  'product-card': () => `
    <div class="component-group">
      <h4>Product Card</h4>
      <div class="product-card">
        <div class="product-image"></div>
        <div class="product-info">
          <div class="product-name">Premium Headphones</div>
          <div class="product-price">$299.00</div>
          <button class="btn btn-primary">Add to Cart</button>
        </div>
      </div>
    </div>`,
  'price-tag': () => `
    <div class="component-group">
      <h4>Price Tag</h4>
      <div class="component-row">
        <span class="price-tag">$19.99</span>
        <span class="price-tag price-tag-sale"><s>$49.99</s> $29.99</span>
        <span class="price-tag price-tag-free">Free</span>
      </div>
    </div>`,
  rating: () => `
    <div class="component-group">
      <h4>Rating</h4>
      <div class="component-row">
        <div class="rating">&#9733;&#9733;&#9733;&#9733;&#9734; <span class="rating-text">4.0 (128 reviews)</span></div>
      </div>
    </div>`,
  breadcrumb: () => `
    <div class="component-group">
      <h4>Breadcrumb</h4>
      <nav class="breadcrumb">
        <a class="breadcrumb-item">Home</a>
        <span class="breadcrumb-sep">/</span>
        <a class="breadcrumb-item">Category</a>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-item current">Current Page</span>
      </nav>
    </div>`,
  'feed-item': () => `
    <div class="component-group">
      <h4>Feed Item</h4>
      <div class="feed-item">
        <div class="avatar avatar-sm">U</div>
        <div class="feed-content">
          <div class="feed-author">User Name <span class="feed-time">2h ago</span></div>
          <div class="feed-text">Just shipped a new feature! Really excited about how the team came together on this one.</div>
          <div class="feed-actions">
            <span class="feed-action">&#9825; 42</span>
            <span class="feed-action">&#8618; 5</span>
            <span class="feed-action">&#9741; Share</span>
          </div>
        </div>
      </div>
    </div>`,
  comment: () => `
    <div class="component-group">
      <h4>Comment</h4>
      <div class="comment">
        <div class="avatar avatar-sm">A</div>
        <div class="comment-body">
          <div class="comment-author">Alice</div>
          <div class="comment-text">Great work! This looks amazing.</div>
          <div class="comment-meta">2 hours ago &middot; Reply</div>
        </div>
      </div>
    </div>`,
  'player-control': () => `
    <div class="component-group">
      <h4>Player Control</h4>
      <div class="player">
        <div class="player-info">
          <div class="player-title">Track Name</div>
          <div class="player-artist">Artist Name</div>
        </div>
        <div class="player-controls">
          <button class="player-btn">&#9198;</button>
          <button class="player-btn player-btn-main">&#9654;</button>
          <button class="player-btn">&#9197;</button>
        </div>
        <div class="player-progress"><div class="player-progress-bar"></div></div>
      </div>
    </div>`,
  'media-card': () => `
    <div class="component-group">
      <h4>Media Card</h4>
      <div class="media-card">
        <div class="media-card-image"></div>
        <div class="media-card-info">
          <div class="media-card-title">Album Title</div>
          <div class="media-card-subtitle">12 tracks &middot; 45 min</div>
        </div>
      </div>
    </div>`,
  'code-block': () => `
    <div class="component-group">
      <h4>Code Block</h4>
      <pre class="code-block"><code>const greeting = (name: string) =&gt; {
  return \`Hello, \${name}!\`
}

console.log(greeting("World"))</code></pre>
    </div>`,
  blockquote: () => `
    <div class="component-group">
      <h4>Blockquote</h4>
      <blockquote class="blockquote">
        "The best way to predict the future is to invent it." — Alan Kay
      </blockquote>
    </div>`,
  tab: () => `
    <div class="component-group">
      <h4>Tabs</h4>
      <div class="tabs">
        <div class="tab active">Overview</div>
        <div class="tab">Details</div>
        <div class="tab">Reviews</div>
        <div class="tab">Related</div>
      </div>
    </div>`,
  chart: () => `
    <div class="component-group">
      <h4>Chart (placeholder)</h4>
      <div class="chart-demo">
        <div class="chart-bars">
          <div class="chart-bar" style="height:60%"></div>
          <div class="chart-bar" style="height:85%"></div>
          <div class="chart-bar" style="height:45%"></div>
          <div class="chart-bar" style="height:70%"></div>
          <div class="chart-bar" style="height:90%"></div>
          <div class="chart-bar" style="height:55%"></div>
        </div>
        <div class="chart-labels">
          <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>
      </div>
    </div>`,
  'stat-card': () => `
    <div class="component-group">
      <h4>Stat Card</h4>
      <div class="component-row">
        <div class="stat-card"><div class="stat-value">12.4K</div><div class="stat-label">Users</div></div>
        <div class="stat-card"><div class="stat-value">$84.2K</div><div class="stat-label">Revenue</div></div>
        <div class="stat-card"><div class="stat-value">99.9%</div><div class="stat-label">Uptime</div></div>
      </div>
    </div>`,
  'status-indicator': () => `
    <div class="component-group">
      <h4>Status Indicator</h4>
      <div class="component-row">
        <span class="status-indicator status-ok">&#9679; Operational</span>
        <span class="status-indicator status-warn">&#9679; Degraded</span>
        <span class="status-indicator status-error">&#9679; Outage</span>
      </div>
    </div>`,
  select: () => `
    <div class="component-group">
      <h4>Select</h4>
      <select class="select">
        <option>Choose an option</option>
        <option>Option A</option>
        <option>Option B</option>
        <option>Option C</option>
      </select>
    </div>`,
  checkbox: () => `
    <div class="component-group">
      <h4>Checkbox</h4>
      <div class="checkbox-group">
        <label class="checkbox-label"><input type="checkbox" checked /> Accept terms</label>
        <label class="checkbox-label"><input type="checkbox" /> Subscribe to newsletter</label>
      </div>
    </div>`,
  radio: () => `
    <div class="component-group">
      <h4>Radio</h4>
      <div class="radio-group">
        <label class="radio-label"><input type="radio" name="plan" checked /> Free</label>
        <label class="radio-label"><input type="radio" name="plan" /> Pro</label>
        <label class="radio-label"><input type="radio" name="plan" /> Enterprise</label>
      </div>
    </div>`,
  stepper: () => `
    <div class="component-group">
      <h4>Stepper</h4>
      <div class="stepper">
        <div class="step completed">1. Account</div>
        <div class="step active">2. Details</div>
        <div class="step">3. Review</div>
        <div class="step">4. Submit</div>
      </div>
    </div>`,
  toggle: () => `
    <div class="component-group">
      <h4>Toggle</h4>
      <div class="component-row">
        <label class="toggle"><input type="checkbox" checked /><span class="toggle-slider"></span> Enabled</label>
        <label class="toggle"><input type="checkbox" /><span class="toggle-slider"></span> Disabled</label>
      </div>
    </div>`,
  'bottom-sheet': () => `
    <div class="component-group">
      <h4>Bottom Sheet</h4>
      <div class="bottom-sheet-demo">
        <div class="bottom-sheet">
          <div class="bottom-sheet-handle"></div>
          <div class="bottom-sheet-content">
            <div class="bottom-sheet-title">Actions</div>
            <div class="bottom-sheet-item">Share</div>
            <div class="bottom-sheet-item">Save</div>
            <div class="bottom-sheet-item">Report</div>
          </div>
        </div>
      </div>
    </div>`,
  'tab-bar': () => `
    <div class="component-group">
      <h4>Tab Bar (Mobile)</h4>
      <div class="tab-bar">
        <div class="tab-bar-item active">&#9750;<br/>Home</div>
        <div class="tab-bar-item">&#9906;<br/>Search</div>
        <div class="tab-bar-item">&#9829;<br/>Likes</div>
        <div class="tab-bar-item">&#9787;<br/>Profile</div>
      </div>
    </div>`,
  'list-item': () => `
    <div class="component-group">
      <h4>List Item</h4>
      <div class="list">
        <div class="list-item"><span>Notifications</span><span class="list-item-meta">&gt;</span></div>
        <div class="list-item"><span>Privacy</span><span class="list-item-meta">&gt;</span></div>
        <div class="list-item"><span>About</span><span class="list-item-meta">&gt;</span></div>
      </div>
    </div>`,
  dropdown: () => `
    <div class="component-group">
      <h4>Dropdown</h4>
      <div class="dropdown-demo">
        <button class="btn btn-secondary">Options &#9662;</button>
        <div class="dropdown-menu">
          <div class="dropdown-item">Edit</div>
          <div class="dropdown-item">Duplicate</div>
          <div class="dropdown-item dropdown-item-danger">Delete</div>
        </div>
      </div>
    </div>`,
}

// --- Page CSS (component styles using variables) ---

function getComponentStyles(isDark: boolean): string {
  const bg = isDark ? '#0d1117' : '#ffffff'
  const fg = isDark ? '#e6edf3' : '#1a1a1a'
  const fgMuted = isDark ? '#8b949e' : '#666666'
  const border = isDark ? '#30363d' : '#e5e7eb'
  const surfaceBg = isDark ? '#161b22' : '#f9fafb'

  return `
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: var(--font-size-base);
  line-height: 1.6;
  color: ${fg};
  background: ${bg};
  padding: var(--spacing-8);
}
h1, h2, h3, h4, h5, h6 { font-weight: 600; line-height: 1.3; }
.page-header { margin-bottom: var(--spacing-12); border-bottom: 1px solid ${border}; padding-bottom: var(--spacing-8); }
.page-title { font-size: var(--font-size-3xl); margin-bottom: var(--spacing-2); }
.page-meta { color: ${fgMuted}; font-size: var(--font-size-sm); }
.page-intent { margin-top: var(--spacing-4); font-style: italic; color: ${fgMuted}; }
.section { margin-bottom: var(--spacing-16); }
.section-title { font-size: var(--font-size-xl); margin-bottom: var(--spacing-6); color: var(--color-primary); }

/* Colors */
.color-grid { display: flex; flex-wrap: wrap; gap: var(--spacing-3); }
.color-group { margin-bottom: var(--spacing-6); }
.color-group-label { font-size: var(--font-size-sm); font-weight: 600; margin-bottom: var(--spacing-2); }
.color-swatch { width: 60px; height: 60px; border-radius: var(--radius-md); display: flex; align-items: flex-end; justify-content: center; padding: 4px; font-size: 10px; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }

/* Typography */
.type-scale { display: flex; flex-direction: column; gap: var(--spacing-4); }
.type-row { display: flex; align-items: baseline; gap: var(--spacing-4); }
.type-label { font-size: var(--font-size-xs); color: ${fgMuted}; min-width: 80px; }

/* Spacing */
.spacing-grid { display: flex; flex-direction: column; gap: var(--spacing-3); }
.spacing-row { display: flex; align-items: center; gap: var(--spacing-4); }
.spacing-bar { height: 24px; background: var(--color-primary-200); border-radius: var(--radius-sm); }
.spacing-label { font-size: var(--font-size-xs); color: ${fgMuted}; min-width: 80px; }

/* Radius */
.radius-grid { display: flex; gap: var(--spacing-6); flex-wrap: wrap; }
.radius-box { width: 80px; height: 80px; background: var(--color-primary-100); border: 2px solid var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: var(--font-size-xs); color: ${fgMuted}; }

/* Components shared */
.component-group { margin-bottom: var(--spacing-8); }
.component-group h4 { font-size: var(--font-size-base); margin-bottom: var(--spacing-4); color: ${fgMuted}; }
.component-row { display: flex; flex-wrap: wrap; gap: var(--spacing-4); align-items: center; }

/* Button */
.btn { padding: var(--spacing-2) var(--spacing-4); border-radius: var(--radius-md); font-size: var(--font-size-sm); font-weight: 500; cursor: pointer; border: none; transition: all 0.15s; }
.btn-primary { background: var(--color-primary); color: white; }
.btn-primary:hover { background: var(--color-primary-600); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary { background: transparent; color: var(--color-primary); border: 1px solid var(--color-primary); }
.btn-ghost { background: transparent; color: ${fg}; border: 1px solid ${border}; }

/* Input */
.input { padding: var(--spacing-2) var(--spacing-3); border-radius: var(--radius-md); border: 1px solid ${border}; font-size: var(--font-size-base); background: ${bg}; color: ${fg}; width: 220px; }
.input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-100); }
.input-error { border-color: #ef4444; }

/* Card */
.card { border: 1px solid ${border}; border-radius: var(--radius-lg); overflow: hidden; max-width: 320px; box-shadow: var(--shadow-sm); }
.card-header { padding: var(--spacing-4); font-weight: 600; border-bottom: 1px solid ${border}; }
.card-body { padding: var(--spacing-4); color: ${fgMuted}; }
.card-footer { padding: var(--spacing-3) var(--spacing-4); border-top: 1px solid ${border}; font-size: var(--font-size-sm); color: var(--color-primary); }

/* Badge */
.badge { padding: var(--spacing-1) var(--spacing-2); border-radius: var(--radius-sm); font-size: var(--font-size-xs); font-weight: 500; }
.badge-info { background: var(--color-primary-100); color: var(--color-primary-700); }
.badge-success { background: #dcfce7; color: #166534; }
.badge-warning { background: #fef3c7; color: #92400e; }
.badge-error { background: #fecaca; color: #991b1b; }

/* Table */
.table { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
.table th, .table td { padding: var(--spacing-3); text-align: left; border-bottom: 1px solid ${border}; }
.table th { font-weight: 600; background: ${surfaceBg}; }

/* Sidebar */
.sidebar-demo { max-width: 200px; }
.sidebar { background: ${surfaceBg}; border-radius: var(--radius-md); padding: var(--spacing-2); }
.sidebar-item { padding: var(--spacing-2) var(--spacing-3); border-radius: var(--radius-sm); font-size: var(--font-size-sm); cursor: pointer; }
.sidebar-item.active { background: var(--color-primary-100); color: var(--color-primary-700); font-weight: 500; }

/* Modal */
.modal-demo { background: rgba(0,0,0,0.3); padding: var(--spacing-8); border-radius: var(--radius-md); display: flex; justify-content: center; }
.modal { background: ${bg}; border-radius: var(--radius-lg); box-shadow: var(--shadow-xl); max-width: 360px; width: 100%; }
.modal-header { padding: var(--spacing-4); font-weight: 600; border-bottom: 1px solid ${border}; }
.modal-body { padding: var(--spacing-4); color: ${fgMuted}; }
.modal-footer { padding: var(--spacing-3) var(--spacing-4); border-top: 1px solid ${border}; display: flex; gap: var(--spacing-3); justify-content: flex-end; }

/* Avatar */
.avatar { border-radius: 50%; background: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; }
.avatar-sm { width: 32px; height: 32px; font-size: var(--font-size-xs); }
.avatar-md { width: 40px; height: 40px; font-size: var(--font-size-sm); }
.avatar-lg { width: 56px; height: 56px; font-size: var(--font-size-lg); }

/* Alert */
.alert { padding: var(--spacing-3) var(--spacing-4); border-radius: var(--radius-md); font-size: var(--font-size-sm); margin-bottom: var(--spacing-3); }
.alert-info { background: var(--color-primary-100); color: var(--color-primary-700); border-left: 3px solid var(--color-primary); }
.alert-success { background: #dcfce7; color: #166534; border-left: 3px solid #22c55e; }
.alert-warning { background: #fef3c7; color: #92400e; border-left: 3px solid #f59e0b; }
.alert-error { background: #fecaca; color: #991b1b; border-left: 3px solid #ef4444; }

/* Tooltip */
.tooltip-demo { position: relative; display: inline-block; }
.tooltip-trigger { padding: var(--spacing-2) var(--spacing-3); background: ${surfaceBg}; border-radius: var(--radius-sm); cursor: help; font-size: var(--font-size-sm); }
.tooltip-content { position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); margin-bottom: 8px; padding: var(--spacing-1) var(--spacing-2); background: ${isDark ? '#e6edf3' : '#1a1a1a'}; color: ${isDark ? '#0d1117' : '#ffffff'}; font-size: var(--font-size-xs); border-radius: var(--radius-sm); white-space: nowrap; }

/* Navigation */
.nav-bar { display: flex; align-items: center; justify-content: space-between; padding: var(--spacing-3) var(--spacing-4); background: ${surfaceBg}; border-radius: var(--radius-md); }
.nav-brand { font-weight: 700; font-size: var(--font-size-lg); color: var(--color-primary); }
.nav-links { display: flex; gap: var(--spacing-4); }
.nav-link { font-size: var(--font-size-sm); color: ${fgMuted}; text-decoration: none; cursor: pointer; }
.nav-link.active { color: var(--color-primary); font-weight: 500; }

/* Hero */
.hero { text-align: center; padding: var(--spacing-16) var(--spacing-8); background: ${surfaceBg}; border-radius: var(--radius-lg); }
.hero-title { font-size: var(--font-size-3xl); margin-bottom: var(--spacing-4); }
.hero-subtitle { font-size: var(--font-size-lg); color: ${fgMuted}; margin-bottom: var(--spacing-8); max-width: 480px; margin-left: auto; margin-right: auto; }
.hero .component-row { justify-content: center; }

/* Footer */
.site-footer { background: ${surfaceBg}; padding: var(--spacing-8); border-radius: var(--radius-md); }
.footer-cols { display: flex; gap: var(--spacing-8); margin-bottom: var(--spacing-6); }
.footer-col { font-size: var(--font-size-sm); color: ${fgMuted}; line-height: 2; }
.footer-bottom { font-size: var(--font-size-xs); color: ${fgMuted}; border-top: 1px solid ${border}; padding-top: var(--spacing-4); }

/* Testimonial */
.testimonial { background: ${surfaceBg}; padding: var(--spacing-6); border-radius: var(--radius-lg); border-left: 4px solid var(--color-primary); }
.testimonial-quote { font-size: var(--font-size-lg); font-style: italic; margin-bottom: var(--spacing-4); }
.testimonial-author { font-size: var(--font-size-sm); color: ${fgMuted}; }

/* Marquee */
.marquee { overflow: hidden; background: var(--color-primary); color: white; padding: var(--spacing-3); border-radius: var(--radius-md); }
.marquee-content { white-space: nowrap; animation: marquee 10s linear infinite; font-weight: 700; font-size: var(--font-size-lg); }
@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

/* Product Card */
.product-card { border: 1px solid ${border}; border-radius: var(--radius-lg); overflow: hidden; max-width: 240px; }
.product-image { height: 160px; background: linear-gradient(135deg, var(--color-primary-100), var(--color-primary-200)); }
.product-info { padding: var(--spacing-4); }
.product-name { font-weight: 600; margin-bottom: var(--spacing-2); }
.product-price { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-primary); margin-bottom: var(--spacing-3); }

/* Price Tag */
.price-tag { font-weight: 700; font-size: var(--font-size-lg); padding: var(--spacing-1) var(--spacing-3); background: ${surfaceBg}; border-radius: var(--radius-sm); }
.price-tag-sale { color: #ef4444; }
.price-tag-free { color: #22c55e; }

/* Rating */
.rating { color: #f59e0b; font-size: var(--font-size-lg); }
.rating-text { font-size: var(--font-size-sm); color: ${fgMuted}; }

/* Breadcrumb */
.breadcrumb { display: flex; align-items: center; gap: var(--spacing-2); font-size: var(--font-size-sm); }
.breadcrumb-item { color: var(--color-primary); cursor: pointer; text-decoration: none; }
.breadcrumb-item.current { color: ${fg}; font-weight: 500; }
.breadcrumb-sep { color: ${fgMuted}; }

/* Feed Item */
.feed-item { display: flex; gap: var(--spacing-3); padding: var(--spacing-4); border: 1px solid ${border}; border-radius: var(--radius-md); }
.feed-content { flex: 1; }
.feed-author { font-weight: 600; font-size: var(--font-size-sm); }
.feed-time { font-weight: 400; color: ${fgMuted}; }
.feed-text { margin: var(--spacing-2) 0; }
.feed-actions { display: flex; gap: var(--spacing-4); font-size: var(--font-size-sm); color: ${fgMuted}; }
.feed-action { cursor: pointer; }

/* Comment */
.comment { display: flex; gap: var(--spacing-3); padding: var(--spacing-3); }
.comment-author { font-weight: 600; font-size: var(--font-size-sm); }
.comment-text { margin: var(--spacing-1) 0; }
.comment-meta { font-size: var(--font-size-xs); color: ${fgMuted}; }

/* Player */
.player { background: ${surfaceBg}; padding: var(--spacing-4); border-radius: var(--radius-lg); }
.player-title { font-weight: 600; }
.player-artist { font-size: var(--font-size-sm); color: ${fgMuted}; }
.player-controls { display: flex; align-items: center; justify-content: center; gap: var(--spacing-4); margin: var(--spacing-4) 0; }
.player-btn { background: none; border: none; font-size: var(--font-size-lg); cursor: pointer; color: ${fg}; }
.player-btn-main { font-size: var(--font-size-2xl); color: var(--color-primary); }
.player-progress { height: 4px; background: ${border}; border-radius: 2px; }
.player-progress-bar { height: 100%; width: 40%; background: var(--color-primary); border-radius: 2px; }

/* Media Card */
.media-card { border-radius: var(--radius-lg); overflow: hidden; max-width: 180px; }
.media-card-image { height: 180px; background: linear-gradient(135deg, var(--color-primary-200), var(--color-auxiliary-1-200)); }
.media-card-info { padding: var(--spacing-3); }
.media-card-title { font-weight: 600; font-size: var(--font-size-sm); }
.media-card-subtitle { font-size: var(--font-size-xs); color: ${fgMuted}; }

/* Code Block */
.code-block { background: ${isDark ? '#1e1e2e' : '#f5f5f5'}; padding: var(--spacing-4); border-radius: var(--radius-md); font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: var(--font-size-sm); overflow-x: auto; line-height: 1.7; }

/* Blockquote */
.blockquote { border-left: 4px solid var(--color-primary); padding: var(--spacing-4) var(--spacing-6); font-style: italic; color: ${fgMuted}; background: ${surfaceBg}; border-radius: 0 var(--radius-md) var(--radius-md) 0; }

/* Tabs */
.tabs { display: flex; gap: 0; border-bottom: 2px solid ${border}; }
.tab { padding: var(--spacing-2) var(--spacing-4); font-size: var(--font-size-sm); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; color: ${fgMuted}; }
.tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: 500; }

/* Chart */
.chart-demo { background: ${surfaceBg}; padding: var(--spacing-4); border-radius: var(--radius-md); }
.chart-bars { display: flex; align-items: flex-end; gap: var(--spacing-3); height: 120px; }
.chart-bar { flex: 1; background: var(--color-primary); border-radius: var(--radius-sm) var(--radius-sm) 0 0; min-width: 24px; }
.chart-labels { display: flex; justify-content: space-around; margin-top: var(--spacing-2); font-size: var(--font-size-xs); color: ${fgMuted}; }

/* Stat Card */
.stat-card { background: ${surfaceBg}; padding: var(--spacing-4); border-radius: var(--radius-md); text-align: center; min-width: 120px; border: 1px solid ${border}; }
.stat-value { font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-primary); }
.stat-label { font-size: var(--font-size-xs); color: ${fgMuted}; margin-top: var(--spacing-1); }

/* Status Indicator */
.status-indicator { font-size: var(--font-size-sm); font-weight: 500; }
.status-ok { color: #22c55e; }
.status-warn { color: #f59e0b; }
.status-error { color: #ef4444; }

/* Select */
.select { padding: var(--spacing-2) var(--spacing-3); border-radius: var(--radius-md); border: 1px solid ${border}; font-size: var(--font-size-base); background: ${bg}; color: ${fg}; width: 220px; }

/* Checkbox & Radio */
.checkbox-group, .radio-group { display: flex; flex-direction: column; gap: var(--spacing-2); }
.checkbox-label, .radio-label { display: flex; align-items: center; gap: var(--spacing-2); font-size: var(--font-size-sm); cursor: pointer; }

/* Stepper */
.stepper { display: flex; gap: var(--spacing-4); }
.step { font-size: var(--font-size-sm); padding: var(--spacing-2) var(--spacing-3); border-radius: var(--radius-md); background: ${surfaceBg}; color: ${fgMuted}; }
.step.active { background: var(--color-primary-100); color: var(--color-primary-700); font-weight: 500; }
.step.completed { background: #dcfce7; color: #166534; }

/* Toggle */
.toggle { display: flex; align-items: center; gap: var(--spacing-2); font-size: var(--font-size-sm); cursor: pointer; }
.toggle input { display: none; }
.toggle-slider { width: 40px; height: 22px; background: ${border}; border-radius: 11px; position: relative; transition: 0.2s; }
.toggle-slider::after { content: ''; position: absolute; width: 18px; height: 18px; border-radius: 50%; background: white; top: 2px; left: 2px; transition: 0.2s; }
.toggle input:checked + .toggle-slider { background: var(--color-primary); }
.toggle input:checked + .toggle-slider::after { left: 20px; }

/* Bottom Sheet */
.bottom-sheet-demo { background: rgba(0,0,0,0.2); padding: var(--spacing-8) var(--spacing-4) 0; border-radius: var(--radius-md); display: flex; align-items: flex-end; min-height: 200px; }
.bottom-sheet { background: ${bg}; border-radius: var(--radius-lg) var(--radius-lg) 0 0; width: 100%; padding: var(--spacing-4); }
.bottom-sheet-handle { width: 40px; height: 4px; background: ${border}; border-radius: 2px; margin: 0 auto var(--spacing-4); }
.bottom-sheet-title { font-weight: 600; margin-bottom: var(--spacing-3); }
.bottom-sheet-item { padding: var(--spacing-3) 0; border-bottom: 1px solid ${border}; font-size: var(--font-size-sm); }

/* Tab Bar */
.tab-bar { display: flex; justify-content: space-around; background: ${surfaceBg}; padding: var(--spacing-2); border-radius: var(--radius-md); border: 1px solid ${border}; }
.tab-bar-item { text-align: center; font-size: var(--font-size-xs); padding: var(--spacing-2); color: ${fgMuted}; cursor: pointer; }
.tab-bar-item.active { color: var(--color-primary); }

/* List Item */
.list { border: 1px solid ${border}; border-radius: var(--radius-md); overflow: hidden; max-width: 280px; }
.list-item { display: flex; justify-content: space-between; padding: var(--spacing-3) var(--spacing-4); border-bottom: 1px solid ${border}; font-size: var(--font-size-sm); }
.list-item:last-child { border-bottom: none; }
.list-item-meta { color: ${fgMuted}; }

/* Dropdown */
.dropdown-demo { position: relative; display: inline-block; }
.dropdown-menu { position: absolute; top: 100%; left: 0; margin-top: var(--spacing-1); background: ${bg}; border: 1px solid ${border}; border-radius: var(--radius-md); box-shadow: var(--shadow-lg); min-width: 150px; z-index: 10; }
.dropdown-item { padding: var(--spacing-2) var(--spacing-3); font-size: var(--font-size-sm); cursor: pointer; }
.dropdown-item:hover { background: ${surfaceBg}; }
.dropdown-item-danger { color: #ef4444; }

@media (max-width: 640px) {
  body { padding: var(--spacing-4); }
  .component-row { flex-direction: column; align-items: flex-start; }
  .footer-cols { flex-direction: column; gap: var(--spacing-4); }
  .stepper { flex-direction: column; }
}
`
}

// --- Section Renderers ---

function renderColorSection(t: Template): string {
  const primaryShades = generateShades(t.anchors.colors.primary)
  const auxShades = generateShades(t.anchors.colors.auxiliary[0])
  const shadeKeys = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']

  let html = `<section class="section">\n<h2 class="section-title">Color System</h2>\n`
  html += `<div class="color-group"><div class="color-group-label">Primary — ${t.anchors.colors.primary}</div><div class="color-grid">\n`
  for (const k of shadeKeys) html += `  <div class="color-swatch" style="background:${primaryShades[k]}">${k}</div>\n`
  html += `</div></div>\n`
  html += `<div class="color-group"><div class="color-group-label">Auxiliary — ${t.anchors.colors.auxiliary[0]}</div><div class="color-grid">\n`
  for (const k of shadeKeys) html += `  <div class="color-swatch" style="background:${auxShades[k]}">${k}</div>\n`
  html += `</div></div>\n`
  html += `</section>\n`
  return html
}

function renderTypographySection(t: Template): string {
  const baseSize = parseInt(t.anchors.typography.baseSize)
  const scale = t.anchors.typography.scale
  const levels = [
    { label: '3xl', exp: 4 }, { label: '2xl', exp: 3 }, { label: 'xl', exp: 2 },
    { label: 'lg', exp: 1 }, { label: 'base', exp: 0 }, { label: 'sm', exp: -1 }, { label: 'xs', exp: -2 },
  ]
  let html = `<section class="section">\n<h2 class="section-title">Typography Scale</h2>\n<div class="type-scale">\n`
  for (const { label, exp } of levels) {
    const size = (baseSize * Math.pow(scale, exp)).toFixed(1)
    html += `  <div class="type-row"><span class="type-label">${label} (${size}px)</span><span style="font-size:${size}px">The quick brown fox jumps</span></div>\n`
  }
  html += `</div>\n</section>\n`
  return html
}

function renderSpacingSection(t: Template): string {
  const unit = parseInt(t.anchors.spacing.unit)
  const multipliers = [1, 2, 3, 4, 6, 8, 12, 16]
  let html = `<section class="section">\n<h2 class="section-title">Spacing System</h2>\n<div class="spacing-grid">\n`
  for (const m of multipliers) {
    const px = unit * m
    html += `  <div class="spacing-row"><span class="spacing-label">spacing-${m} (${px}px)</span><div class="spacing-bar" style="width:${px}px"></div></div>\n`
  }
  html += `</div>\n</section>\n`
  return html
}

function renderRadiusSection(t: Template): string {
  const base = parseInt(t.anchors.radius.base)
  const levels = [
    { label: 'sm', val: Math.round(base * 0.5) },
    { label: 'md', val: base },
    { label: 'lg', val: base * 2 },
    { label: 'xl', val: base * 3 },
  ]
  let html = `<section class="section">\n<h2 class="section-title">Border Radius</h2>\n<div class="radius-grid">\n`
  for (const { label, val } of levels) {
    html += `  <div class="radius-box" style="border-radius:${val}px">${label}<br/>${val}px</div>\n`
  }
  html += `</div>\n</section>\n`
  return html
}

function renderComponentsSection(t: Template): string {
  let html = `<section class="section">\n<h2 class="section-title">Components</h2>\n`
  for (const token of t.structure.componentTokens) {
    const renderer = COMPONENTS[token]
    if (renderer) html += renderer()
    else html += `<div class="component-group"><h4>${token}</h4><p style="color:#999;font-size:var(--font-size-sm)">Component not yet defined</p></div>\n`
  }
  html += `</section>\n`
  return html
}

// --- Page Assembly ---

function generatePage(t: Template): string {
  const isDark = t.dimensions.lightness <= 2
  const cssVars = generateCssVariables(t)
  const styles = getComponentStyles(isDark)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${t.name} — Design Token Sample</title>
<style>
${cssVars}
${styles}
</style>
</head>
<body>
<header class="page-header">
  <h1 class="page-title">${t.name}</h1>
  <div class="page-meta">Category: ${t.category} &middot; Density: ${t.dimensions.density}/5 &middot; Color Temp: ${t.dimensions.colorTemp}/5 &middot; Border Radius: ${t.dimensions.borderRadius}/5</div>
  <div class="page-intent"><strong>Mood:</strong> ${t.intent.mood}</div>
  <div class="page-intent"><strong>Philosophy:</strong> ${t.intent.philosophy}</div>
</header>

${renderColorSection(t)}
${renderTypographySection(t)}
${renderSpacingSection(t)}
${renderRadiusSection(t)}
${renderComponentsSection(t)}

<footer style="margin-top:var(--spacing-16);padding-top:var(--spacing-4);border-top:1px solid #e5e7eb;font-size:var(--font-size-xs);color:#999;">
  Generated by create-specfuse &middot; Template: ${t.id} &middot; <a href="index.html">Back to index</a>
</footer>
</body>
</html>`
}

function generateIndex(templates: Template[]): string {
  const grouped = templates.reduce((acc, t) => {
    (acc[t.category] ??= []).push(t)
    return acc
  }, {} as Record<string, Template[]>)

  let cards = ''
  for (const [category, items] of Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))) {
    cards += `<h2 style="margin:24px 0 12px;font-size:18px;color:#666;">${category}</h2>\n<div class="index-grid">\n`
    for (const t of items) {
      cards += `  <a href="${t.id}.html" class="index-card" style="border-left:4px solid ${t.anchors.colors.primary}">
    <div class="index-card-name">${t.name}</div>
    <div class="index-card-meta">${t.intent.mood.split('—')[0].trim()}</div>
  </a>\n`
    }
    cards += `</div>\n`
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Design Token Samples — create-specfuse</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; color: #1a1a1a; }
h1 { font-size: 28px; margin-bottom: 8px; }
.subtitle { color: #666; margin-bottom: 32px; }
.index-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
.index-card { display: block; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; text-decoration: none; color: inherit; transition: box-shadow 0.15s; }
.index-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.index-card-name { font-weight: 600; margin-bottom: 4px; }
.index-card-meta { font-size: 13px; color: #666; }
</style>
</head>
<body>
<h1>Design Token Samples</h1>
<p class="subtitle">Visual previews for all ${templates.length} design templates in create-specfuse.</p>
${cards}
</body>
</html>`
}

// --- Main ---

function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true })

  const files = readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.yaml') && !f.startsWith('_'))
  const templates: Template[] = files.map(f => {
    const content = readFileSync(join(TEMPLATES_DIR, f), 'utf-8')
    return parse(content) as Template
  })

  for (const t of templates) {
    const html = generatePage(t)
    writeFileSync(join(OUTPUT_DIR, `${t.id}.html`), html)
    console.log(`  ✓ ${t.id}.html`)
  }

  const index = generateIndex(templates)
  writeFileSync(join(OUTPUT_DIR, 'index.html'), index)
  console.log(`  ✓ index.html`)
  console.log(`\nGenerated ${templates.length + 1} files in docs/samples/`)
}

main()
