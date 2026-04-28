# Shadcn/ui Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Intégrer shadcn/ui (Tailwind CSS v4) comme design system, en conservant l'identité visuelle dark/violet existante, et migrer progressivement les composants UI vers shadcn.

**Architecture:** Installer Tailwind v4 via `@tailwindcss/vite`, configurer path aliases `@/*`, initialiser shadcn (style `new-york`, base-color `neutral`, dark mode forcé), porter le thème custom (#6c63ff accent, #0f0f1a bg) vers les CSS variables OKLCH de shadcn dans `src/index.css`. Migration composant par composant : modaux → `Dialog`, boutons → `Button`, context menu → `DropdownMenu`, inputs → `Input`. App.css conservé pour layout grid / xterm jusqu'à fin de migration.

**Tech Stack:** Bun, React 19, Vite 8, TypeScript 5.9, Tauri 2, Tailwind CSS v4, shadcn/ui (CLI canary compatible Tailwind v4), Radix UI primitives, lucide-react, class-variance-authority, clsx, tailwind-merge.

**Sources de référence:**
- https://ui.shadcn.com/docs/installation/vite
- https://ui.shadcn.com/docs/tailwind-v4

---

## File Structure

**Création:**
- `src/lib/utils.ts` — helper `cn()` (clsx + tailwind-merge), requis par tous les composants shadcn
- `components.json` — config shadcn (style, aliases, base color)
- `src/components/ui/button.tsx` — composant Button shadcn
- `src/components/ui/dialog.tsx` — composant Dialog shadcn
- `src/components/ui/input.tsx` — composant Input shadcn
- `src/components/ui/dropdown-menu.tsx` — DropdownMenu (remplace context menu custom)
- `src/components/ui/label.tsx` — Label

**Modification:**
- `package.json` — nouvelles deps
- `vite.config.ts` — plugin tailwindcss + alias `@`
- `tsconfig.json` — paths `@/*`
- `tsconfig.app.json` — paths `@/*` + baseUrl
- `src/index.css` — `@import "tailwindcss"` + theme tokens
- `src/App.css` — purge progressive (sections migrées supprimées)
- `src/components/AddRepoModal.tsx` — Dialog + Button + Input
- `src/components/NewWorktreeModal.tsx` — Dialog + Button + Input
- `src/components/ConfirmDialog.tsx` — Dialog + Button (variants)
- `src/components/RepoList.tsx` — DropdownMenu pour context menu, Button pour actions
- `src/components/WorktreeList.tsx` — DropdownMenu, Button, Input pour edit label

**Conservation:**
- `src/components/Terminal.tsx` — pas de changement (xterm.js gère son DOM)
- `src/App.tsx` — layout grid conservé via App.css (migration plus tardive si désirée)

---

## Task 1: Installer Tailwind CSS v4 et dépendances shadcn

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Installer Tailwind v4 et plugin Vite**

```bash
bun add tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: Installer les dépendances utilitaires shadcn**

```bash
bun add class-variance-authority clsx tailwind-merge lucide-react tw-animate-css
```

- [ ] **Step 3: Installer @types/node (requis pour `path` dans vite.config.ts)**

```bash
bun add -D @types/node
```

- [ ] **Step 4: Vérifier installation**

```bash
grep -E '"tailwindcss"|"@tailwindcss/vite"|"clsx"|"tailwind-merge"|"lucide-react"' package.json
```

Attendu : 5 lignes, une par package.

- [ ] **Step 5: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: ajout dépendances Tailwind v4 + shadcn/ui"
```

---

## Task 2: Configurer path aliases TypeScript

**Files:**
- Modify: `tsconfig.json`
- Modify: `tsconfig.app.json`

- [ ] **Step 1: Ajouter baseUrl + paths dans tsconfig.json**

Remplacer le contenu actuel par :

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

- [ ] **Step 2: Ajouter baseUrl + paths dans tsconfig.app.json**

Dans le bloc `compilerOptions`, ajouter avant `/* Bundler mode */` :

```json
"baseUrl": ".",
"paths": {
  "@/*": ["./src/*"]
},
```

- [ ] **Step 3: Vérifier que tsc passe toujours**

```bash
bunx tsc -b --noEmit
```

Attendu : aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add tsconfig.json tsconfig.app.json
git commit -m "chore: alias @/* vers src/"
```

---

## Task 3: Configurer Vite (plugin Tailwind + alias)

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Réécrire vite.config.ts**

```typescript
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 2: Vérifier que le dev server démarre**

```bash
bun run dev
```

Attendu : Vite démarre sans erreur, page accessible localement (Ctrl+C pour arrêter).

- [ ] **Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "chore: plugin Tailwind v4 + alias @ dans Vite"
```

---

## Task 4: Importer Tailwind dans index.css avec thème custom (light + dark)

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Remplacer le contenu de src/index.css**

Light = défaut blanc/violet (palette sobre alignée sur shadcn neutral). Dark = palette existante (#6c63ff accent, #0f0f1a bg) portée en OKLCH.

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.62 0.22 280);
  --primary-foreground: oklch(0.98 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.62 0.22 280);
  --accent-foreground: oklch(0.98 0 0);
  --destructive: oklch(0.6 0.22 27);
  --destructive-foreground: oklch(0.98 0 0);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.62 0.22 280);
  --radius: 0.5rem;
}

.dark {
  --background: oklch(0.145 0.04 280);
  --foreground: oklch(0.92 0 0);
  --card: oklch(0.18 0.04 270);
  --card-foreground: oklch(0.92 0 0);
  --popover: oklch(0.18 0.04 270);
  --popover-foreground: oklch(0.92 0 0);
  --primary: oklch(0.62 0.22 280);
  --primary-foreground: oklch(0.98 0 0);
  --secondary: oklch(0.25 0.05 270);
  --secondary-foreground: oklch(0.92 0 0);
  --muted: oklch(0.22 0.04 270);
  --muted-foreground: oklch(0.65 0.02 270);
  --accent: oklch(0.62 0.22 280);
  --accent-foreground: oklch(0.98 0 0);
  --destructive: oklch(0.6 0.22 27);
  --destructive-foreground: oklch(0.98 0 0);
  --border: oklch(0.28 0.04 270);
  --input: oklch(0.22 0.04 270);
  --ring: oklch(0.62 0.22 280);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 2: Mettre la classe dark par défaut sur <html>**

Dans `index.html`, modifier `<html lang="en">` en `<html lang="en" class="dark">`. La classe sera ensuite togglable via le composant ThemeToggle (Task 4b).

- [ ] **Step 3: Créer une page de validation visuelle OKLCH temporaire**

Créer `src/components/_ColorPreview.tsx` (préfixe `_` pour le supprimer plus tard) :

```tsx
const tokens = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'destructive-foreground',
  'border',
  'input',
  'ring',
] as const

