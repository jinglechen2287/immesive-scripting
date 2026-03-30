import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  optimizeDeps: {
    include: [
      // React core
      "react",
      "react-dom",
      // Three.js core
      "three",
      // Three.js utilities
      "three/examples/jsm/utils/SkeletonUtils.js",
      "three/examples/jsm/utils/BufferGeometryUtils.js",
      // Loaders
      "three/examples/jsm/loaders/DRACOLoader.js",
      "three/examples/jsm/loaders/KTX2Loader.js",
      "three/examples/jsm/loaders/GLTFLoader.js",
      "three/examples/jsm/loaders/FBXLoader.js",
      "three/examples/jsm/loaders/OBJLoader.js",
      "three/examples/jsm/loaders/MTLLoader.js",
      "three/examples/jsm/loaders/SVGLoader.js",
      "three/examples/jsm/loaders/RGBELoader.js",
      "three/examples/jsm/loaders/EXRLoader.js",
      // Post-processing
      "three/examples/jsm/postprocessing/EffectComposer.js",
      "three/examples/jsm/postprocessing/RenderPass.js",
      "three/examples/jsm/postprocessing/UnrealBloomPass.js",
      "three/examples/jsm/postprocessing/ShaderPass.js",
      "three/examples/jsm/postprocessing/OutputPass.js",
      // Controls (useful outside XR)
      "three/examples/jsm/controls/OrbitControls.js",
      // Geometry utilities
      "three/examples/jsm/geometries/TextGeometry.js",
      // CSG / boolean operations
      "three/examples/jsm/math/MeshSurfaceSampler.js",
      // Animation
      "three/examples/jsm/animation/CCDIKSolver.js",
      // R3F ecosystem
      "@react-three/fiber",
      "@react-three/drei",
      "@react-three/xr",
      "@react-three/handle",
      "@react-three/rapier",
      // pmndrs internals (used by @react-three/xr and @react-three/handle)
      "@pmndrs/handle",
      "@pmndrs/pointer-events",
      // Spring animations
      "@react-spring/three",
    ],
  },
  server: {
    proxy: {
      "/poly-api": {
        target: "https://api.poly.pizza",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/poly-api/, ""),
        secure: true,
      },
      "/poly-static": {
        target: "https://static.poly.pizza",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/poly-static/, ""),
        secure: true,
      },
    },
  },
});
