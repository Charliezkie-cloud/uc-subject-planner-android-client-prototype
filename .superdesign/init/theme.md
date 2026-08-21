# Theme

## Compact token summary

- Screen background: `#f8fafc`; surfaces: `#ffffff`; borders: `#e2e8f0`.
- Text: `#0f172a` primary, `#334155` secondary, `#64748b` muted, `#94a3b8` subtle.
- Accent: sky `#0284c7`, soft sky `#e0f2fe`, pale sky `#f0f9ff`.
- Typography: 22px/800 screen titles; 15px/700 section titles; 12px supporting text; 11px compact metadata.
- Spacing: screen gutters 16px; cards 12–14px; card radius 10px; small badge radius 6px.
- Shadows: very subtle native elevation 1 with black 4% opacity.

## Raw source

`global.css` defines a shadcn-like HSL light and dark theme with `--radius: 0.5rem`. `tailwind.config.js` uses the NativeWind preset and maps foreground, background, card, border, accent, destructive, and radius tokens to those CSS variables.
