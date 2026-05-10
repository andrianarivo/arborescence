# CLAUDE.md — arborescence

## Identite visuelle : Cobalt Pro (intouchable)

La palette, la typographie, les rayons, l'espacement et les tokens semantiques de l'app sont definis dans `docs/superpowers/specs/2026-05-10-visual-identity-design.md`. Cette spec fait foi.

**Regle absolue :** ne JAMAIS modifier les tokens visuels suivants pour resoudre un probleme de gout / perception (teinte, saturation, "ca pique les yeux"...) :

- Tokens neutres et accent dans `src/index.css` (`--bg-*`, `--text-*`, `--accent*`, `--border-*`, `--success/warning/danger`)
- Tokens applicatifs (`--terminal-bg`, `--terminal-fg`, `--sidebar-bg`, etc.)
- Constantes `TERMINAL_THEME` dans `src/components/Terminal.tsx` (palette ANSI 16 couleurs xterm)
- Familles de fonts (`--font-sans`, `--font-mono`)
- Echelle d'espacement / hauteurs canoniques

**Pourquoi :** ces valeurs sont calculees pour respecter WCAG AA, pour la coherence inter-composants, et pour le branding. Les changer "pour neutraliser une teinte" casse l'identite globale.

**Si l'utilisateur signale une gene visuelle :**

1. Demander **OU exactement** la gene est visible (curseur, prompt, selection, output d'une commande precise, halo de focus...).
2. Identifier le **seul element** en cause via investigation (pas via supposition).
3. Proposer un fix qui **ne touche que cet element** (par ex. ajuster `cursorAccent` mais pas `foreground`).
4. Si la spec elle-meme est en cause : demander a l'utilisateur s'il veut amender la spec, ne pas le faire de soi-meme.

**Anti-pattern reel observe :** une "teinte violette dans le terminal" a ete corrigee en remplacant 8 couleurs ANSI + le foreground + le background — ce qui a casse l'identite Cobalt Pro complete. Le bon reflexe etait de demander des precisions et de toucher au plus 1-2 valeurs.

## Spec et plan vivants

- Spec identite : `docs/superpowers/specs/2026-05-10-visual-identity-design.md`
- Plan d'implementation : `docs/superpowers/plans/2026-05-10-visual-identity-refonte.md`
- Architecture technique : `ARCHITECTURE.md`

## Commandes de verification

```bash
bun run build      # tsc -b && vite build
bun run lint       # eslint .
bunx prettier --write 'src/**/*.{ts,tsx,css}' 'index.html'
bun tauri dev      # rebuild + relance app (necessaire apres modif capabilities/*.json ou code Rust)
```

## Permissions Tauri

Les capabilities sont dans `src-tauri/capabilities/default.json` et **compilees dans le binaire Rust au build time**. Modifier ce fichier necessite `bun tauri dev` ou `bun tauri build` pour prendre effet — un `bun run build` cote frontend ne suffit pas.

`core:window:default` (inclus dans `core:default`) ne contient QUE des permissions read-only. Les actions mutatives (`allow-close`, `allow-destroy`, `allow-minimize`, etc.) doivent etre ajoutees explicitement.

## Format

- Tabs partout (cf `.prettierrc`).
- Pas de commentaires inutiles, pas de docstrings.
- Commits sans `Co-Authored-By`.
- Reponses en francais.
