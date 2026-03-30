# Immersive Scripting — Agent Rules

> **Meta-rule:** When editing this file, make bold structural changes (reorganize, deduplicate, rewrite) as needed to keep it clear and effective. The only constraint is **never lose information** — every rule, fact, and code example must be preserved in some form.

## Project Overview

A WebXR prototyping environment where the user stays inside a WebXR (AR) session and iterates on a 3D scene in real-time via Vite HMR. All scene code lives in `src/components/`.

**Tech stack:** React 19, TypeScript, Vite 7 (HTTPS, `--host`), Three.js via React Three Fiber, @react-three/xr, @react-three/drei, @react-three/rapier, @react-spring/three.

**Module graph:**

```
index.html → main.tsx → App.tsx → XRScene.tsx (+ other components in src/components/)
```

- `App.tsx` — owns `Canvas`, `XR` provider, and XR store. **Do not modify.**
- `src/components/XRScene.tsx` — root scene component inside `<XR>`. **This is the main file you edit.**
- Additional components go in `src/components/` and are imported from `XRScene.tsx`.

---

## Golden Rules

These are non-negotiable. Violating any of them kills the live WebXR session.

| #   | Rule                                                                  | Why                                                                                                           |
| --- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1   | **Only edit files in `src/components/`**                              | Changes to `App.tsx`, `main.tsx`, `index.html`, or `vite.config.ts` invalidate the module graph → full reload |
| 2   | **Every file in `src/components/` must only export React components** | Non-component exports (constants, utils, re-exported types) make Vite fall back to a full reload              |
| 3   | **No module-level object instantiations**                             | `const v = new Vector3()` at the top level is a side effect → full reload. Use `useRef` instead               |
| 4   | **Only import pre-bundled dependencies**                              | A new, un-optimized import triggers Vite re-bundling → full reload                                            |
| 5   | **Do not add npm packages without asking the user**                   | `npm install` requires a server restart → kills XR session                                                    |
| 6   | **Do not re-create `Canvas`, `XR`, or `createXRStore()`**             | These live in `App.tsx` and must not be touched                                                               |

---

## HMR Safety Guide

All code changes must hot-update via React Fast Refresh. This section explains how.

### Exports

- Only export React components (named or default) from files in `src/components/`.
- Keep the existing `export function XRScene()` signature. Renaming it or switching between named/default export resets component state.

### New Files in `src/components/`

- Allowed, as long as they **only export React components**.
- Import them only from `XRScene.tsx` or other files inside `src/components/`.
- Non-component code (helpers, constants, hooks) must live **inside** a component file, not in a separate utility file.
- After creating a new file, run lints to confirm `eslint-plugin-react-refresh` does not flag it.

### Module-Level Code

- **Safe:** Primitive constants — `const SPEED = 2`, `const COLORS = ['red', 'blue']`.
- **Unsafe:** Object instantiations, `console.log()`, `fetch()`, `addEventListener()`, or any code that runs on import.

```tsx
// ❌ BAD — kills HMR
const tempVec = new Vector3();
export function MyComponent() { ... }

// ✅ GOOD — inside useRef
export function MyComponent() {
  const tempVec = useRef(new Vector3());
  ...
}
```

### State Preservation

- **`useRef`** — mutable state that survives HMR updates (animation progress, accumulated values). Preferred.
- **`useState`** — also preserved, but changing the **order or number** of hooks resets all state. Add new hooks at the end.
- **Module-scoped variables** (e.g., `let cache = new Map()` above the component) — survive HMR updates even across hook-order changes. Re-initialized only on full reload.

### Imports & Dependencies

Pre-bundled packages (safe to import directly): `react`, `react-dom`, `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/xr`, `@react-three/handle`, `@react-three/rapier`, `@pmndrs/handle`, `@pmndrs/pointer-events`, `@react-spring/three`, and common `three/examples/jsm/...` modules.

- If you need a module not in this list, prefer an alternative from an already-loaded package (e.g., `<Clone>` from drei instead of `SkeletonUtils`).
- If no alternative exists, tell the user: adding that import will require a one-time server restart.

---

## Coding Patterns

### Declarative R3F

Prefer declarative R3F (`<mesh>`, `<boxGeometry>`, etc.) over imperative Three.js. Declarative elements are managed by React's reconciler and update cleanly via HMR.

When using `useFrame`, keep the callback stable (avoid deps that change identity every render).

### XR Interaction — `<Handle>` & `<HandleTarget>`

**Do NOT use `<Interactive>`** — it is deprecated.

Use `<Handle>` and `<HandleTarget>` from `@react-three/handle` for all XR interactions. **Every new object added to the scene must be wrapped in a `<Handle>`** to be interactive in XR.

```tsx
import { Handle, HandleTarget } from "@react-three/handle";
```

**Basic draggable object:**

```tsx
<Handle>
  <mesh>
    <boxGeometry />
    <meshStandardMaterial />
  </mesh>
</Handle>
```

**`<Handle>` props:**

