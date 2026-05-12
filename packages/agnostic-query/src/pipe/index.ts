// agnostic-query does not provide a `pipe` API.
//
// The ideal pipe API would let you compose reusable operators:
//
//   const filterActive = where('status', 'eq', 'active')
//   const schema = pipe<User>(filterActive, where('name', 'eq', 'Alice'))
//
// This is impossible in TypeScript today because its generic inference is
// forward-only (left-to-right, argument-to-return). It cannot contextually
// infer `T = User` inside `where(...)` from the surrounding `pipe<User>`.
//
//   pipe<User>(where('name', 'eq', 'Alice'), ...)
//              ^ where() infers T = SchemaShape independently → type error
//
// Workarounds like `pipe<User>($ => [$.where(...)])` are just the builder
// pattern wrapped in a callback — they lose the compositional value of pipe.
//
// This is a deliberate tradeoff in TypeScript's design: it prioritises
// inference speed and predictable error messages over the full bidirectional
// unification (Hindley-Milner) used by Haskell, OCaml, PureScript, etc.
//
// For type-safe query building, use:
//   aq<User>().where('name', 'eq', 'Alice').toJSON()
//
// This file exists as a placeholder — if there's enough demand, pipe can be
// implemented here without breaking changes. Open an issue if you need it.
