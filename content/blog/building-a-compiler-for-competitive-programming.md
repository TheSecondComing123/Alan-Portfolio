---
title: Building a Compiler for Competitive Programming
date: 2026-03-28
readTime: 9 min read
excerpt: 'How I designed algo, a Python-like language that compiles to optimized C++17 for competitive programming.'
tags:
    - Compilers
    - Scala
    - Competitive Programming
---

## The problem with C++ for competitive programming

C++ is the dominant language in competitive programming for good reason: it's fast, the STL is comprehensive, and judges have generous time limits for it. But writing C++ under contest pressure is painful. You're fighting syntax, not algorithms.

I kept running into the same friction:

- Rewriting boilerplate: fast I/O, `#define int long long`, `const int INF = 1e18`
- Verbose container operations: `(int)v.size()`, `sort(v.begin(), v.end())`
- Graph setup that's 15 lines before you can even call BFS
- No floor division (C++ truncates toward zero; Python floors)

Templates help, but they're static. You either include everything (2000-line blob) or manually pick what you need per problem.

algo is a different approach: write in clean, Python-like syntax, and the compiler emits readable C++17 with only the stdlib functions you actually use.

## Language design

The syntax is deliberately close to Python because that's what's fast to type under time pressure. But it's statically typed because the output needs to be efficient C++.

```python
input:
    n: int
    m: int

g = wgraph(n, undirected=true)
repeat m:
    input:
        u, v, w: int
    g.add(u, v, w)

d = g.dijkstra(0).dist
for i in [0, n):
    println d[i]
```

This compiles to ~60 lines of C++ including the Dijkstra implementation, adjacency list setup, and I/O.

Some design decisions:

- **Range syntax**: `[a, b)` for half-open, `[a, b]` for closed, `(a, b)` for open both sides. Auto-detects reverse when `a > b`. Step is optional: `[0, n, 2)`.
- **Floor division**: `//` does Python-style floor division, not C++ truncation. `%` follows accordingly. This matters for problems involving negative coordinates.
- **Modular arithmetic**: `+%`, `-%`, `*%`, `**%` operators that automatically apply `MOD` (configurable via `#!mod` pragma, defaults to 1000000007).
- **Chained comparisons**: `a < b < c` compiles to `a < b && b < c` with the middle expression evaluated once.

## Compiler pipeline

The compiler is written in Scala 3 and follows a traditional pipeline:

**Lexer**: indentation-sensitive tokenization (like Python). Tracks indent/dedent to handle block structure. Supports pragmas like `#!int64` (makes all `int` declarations emit `long long`) and `#!mod 998244353`.

**Parser**: recursive descent. The grammar handles expressions, statements, type annotations, struct definitions, and built-in operations like `g.dijkstra(0)` or `seg.query(l, r)`.

**Semantic analysis**: type checking, scope resolution, and usage tracking. This phase determines which stdlib functions the codegen needs to emit.

**Optimizer**: constant folding, dead code elimination, and temp variable inlining. Contest code doesn't need aggressive optimization (the judge has generous limits), but reducing unnecessary temporaries makes the output more readable.

**Codegen**: emits C++17 targeting `g++ -std=c++17 -O2`. Some invariants the codegen maintains:
- Container `.size()` always cast to `(int)` to avoid signed/unsigned comparison warnings
- `long` always emits as `long long`
- Never `endl`, always `"\n"` (endl flushes, which is slow)
- Constants: `INF = 1e18`, `MOD = 1000000007LL`

## Modular stdlib emission

This is the core idea that makes algo different from a template system. The compiler tracks which built-in features you use and only emits the C++ implementations for those features.

If you write `g.dijkstra(0)`, the codegen emits the graph adjacency list struct and the Dijkstra function. If you also call `g.bfs(0)`, it adds BFS. If you don't use graphs at all, none of that code appears in the output.

The stdlib is organized as named blocks:

- `DSU_STRUCT`: union-find with path compression and union by rank
- `GRAPH_BASE`: adjacency list with BFS
- `GRAPH_DIJKSTRA`: Dijkstra's algorithm
- `GRAPH_TOPO`: topological sort (Kahn's algorithm)
- `GRAPH_SCC`: Tarjan's strongly connected components
- `GRAPH_BRIDGES`: bridge finding
- `SEGTREE`: segment tree with configurable merge operation

Each block declares its dependencies. `GRAPH_DIJKSTRA` depends on `GRAPH_BASE`. The codegen resolves the dependency graph and emits blocks in topological order.

The result: the output for a simple BFS problem is 30 lines. The output for a problem using Dijkstra, DSU, and segment trees is 120 lines. A monolithic template would be 500+ lines regardless.

## Testing

The test suite compares compiler output against expected C++ files. Each test case is an `.algo` source file paired with an `expected.cpp` file. The test runner (Bun-based) compiles the algo source, diffs against expected output, and optionally compiles the C++ with g++ to verify it's valid.

This catches both correctness bugs (wrong C++ emitted) and regression in output quality (unnecessary temporaries, missing casts, wrong include order).

## Was it worth it

I use algo for practice, not for actual contests (most judges don't accept custom languages). The value is in the compiler itself: building a full pipeline from lexer to codegen taught me more about language design than any course. And the modular stdlib idea has influenced how I think about code generation in other contexts.