| Prop              | Description                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `translate`       | `false` to disable, `"x"` for single axis, `{ x: false, y: [-1, 1] }` for per-axis limits, `"as-scale"` or `"as-rotate"` to remap drag |
| `rotate`          | `false` to disable, `"x"` for single axis, `{ x: false, y: [0, Math.PI] }` for limits                                                  |
| `scale`           | `false` to disable, `{ uniform: true }` for uniform scaling                                                                            |
| `multitouch`      | `false` to use only the first input device                                                                                             |
| `stopPropagation` | `false` to let events bubble to ancestors                                                                                              |

**Separate handle from target with `<HandleTarget>`:**

```tsx
<HandleTarget>
  <mesh geometry={bodyGeo} material={bodyMat} />
  <Handle
    targetRef="from-context"
    translate="as-rotate"
    rotate={{ x: false, y: false, z: [-Math.PI, 0] }}
  >
    <mesh geometry={handleGeo} material={handleMat} />
  </Handle>
</HandleTarget>
```

**`<Handle>` does NOT accept pointer event props** (`onPointerDown`, `onClick`, etc.). Place them on the child `<mesh>` or `<group>` instead.

For simple pointer events without drag/transform, standard R3F events on `<group>` / `<mesh>` still work fine.

### Grabbable Physics Objects — Handle + RigidBody

Handle moves the mesh visually but Rapier doesn't know about it. To bridge them, **switch the body to kinematic while grabbed** and sync the physics body from the mesh's world position each frame via `useFrame`.

**Structure:** `<RigidBody ref={bodyRef}>` → `<Handle>` → `<mesh ref={meshRef} onPointerDown={...} onPointerUp={...}>`.

**Grab/release flow:**
1. `onPointerDown` → `bodyRef.setBodyType(2, true)` (KinematicPositionBased). Body stops simulating but still pushes other objects.
2. `useFrame` → `meshRef.getWorldPosition(tmp)` → `bodyRef.setNextKinematicTranslation(tmp)` (same for quaternion/rotation).
3. `onPointerUp` → `bodyRef.setBodyType(0, true)` (Dynamic). Gravity and collisions resume.

**Key rules:**
- Pointer events go on the **mesh**, not on `<Handle>`.
- Use `useRef` (not `useState`) for `isGrabbed` and temp vectors — avoids re-renders every frame.
- Rapier body type constants: `0` = Dynamic, `1` = Fixed, `2` = KinematicPositionBased.

### Duplicating GLB Models — Use `<Clone>`, Not `<primitive>`

A Three.js `Object3D` can only have **one parent**. If you render the same `scene` object from `useGLTF` in multiple `<primitive>` elements, it gets reparented each time — only the **last instance** appears. This is a classic Three.js gotcha.

**Always use `<Clone>` from `@react-three/drei` when placing multiple instances of the same model:**

```tsx
import { useGLTF, Clone } from "@react-three/drei";

// ❌ BAD — only the last Tree renders (scene object gets reparented)
function Tree({ position, scale }) {
  const { scene } = useGLTF("/poly-static/some-model.glb");
  return <primitive object={scene} scale={scale} position={position} />;
}

// ✅ GOOD — Clone creates a deep copy, all instances render correctly
function Tree({ position, scale }) {
  const { scene } = useGLTF("/poly-static/some-model.glb");
  return (
    <group position={position}>
      <Clone object={scene} scale={scale} />
    </group>
  );
}
```

**When to use which:**

- **`<primitive>`** — only when a model appears **exactly once** in the scene.
- **`<Clone>`** — whenever a model **may appear multiple times** (preferred default).

---

## 3D Models — Poly Pizza

GLB models are available from the Poly Pizza API. Load them with `useGLTF` from `@react-three/drei`.

### Agent Workflow (Preferred)

When the user asks to add a 3D model, **look up the model yourself at build time** and hardcode the GLB URL. Do not make runtime API calls unless the user explicitly wants dynamic behavior.

**Steps:**

1. **Search** — `curl` to `GET https://api.poly.pizza/v1.1/search/{keyword}` with `x-auth-token` header. **Pick a random model** from the results (vary your choice).
2. **Fetch details** — `GET https://api.poly.pizza/v1.1/model/{id}` to get the full model object.
3. **Extract the `Download` URL** — it looks like `https://static.poly.pizza/<uuid>.glb`. The filename is a UUID, **not** the model ID. You cannot guess it.
4. **Rewrite to proxy path** — replace `https://static.poly.pizza/` with `/poly-static/`.
5. **Hardcode** the proxy path in `useGLTF(...)`.

**How to call the API:**

```bash
# Search
curl -s -H "x-auth-token: $(grep VITE_POLY_PIZZA_API_KEY .env | cut -d= -f2)" \
  "https://api.poly.pizza/v1.1/search/dog"

# Get model details
curl -s -H "x-auth-token: $(grep VITE_POLY_PIZZA_API_KEY .env | cut -d= -f2)" \
  "https://api.poly.pizza/v1.1/model/{id}"
```

