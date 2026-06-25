# Context Manager — Regras de Desenvolvimento

## Stack
- React 19 + Vite
- CSS puro (sem Tailwind)
- Lucide React para ícones
- Google Fonts: Inter, Geist Mono
- Deploy: GitHub Pages

## Design System
- **Cores**: `--green:#45E58B`, `--surface:#111513`, `--line:#272d2a`, `--muted:#8c9691`, `--text:#edf3ef`, `--bg:#070908`
- **Tipografia**: Inter para corpo, Geist Mono para código/labels
- **Border radius**: 16px cards, 10px controles, 9999px pills
- **Espaçamento**: 8px base, 16px gap, 24px card padding

## Regras de Qualidade

### HTML/CSS
- Sempre usar `box-sizing: border-box`
- Responsivo: breakpoints em 600px e 900px
- Usar `clamp()` para tipografia fluida
- Transições suaves em todos os interativos (0.15s-0.2s)
- Nunca usar `!important`
- Semantic HTML: header, main, section, nav, article

### JavaScript/React
- Componentes funcionais com hooks
- Memoização com `useMemo` para listas filtradas
- `useRef` para elementos DOM, nunca `document.querySelector`
- `requestAnimationFrame` para animações ligadas ao mouse
- Cleanup de event listeners em `useEffect`

### Design Profissional
- Hierarquia visual clara: título > subtítulo > corpo > muted
- Contraste mínimo WCAG AA (4.5:1 para texto)
- Espaçamento consistente (múltiplos de 8px)
- Hover states em todos os interativos
- Focus states acessíveis (outline ou ring)
- Animações com `ease-out`, nunca `linear` em microinterações
- Grid/layouts com `gap`, nunca margin negativa

### Performance
- Lazy load em imagens
- `will-change` apenas em elementos animados
- CSS animations via `transform` e `opacity` (GPU accelerated)
- Evitar layout thrashing com reads antes de writes

### Acessibilidade
- `aria-label` em botões sem texto
- `alt` em todas as imagens
- Navegação por teclado funcional
- Cores nunca são o único indicador de estado

## Padrões de Código
- Sem comentários desnecessários
- Arquivos organizados: componente = 1 arquivo
- CSS modules ou arquivo único por projeto
- Nomes em camelCase para JS, kebab-case para CSS classes
- Constantes acima dos componentes
