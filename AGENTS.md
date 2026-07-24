# AGENTS.md

Instrucciones compartidas entre agentes de codigo (Claude, Codex, Antigravity) para este repo.

## Code map (graphify)

Este repo tiene grafo de dependencias generado por graphify:
- `graphify-out/graph.html` — grafo interactivo, abrir en navegador
- `graphify-out/GRAPH_REPORT.md` — reporte en lenguaje llano (god nodes, comunidades, preguntas sugeridas)

Antes de explorar la estructura del código a mano, leer `GRAPH_REPORT.md`.

**Mantenerlo actualizado:** al terminar una sesión con cambios grandes de código (feature nueva, refactor, varios archivos tocados), correr:

```
graphify . --update
```

No correrlo por fixes chicos de 1-2 archivos. No usar hook post-commit (gasta ciclos de más) — una vez por sesión grande basta.
