import { Canvas } from "@react-three/fiber";
import { XR, createXRStore } from "@react-three/xr";
import { XRScene } from "./components/XRScene";

const store = createXRStore();

export function App() {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <button
        onClick={() => store.enterVR()}
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          padding: "8px 16px",
          fontSize: 18,
          minHeight: 48,
          cursor: "pointer",
          zIndex: 1000,
        }}
      >
        Enter VR
      </button>
      <button
        onClick={() => store.enterAR()}
        style={{
          position: "absolute",
          top: 16,
          left: 150,
          padding: "8px 16px",
          fontSize: 18,
          minHeight: 48,
          cursor: "pointer",
          zIndex: 1000,
        }}
      >
        Enter AR
      </button>
      <Canvas style={{ width: "100%", height: "100%" }}>
        <XR store={store}>
          <XRScene />
        </XR>
      </Canvas>
    </div>
  );
}
