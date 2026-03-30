import { RigidBody, CuboidCollider, Physics } from "@react-three/rapier";

function Floor() {
  return (
    <RigidBody type="fixed" position={[0, 0, 0]} userData={{ isFloor: true }}>
      <CuboidCollider args={[50, 0.01, 50]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#93c5fd" transparent={true} opacity={0} />
      </mesh>
    </RigidBody>
  );
}

export function XRScene() {
  return (
    <Physics>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 5, 2]} intensity={1} />
      <Floor />
      {/* <IfInSessionMode deny="immersive-vr">
        <RoomMeshes visible={true} />
      </IfInSessionMode> */}
    </Physics>
  );
}