export default function ColorPreview() {
  return (
    <div className="fixed inset-0 z-[9999] overflow-auto bg-background p-6 text-foreground">
      <h1 className="mb-4 text-xl font-bold">OKLCH preview</h1>
      <div className="grid grid-cols-2 gap-2">
        {tokens.map((t) => (
          <div
            key={t}
            className="flex items-center gap-3 rounded border border-border p-2"
          >
            <span
              className="size-8 rounded border border-border"
              style={{ background: `var(--${t})` }}
            />
            <code className="text-xs">--{t}</code>
          </div>
        ))}
        <button
          onClick={() => document.documentElement.classList.toggle('dark')}
          className="col-span-2 rounded bg-primary p-2 text-primary-foreground"
        >
          Toggle .dark
        </button>
      </div>
    </div>
  )
}
```

Dans `src/App.tsx`, importer et rendre temporairement en haut du JSX :

```tsx
import ColorPreview from './components/_ColorPreview'
// ...
return (
  <>
    <ColorPreview />
    {/* reste de l'app */}
  </>
)
```

- [ ] **Step 4: Lancer dev et valider visuellement (HALT obligatoire)**

```bash
bun run dev
```

⚠️ **Checkpoint utilisateur requis** : afficher l'app, basculer light/dark via le bouton, vérifier que les couleurs sont satisfaisantes. Si non OK, ajuster les valeurs OKLCH dans `src/index.css` et recharger. Ne pas continuer tant que l'utilisateur n'a pas validé.

- [ ] **Step 5: Retirer le composant de preview**

```bash
rm src/components/_ColorPreview.tsx
```

Retirer dans `src/App.tsx` l'import et le `<ColorPreview />`.

- [ ] **Step 6: Commit**

```bash
git add src/index.css index.html src/App.tsx
git commit -m "feat: thème shadcn (Tailwind v4) light + dark avec palette violet"
```

---

## Task 4b: Toggle light/dark mode

**Files:**
- Create: `src/hooks/useTheme.ts`
- Create: `src/components/ThemeToggle.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Créer le hook useTheme avec persistance localStorage**

