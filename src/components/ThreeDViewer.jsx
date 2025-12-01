import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { OrbitControls, useGLTF } from "@react-three/drei";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

function Element3DModel({ url }) {
  const gltf = useGLTF(url, true);

  return (
    <primitive object={gltf.scene} scale={3.5} />   // BIGGER SCALE
  );
}

export function ThreeDViewer({ open, onOpenChange, modelUrl, elementName, isDark }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={clsx(
          "max-w-4xl w-[90%]  p-3 rounded-2xl overflow-hidden",
          isDark ? "bg-black/90" : "bg-white"
        )}
      >
        <DialogHeader>
          <DialogTitle>{elementName} — 3D Model</DialogTitle>
        </DialogHeader>

        <div className="w-full sm:h-[70vh] h-[50vh]" >
          <Canvas camera={{ position: [6, 6, 6], fov: 45 }}> {/* bigger view */}
            {/* improved lighting */}
            <ambientLight intensity={0.55} />
            <directionalLight position={[10, 10, 5]} intensity={1.1} />
            <directionalLight position={[-10, -10, -5]} intensity={0.6} />

            <Suspense fallback={null}>
              <Element3DModel url={modelUrl} />
            </Suspense>

            {/* allows large model rotation */}
            <OrbitControls enableZoom={true} makeDefault />
          </Canvas>
        </div>

        <DialogFooter className="flex justify-end p-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