> Use `curl` via the Shell tool. Do NOT use `WebFetch` — it cannot send custom headers.

**Why agent-side lookup is better:** no runtime API calls, no loading states, no error handling, no rate-limit risk, simpler component code, and model URLs on `static.poly.pizza` are stable.

Only use client-side API fetches if the user explicitly needs dynamic behavior (e.g., search inside XR, random model each session).

### CORS Proxy

Both `api.poly.pizza` and `static.poly.pizza` lack CORS headers. A Vite proxy is configured:

| Browser path       | Proxied to                      |
| ------------------ | ------------------------------- |
| `/poly-api/...`    | `https://api.poly.pizza/...`    |
| `/poly-static/...` | `https://static.poly.pizza/...` |

**Always use proxy paths in client code:**

```tsx
// ❌ blocked by CORS
const url = "https://static.poly.pizza/<uuid>.glb";

// ❌ model ID is NOT the filename — will 403
const url = "/poly-static/y4wdQpg767.glb";

// ✅ correct: UUID from the Download field, via proxy
const url = "/poly-static/ba6d0ee3-bcc0-4ef0-9d3c-a3e245b41c77.glb";
```

For API calls from client code, use `/poly-api/v1.1/...` instead of `https://api.poly.pizza/v1.1/...`.

### Attribution

- **CC-BY models require attribution** — display the `Attribution` string somewhere visible.
- CC0 models are public domain — no attribution required (but appreciated).

### API Reference

**Authentication:** API key in `.env` as `VITE_POLY_PIZZA_API_KEY`. Pass as `x-auth-token` header.

**Base URL:** `https://api.poly.pizza/v1.1`

**Endpoints:**

| Method | Path                | Returns                                                                                                                       |
| ------ | ------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/search/{keyword}` | `{ total, results: Model[] }` — params: `Limit` (max 32), `Page`, `Category`, `License` (0=CC-BY, 1=CC0), `Animated` (1=only) |
| GET    | `/search`           | Same, but must include at least one filter                                                                                    |
| GET    | `/model/{id}`       | Single `Model` object                                                                                                         |
| GET    | `/list/{id}`        | `{ Models: Model[], Name, ... }`                                                                                              |
| GET    | `/user/{username}`  | `{ username, models: Model[], ... }` — params: `Limit`, `Page`                                                                |

**Model object:**

```json
{
  "ID": "string",
  "Title": "string",
  "Attribution": "string",
  "Thumbnail": "string (.webp URL)",
  "Download": "string (.glb URL — use with useGLTF)",
  "Tri Count": 0,
  "Creator": { "Username": "string", "DPURL": "string" },
  "Category": "string",
  "Tags": ["string"],
  "Licence": "CC0 1.0 | CC-BY 3.0",
  "Animated": false
}
```

**Categories:**

| Index | Category          | Index | Category               |
| ----- | ----------------- | ----- | ---------------------- |
| 0     | Food & Drink      | 6     | Nature                 |
| 1     | Clutter           | 7     | Animals                |
| 2     | Weapons           | 8     | Buildings/Architecture |
| 3     | Transport         | 9     | People & Characters    |
| 4     | Furniture & Decor | 10    | Scenes & Levels        |
| 5     | Objects           | 11    | Other                  |

---

## Atomic Edits — No Broken Intermediate States

Every file save triggers Vite HMR instantly. If the file is in a broken state between sequential edits, the runtime error causes a **full page reload and kills the XR session**.

**Rule: Never leave the file in a broken intermediate state between `StrReplace` calls.**

| Strategy                                   | When to use                                                                                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Single `StrReplace` with a large block** | Changes span a contiguous or nearby region — select a block that covers all related changes                                                             |
| **`Write` to replace the entire file**     | Changes span many distant locations that can't fit in one replace                                                                                       |
| **Order edits safely**                     | If you must use multiple `StrReplace` calls, remove **usages** before **declarations** — an unused variable is harmless, a missing reference is a crash |

```tsx
// ❌ BAD — edit 1 removes declaration, edit 2 removes usage
// After edit 1, file is broken: JSX still references deleted ref
StrReplace: remove `const fooRef = useRef(null)`  // 💥 broken state saved here
StrReplace: remove `ref={fooRef}` from JSX

// ✅ GOOD — single edit covers both declaration and usage
StrReplace: replace entire block from declaration through JSX

// ✅ ALSO GOOD — safe ordering (usage removed first)
StrReplace: remove `ref={fooRef}` from JSX  // file is valid (unused variable)
StrReplace: remove `const fooRef = useRef(null)`
```

---

## Pre-Edit Checklist

Before every edit, verify:

1. Am I only editing files in `src/components/`?
2. Does every file only export React components?
3. Are there any new module-level side effects?
4. Did I change the order/number of hooks? (warn user about state reset)
5. Are new files imported only from within `src/components/`?
6. Did I add a new dependency? (ask user first)
7. Did I run lints after creating a new file?
8. **Will any intermediate save leave the file in a broken state?** If yes, combine into a single edit or use `Write`.