```typescript
import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'
const STORAGE_KEY = 'arborescence:theme'

function readInitial(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readInitial)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  return { theme, setTheme, toggle }
}
```

- [ ] **Step 2: Créer le composant ThemeToggle**

```tsx
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Basculer thème clair/sombre"
      title={theme === 'dark' ? 'Passer en clair' : 'Passer en sombre'}
    >
      {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
```

⚠️ Cette task dépend de Task 7 (Button shadcn). Si on l'exécute avant, retarder l'écriture de `ThemeToggle.tsx` jusqu'après Task 7 — voir ordre d'exécution dans la section "Ordre" ci-dessous.

- [ ] **Step 3: Intégrer ThemeToggle dans App.tsx**

Le toggle s'insère dans le header de la sidebar gauche (panel-header du RepoList) en bouton aligné à droite. Lecture préalable de `App.tsx` / `RepoList.tsx` requise pour identifier le bon point d'insertion ; le critère : visible sans interférer avec les boutons existants (toggle hidden repos, +ajouter dépôt). Si pas de slot évident, ajouter en position `fixed bottom-2 left-2 z-50`.

- [ ] **Step 4: Vérifier compilation**

```bash
bunx tsc -b --noEmit
```

- [ ] **Step 5: Test visuel**

```bash
bun run dev
```

Cliquer sur le toggle : light ↔ dark. Recharger la page : la préférence est conservée.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useTheme.ts src/components/ThemeToggle.tsx src/App.tsx
git commit -m "feat: toggle light/dark avec persistance localStorage"
```

---

## Task 5: Créer lib/utils.ts (helper cn)

**Files:**
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Créer le fichier**

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 2: Vérifier compilation**

```bash
bunx tsc -b --noEmit
```

Attendu : aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/lib/utils.ts
git commit -m "feat: helper cn() pour shadcn"
```

---

## Task 6: Créer components.json (config shadcn)

**Files:**
- Create: `components.json`

- [ ] **Step 1: Créer components.json à la racine**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

- [ ] **Step 2: Commit**

```bash
git add components.json
git commit -m "chore: config shadcn (new-york, neutral, alias @)"
```

---

## Task 7: Ajouter le composant Button shadcn

**Files:**
- Create: `src/components/ui/button.tsx`

- [ ] **Step 1: Lancer la commande shadcn add (mode non-interactif si possible, sinon répondre aux prompts)**

```bash
bunx --bun shadcn@latest add button
```

Attendu : crée `src/components/ui/button.tsx`. Si la CLI demande confirmation pour écraser ou pour le package manager, choisir `bun` / `oui`.

- [ ] **Step 2: Vérifier que le fichier existe et compile**

```bash
ls src/components/ui/button.tsx && bunx tsc -b --noEmit
```

Attendu : fichier listé, aucune erreur TS.

- [ ] **Step 3: Test visuel rapide — ajouter un bouton temporaire dans App.tsx**

Dans `src/App.tsx`, après les imports existants, ajouter `import { Button } from '@/components/ui/button'`. Dans le JSX, insérer temporairement :

```tsx
<Button variant="default" className="fixed bottom-2 right-2 z-50">test shadcn</Button>
```

- [ ] **Step 4: Vérifier visuellement**

```bash
bun run dev
```

