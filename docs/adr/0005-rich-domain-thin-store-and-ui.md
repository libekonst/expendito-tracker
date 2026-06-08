# Rich domain layer; thin store and UI

All business rules live in the domain layer as pure functions — the runway engine, effective balance computation, monthly net cost, overhang calculation. The Zustand store is a thin persistence and CRUD shell: it holds state and exposes actions, but contains no simulation logic. React components render what the domain returns and call store actions; they derive nothing themselves.

The alternative — the default in React/Zustand codebases — is to distribute logic across selectors, custom hooks, and component `useMemo` calls. We rejected this because the domain is the richest part of the application. Keeping it pure and framework-free means every rule can be tested directly, without mounting components or instantiating a store. It also means the UI can be replaced or extended without touching the rules that govern the simulation.
