import { useXRPlanes, XRSpace, XRPlaneModel } from "@react-three/xr";
import { RigidBody, CuboidCollider } from "@react-three/rapier";

export function RoomMeshes({ visible = false }: { visible?: boolean } = {}) {
  const planes = useXRPlanes();

  return (
    <>
      {planes.map((plane, index) => {
        let minX = Infinity;
        let maxX = -Infinity;
        let minZ = Infinity;
        let maxZ = -Infinity;

        for (const point of plane.polygon) {
          if (point.x < minX) minX = point.x;
          if (point.x > maxX) maxX = point.x;
          if (point.z < minZ) minZ = point.z;
          if (point.z > maxZ) maxZ = point.z;
        }

        const halfX = Math.max((maxX - minX) * 0.5, 0.01);
        const halfZ = Math.max((maxZ - minZ) * 0.5, 0.01);
        const centerX = (minX + maxX) * 0.5;
        const centerZ = (minZ + maxZ) * 0.5;

        return (
          <XRSpace key={index} space={plane.planeSpace}>
            <RigidBody type="fixed">
              <CuboidCollider
                args={[halfX, 0.02, halfZ]}
                position={[centerX, 0, centerZ]}
              />
              <XRPlaneModel plane={plane}>
                <meshStandardMaterial
                  color="#8080ff"
                  visible={visible}
                  wireframe={true}
                  opacity={0.5}
                  transparent={true}
                />
              </XRPlaneModel>
            </RigidBody>
          </XRSpace>
        );
      })}
    </>
  );
}
