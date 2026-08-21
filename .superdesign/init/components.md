# Shared UI components

## `components/ui/ScreenContainer.tsx`

Root safe-area wrapper used by every tab screen.

```tsx
export function ScreenContainer({ children, applyBottomInset = false, style, ...rest }: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.base, { paddingTop: insets.top, paddingBottom: applyBottomInset ? insets.bottom : 0 }, style]} {...rest}>{children}</View>;
}
```

## `components/ui/select.tsx`

Reusable `@rn-primitives/select` wrapper. It exports `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`, `SelectGroup`, `SelectLabel`, and separator/scroll primitives. Its trigger is a bordered 40px control with a chevron; content is a rounded popover.

## `components/ui/card.tsx`

Reusable NativeWind card family: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter`. Default card styling is white/card background, a border, 12px radius, and a subtle shadow.

## `components/ui/badge.tsx`

Reusable badge with default, secondary, destructive, and outline variants. It uses rounded-full borders and 12px medium text.

## `components/ui/text.tsx`

Reusable typography wrapper with semantic heading, paragraph, muted, lead, and code variants.