Le bouton violet apparaît en bas à droite. Si OK, retirer le bouton de test (revert l'import et la ligne JSX).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/button.tsx
git commit -m "feat: composant Button (shadcn)"
```

---

## Task 8: Ajouter Dialog, Input, Label, DropdownMenu

**Files:**
- Create: `src/components/ui/dialog.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/label.tsx`
- Create: `src/components/ui/dropdown-menu.tsx`

- [ ] **Step 1: Ajouter les 4 composants en une commande**

```bash
bunx --bun shadcn@latest add dialog input label dropdown-menu
```

Attendu : 4 fichiers créés dans `src/components/ui/`. Les peer-deps Radix sont installées automatiquement.

- [ ] **Step 2: Vérifier compilation**

```bash
bunx tsc -b --noEmit
```

Attendu : aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/ package.json bun.lock
git commit -m "feat: composants Dialog, Input, Label, DropdownMenu"
```

---

## Task 9: Migrer ConfirmDialog vers Dialog + Button

**Files:**
- Modify: `src/components/ConfirmDialog.tsx`

- [ ] **Step 1: Lire le composant actuel pour identifier les props**

```bash
cat src/components/ConfirmDialog.tsx
```

Noter : props `open`, `onConfirm`, `onCancel`, `title`, `description`, `confirmLabel`, `details?`, et état loading.

- [ ] **Step 2: Réécrire en utilisant Dialog + Button**

Remplacer entièrement le contenu de `src/components/ConfirmDialog.tsx` :

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type Props = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  details?: string[]
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmer',
  details,
  loading,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {details && details.length > 0 && (
          <ul className="max-h-32 overflow-y-auto pl-5 text-xs text-muted-foreground list-disc">
            {details.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        )}
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="size-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {confirmLabel}
              </span>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 3: Vérifier compilation et types corrects pour les callers**

```bash
bunx tsc -b --noEmit
```

Si erreurs sur les call sites (App.tsx etc.), c'est que la signature a changé : ajuster les call sites au lieu de modifier la nouvelle signature.

- [ ] **Step 4: Test visuel**

```bash
bun run dev
```

Tester : supprimer un worktree → la confirmation doit s'afficher avec le nouveau style (overlay shadcn). Le spinner doit apparaître pendant la suppression.

- [ ] **Step 5: Supprimer les classes CSS legacy obsolètes dans App.css**

Supprimer dans `src/App.css` les sélecteurs : `.modal-overlay`, `.modal`, `.modal h3`, `.modal-actions`, `.confirm-details`, `.btn-loading`, `.spinner`, `@keyframes spin`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-primary:hover`, `.btn-secondary:hover`, `.btn-danger:hover`, `.btn-primary:disabled, .btn-secondary:disabled, .btn-danger:disabled`.

⚠️ Attendre que toutes les autres modales soient migrées avant de retirer `.modal*`. Pour cette task, ne supprimer que `.confirm-details`.

- [ ] **Step 6: Commit**

```bash
git add src/components/ConfirmDialog.tsx src/App.css
git commit -m "feat: ConfirmDialog migré vers shadcn Dialog/Button"
```

---

## Task 10: Migrer AddRepoModal vers Dialog + Button + Input

**Files:**
- Modify: `src/components/AddRepoModal.tsx`

- [ ] **Step 1: Lire le composant actuel**

```bash
cat src/components/AddRepoModal.tsx
```

Identifier props et structure (input chemin + bouton folder picker + actions).

- [ ] **Step 2: Réécrire avec shadcn**

Remplacer le contenu, en gardant la logique métier (state, handler `onAdd`, dialog Tauri). Structure cible :

```tsx
import { useState } from 'react'
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
  open: boolean
  onClose: () => void
  onAdd: (path: string) => void | Promise<void>
}

export default function AddRepoModal({ open, onClose, onAdd }: Props) {
  const [path, setPath] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handlePick = async () => {
    const selected = await openDialog({ directory: true, multiple: false })
    if (typeof selected === 'string') setPath(selected)
  }

  const handleAdd = async () => {
    setError(null)
    try {
      await onAdd(path)
      setPath('')
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un dépôt</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="repo-path">Chemin du dépôt</Label>
          <div className="flex gap-2">
            <Input
              id="repo-path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/chemin/vers/repo"
            />
            <Button type="button" variant="secondary" onClick={handlePick}>
              Parcourir…
            </Button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleAdd} disabled={!path}>
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

⚠️ Si la signature des props diffère du composant actuel, conserver la signature actuelle (lue à l'étape 1) et adapter le JSX, pas l'inverse.

- [ ] **Step 3: Vérifier compilation**

```bash
bunx tsc -b --noEmit
```

- [ ] **Step 4: Test visuel**

```bash
bun run dev
```

Cliquer sur "+ ajouter dépôt" → la modal apparaît avec le nouveau style. Le picker Tauri s'ouvre au clic sur "Parcourir".

- [ ] **Step 5: Commit**

```bash
git add src/components/AddRepoModal.tsx
git commit -m "feat: AddRepoModal migré vers shadcn"
```

---

## Task 11: Migrer NewWorktreeModal vers shadcn

**Files:**
- Modify: `src/components/NewWorktreeModal.tsx`

- [ ] **Step 1: Lire le composant actuel**

```bash
cat src/components/NewWorktreeModal.tsx
```

- [ ] **Step 2: Réécrire en miroir d'AddRepoModal**

Conserver la signature de props existante. Remplacer le markup `<div className="modal-overlay">…</div>` par `<Dialog>…</Dialog>` (pattern identique à Task 10), `<input>` par `<Input>`, `<button class="btn-primary">` par `<Button>`, `<button class="btn-secondary">` par `<Button variant="secondary">`. Préserver toute la logique métier (form state, validations, handlers Tauri).

- [ ] **Step 3: Vérifier compilation**

```bash
bunx tsc -b --noEmit
```

- [ ] **Step 4: Test visuel**

```bash
bun run dev
```

Créer un nouveau worktree → la modal s'affiche correctement, la création réussit.

- [ ] **Step 5: Commit**

```bash
git add src/components/NewWorktreeModal.tsx
git commit -m "feat: NewWorktreeModal migré vers shadcn"
```

---

## Task 12: Purger les classes modal/btn legacy de App.css

**Files:**
- Modify: `src/App.css`

- [ ] **Step 1: Vérifier qu'aucun composant migré n'utilise les classes legacy**

```bash
grep -n "modal-overlay\|btn-primary\|btn-secondary\|btn-danger\|class=\"modal\"\|className=\"modal\"" src/components/*.tsx src/App.tsx
```

Attendu : aucune occurrence dans les fichiers déjà migrés (ConfirmDialog, AddRepoModal, NewWorktreeModal).

- [ ] **Step 2: Supprimer les blocs CSS obsolètes dans src/App.css**

Supprimer ces sélecteurs (lignes ~288 à ~412) : `.modal-overlay`, `.modal`, `.modal h3`, `.modal input`, `.modal input:focus`, `.folder-picker`, `.folder-picker input`, `.modal-actions`, `.btn-primary`, `.btn-secondary`, `.btn-danger` (avec leurs `:hover` et `:disabled`).

- [ ] **Step 3: Test visuel — toutes les modales**

```bash
bun run dev
```

Ouvrir Add Repo, New Worktree, Confirm Delete → toutes doivent rester correctement stylées (via shadcn).

- [ ] **Step 4: Commit**

```bash
git add src/App.css
git commit -m "chore: purge styles modal/btn legacy"
```

---

## Task 13: Migrer le context menu (RepoList + WorktreeList) vers DropdownMenu

**Files:**
- Modify: `src/components/RepoList.tsx`
- Modify: `src/components/WorktreeList.tsx`

- [ ] **Step 1: Lire les deux composants**

```bash
cat src/components/RepoList.tsx src/components/WorktreeList.tsx
```

Identifier la logique de context menu (clic droit → state position + items).

- [ ] **Step 2: Remplacer dans RepoList le context menu custom par DropdownMenu**

Pattern : pour chaque item de la liste, wrapper l'élément déclencheur avec `<DropdownMenu>` ouvert via clic droit. Comme Radix DropdownMenu n'a pas de trigger "right-click" natif, utiliser ContextMenu de shadcn à la place :

```bash
bunx --bun shadcn@latest add context-menu
```

Puis remplacer la div `.context-menu` custom par `<ContextMenu><ContextMenuTrigger>…item…</ContextMenuTrigger><ContextMenuContent>…actions…</ContextMenuContent></ContextMenu>`.

⚠️ Conserver la logique métier (handlers de toggle hidden / delete repo).

- [ ] **Step 3: Idem pour WorktreeList**

Même pattern. Attention au bouton edit label qui reste un bouton inline (pas dans le menu) — utiliser `<Button variant="ghost" size="icon">` avec une icône lucide-react `Pencil`.

- [ ] **Step 4: Vérifier compilation**

```bash
bunx tsc -b --noEmit
```

- [ ] **Step 5: Test visuel**

```bash
bun run dev
```

Clic droit sur un repo → menu shadcn. Clic droit sur un worktree → menu shadcn. Bouton edit label fonctionne.

- [ ] **Step 6: Supprimer .context-menu et .context-menu button dans App.css**

```bash
grep -n "context-menu" src/App.css
```

Supprimer les sélecteurs concernés.

- [ ] **Step 7: Commit**

```bash
git add src/components/RepoList.tsx src/components/WorktreeList.tsx src/App.css src/components/ui/context-menu.tsx package.json bun.lock
git commit -m "feat: context menu migré vers shadcn ContextMenu"
```

---

## Task 14: Vérifications finales (lint, typecheck, build)

- [ ] **Step 1: Prettier**

```bash
bunx prettier --write "src/**/*.{ts,tsx,css}" "*.{ts,json,md}"
```

- [ ] **Step 2: Typecheck**

```bash
bunx tsc -b
```

Attendu : 0 erreur.

- [ ] **Step 3: Lint**

```bash
bun run lint
```

Attendu : 0 erreur (warnings tolérés s'ils sont préexistants).

- [ ] **Step 4: Build production**

```bash
bun run build
```

Attendu : build réussit, dossier `dist/` produit.

- [ ] **Step 5: Test fonctionnel complet en mode dev**

```bash
bun run dev
```

Checklist manuelle :
- [ ] Ajouter un repo (modal)
- [ ] Créer un worktree (modal)
- [ ] Renommer un label de worktree (input inline)
- [ ] Clic droit sur repo / worktree (menus)
- [ ] Supprimer un worktree (confirm dialog + spinner)
- [ ] Terminal xterm fonctionne (rendu, resize)

- [ ] **Step 6: Commit final si formatages**

```bash
git add -A
git commit -m "chore: format après intégration shadcn"
```

---

## Self-Review

**Spec coverage:**
- Tailwind v4 installation : Tasks 1, 3, 4 ✅
- Path aliases : Task 2 ✅
- shadcn config : Task 6 ✅
- Composants ajoutés : Tasks 7, 8, 13 ✅
- Migration UI existante (modaux, context menu, boutons) : Tasks 9–13 ✅
- Préservation thème violet/dark : Task 4 (OKLCH conservant #6c63ff/#0f0f1a) ✅
- xterm cohabitation : pas de conflit (Terminal.tsx non modifié) ✅
- Vérifs finales : Task 14 ✅

**Placeholders:** Aucun TBD/TODO. Code complet pour ConfirmDialog et AddRepoModal. Pour NewWorktreeModal/RepoList/WorktreeList, le code n'est pas écrit en entier dans le plan car il dépend de la signature actuelle (à lire au runtime) — l'instruction est explicite : conserver props existantes, remplacer markup uniquement.

**Type consistency:** `cn` utilisé via `@/lib/utils` partout. `Button`, `Dialog*`, `Input`, `Label`, `DropdownMenu`, `ContextMenu` importés depuis `@/components/ui/*`. Pas de divergence de noms.

**Risques identifiés:**
- shadcn CLI peut demander confirmations interactives → si bloquant, utiliser `--yes` ou `--overwrite` selon options dispos.
- tw-animate-css remplace tailwindcss-animate en Tailwind v4. Les composants shadcn récents l'utilisent.
- App.css conserve le layout grid (`.app`, `.app.with-terminal`, `.resize-handle`, `.panel-*`, `.terminal-*`) — migration de ces blocs hors scope de ce plan.

---

## Decisions finales (résolues)

1. **Layout (App.css)** : conservé indéfiniment, pas de migration prévue.
2. **OKLCH** : validation visuelle requise avant de poursuivre la migration des composants (checkpoint dans Task 4).
3. **Toggle light/dark** : à implémenter (Task 4b ajoutée).
