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

C++ is the dominant language in competitive programming. It's fast, the standard library covers most data structures you need, and judges give it generous time limits. But writing C++ during a contest is painful. You spend time fighting syntax when you should be thinking about algorithms.

The friction is constant. You rewrite the same boilerplate every problem: fast I/O, `#define int long long`, `const int INF = 1e18`. Container operations are needlessly verbose (`(int)v.size()`, `sort(v.begin(), v.end())`). Graph setup eats 15 lines before you can even call BFS. And C++ has no floor division; it truncates toward zero instead of flooring like Python.

Templates help, but they're static. You either include everything (a 2000-line blob) or you manually pick what you need per problem.

algo takes a different approach. You write in Python-like syntax, and the compiler emits readable C++17 with only the stdlib functions you actually use.

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

A few design decisions worth explaining:

Range syntax supports `[a, b)` for half-open, `[a, b]` for closed, and `(a, b)` for open on both sides. It auto-detects reverse iteration when `a > b`. Step is optional: `[0, n, 2)`.

`//` does Python-style floor division, not C++ truncation. `%` follows accordingly. This matters for problems involving negative coordinates.

Modular arithmetic gets its own operators: `+%`, `-%`, `*%`, `**%`. These automatically apply `MOD`, which is configurable via the `#!mod` pragma and defaults to 1000000007.

Chained comparisons work too. `a < b < c` compiles to `a < b && b < c` with the middle expression evaluated once.

## Compiler pipeline

The compiler is written in Scala 3 and follows a traditional pipeline.

The lexer does indentation-sensitive tokenization, like Python. It tracks indent/dedent to handle block structure and supports pragmas like `#!int64` (makes all `int` declarations emit `long long`) and `#!mod 998244353`.

The parser is recursive descent. It handles expressions, statements, type annotations, struct definitions, and built-in operations like `g.dijkstra(0)` or `seg.query(l, r)`.

Semantic analysis does type checking, scope resolution, and usage tracking. This is where the compiler figures out which stdlib functions the codegen will need to emit.

The optimizer does constant folding, dead code elimination, and temp variable inlining. Contest code doesn't need aggressive optimization since the judge has generous limits, but reducing unnecessary temporaries makes the output more readable.

Codegen emits C++17 targeting `g++ -std=c++17 -O2`. It enforces several invariants: container `.size()` is always cast to `(int)` to avoid signed/unsigned comparison warnings, `long` always emits as `long long`, `"\n"` is used instead of `endl` (because `endl` flushes and is slow), and constants are set to `INF = 1e18` and `MOD = 1000000007LL`.

## Modular stdlib emission

This is the core idea that separates algo from a template system. The compiler tracks which built-in features you use and only emits the C++ implementations for those features.

Write `g.dijkstra(0)` and the codegen emits the graph adjacency list struct and the Dijkstra function. Also call `g.bfs(0)` and it adds BFS. Don't use graphs at all, and none of that code appears in the output.

The stdlib is organized as named blocks:

- `DSU_STRUCT`: union-find with path compression and union by rank
- `GRAPH_BASE`: adjacency list with BFS
- `GRAPH_DIJKSTRA`: Dijkstra's algorithm
- `GRAPH_TOPO`: topological sort (Kahn's algorithm)
- `GRAPH_SCC`: Tarjan's strongly connected components
- `GRAPH_BRIDGES`: bridge finding
- `SEGTREE`: segment tree with configurable merge operation

Each block declares its dependencies. `GRAPH_DIJKSTRA` depends on `GRAPH_BASE`. The codegen resolves the dependency graph and emits blocks in topological order.

So a simple BFS problem produces about 30 lines of output. A problem using Dijkstra, DSU, and segment trees produces about 120. A monolithic template would be 500+ lines regardless of what you actually need.

## Testing

The test suite compares compiler output against expected C++ files. Each test case is an `.algo` source file paired with an `expected.cpp` file. The test runner (Bun-based) compiles the algo source, diffs against expected output, and optionally compiles the C++ with g++ to verify it's valid.

This catches correctness bugs (wrong C++ emitted) and output quality regressions (unnecessary temporaries, missing casts, wrong include order).

## Was it worth it

I use algo for practice, not for actual contests. Most judges don't accept custom languages. The value is in the compiler itself. Building a full pipeline from lexer to codegen taught me more about language design than any course. The modular stdlib idea has also influenced how I think about code generation in other contexts.
