# Tailwind CSS Skill

> Always verify class names with Context7 before implementing: `context7 fetch tailwindcss.com/llms.txt`

## Project Color Palette
| Role       | Light                    | Dark                        |
|------------|--------------------------|-----------------------------|
| Primary    | `blue-600`               | `blue-500`                  |
| Primary hover | `blue-700`            | `blue-400`                  |
| Success    | `green-600`              | `green-400`                 |
| Danger     | `red-500`                | `red-400`                   |
| Text main  | `gray-800`               | `white`                     |
| Text muted | `gray-600`               | `gray-400`                  |
| Surface    | `white`                  | `gray-800`                  |
| Background | `gray-50` / `gray-100`   | `gray-900` / `gray-700`     |
| Border     | `gray-200` / `gray-300`  | `gray-700` / `gray-600`     |

## Core Layout Patterns

### Page container
```tsx
<div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
  <div className="max-w-2xl mx-auto">
```

### Card
```tsx
<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
```

### Flex row
```tsx
<div className="flex items-center gap-3">
<div className="flex items-center justify-between gap-2">
```

### Responsive grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

## Buttons

### Primary
```tsx
<button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium">
```

### Secondary
```tsx
<button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
```

### Danger
```tsx
<button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
```

### Icon button (hover reveal via group)
```tsx
<div className="group">
  <button className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
```

## Form Inputs

### Text input
```tsx
<input className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
```

### Label
```tsx
<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
```

### Checkbox
```tsx
<input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer" />
```

## Feedback States

### Loading spinner
```tsx
<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent">
```

### Empty state
```tsx
<div className="text-center py-12 text-gray-500 dark:text-gray-400">
  <p className="text-lg">No items found.</p>
</div>
```

### Error message
```tsx
<div className="p-3 bg-red-50 border border-red-200 rounded-lg">
  <p className="text-sm text-red-700">{error}</p>
</div>
```

### Success message
```tsx
<div className="p-3 bg-green-50 border border-green-200 rounded-lg">
  <p className="text-sm text-green-700">{message}</p>
</div>
```

## Rules
- Mobile-first: base classes for mobile, add `md:` and `lg:` for larger screens
- Always add `transition-colors` to interactive elements
- Use `group` + `group-hover:` for nested hover effects
- Always pair light/dark variants: `bg-white dark:bg-gray-800`
- Spacing scale: 1=4px, 2=8px, 3=12px, 4=16px, 6=24px, 8=32px, 12=48px
