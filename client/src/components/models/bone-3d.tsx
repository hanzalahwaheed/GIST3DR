"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Card } from "@/components/ui/card";

interface Bone3DProps {
  modelPath: string | null;
}

type MovementKey = "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown" | "w" | "s";

function isMovementKey(key: string): key is MovementKey {
  return ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "w", "s"].includes(key);
}

export default function Bone3D({ modelPath }: Bone3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!modelPath || !mountRef.current) {
      return;
    }

    const mountNode = mountRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    const width = mountNode.clientWidth;
    const height = mountNode.clientHeight;

    const camera = new THREE.PerspectiveCamera(75, width / Math.max(height, 1), 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mountNode.appendChild(renderer.domElement);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    hemisphereLight.position.set(0.5, 1, 0.25);
    scene.add(hemisphereLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    const loader = new OBJLoader();
    loader.load(
      modelPath,
      (object: THREE.Group) => {
        object.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.material = new THREE.MeshStandardMaterial({
              color: 0xffffff,
              metalness: 0.8,
              roughness: 0.3,
            });
          }
        });

        scene.add(object);

        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        object.position.sub(center);

        const scale = 0.75;
        object.scale.set(scale, scale, scale);
      },
      undefined,
      () => {
        // Model-loading failures are surfaced by the page-level fallback.
      },
    );

    camera.position.set(25, 25, 25);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 100;
    controls.enableZoom = true;
    controls.zoomSpeed = 1.0;
    controls.target.set(0, 0, 0);
    controls.enablePan = true;

    const keyboardControls: Record<MovementKey, boolean> = {
      ArrowLeft: false,
      ArrowRight: false,
      ArrowUp: false,
      ArrowDown: false,
      w: false,
      s: false,
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (isMovementKey(event.key)) {
        keyboardControls[event.key] = true;
      }
    };

    const handleKeyUp = (event: KeyboardEvent): void => {
      if (isMovementKey(event.key)) {
        keyboardControls[event.key] = false;
      }
    };

    let animationFrameId = 0;
    const animate = (): void => {
      animationFrameId = window.requestAnimationFrame(animate);

      const moveSpeed = 1;
      if (keyboardControls.ArrowLeft) {
        camera.position.x -= moveSpeed;
        controls.target.x -= moveSpeed;
      }
      if (keyboardControls.ArrowRight) {
        camera.position.x += moveSpeed;
        controls.target.x += moveSpeed;
      }
      if (keyboardControls.ArrowUp) {
        camera.position.z -= moveSpeed;
        controls.target.z -= moveSpeed;
      }
      if (keyboardControls.ArrowDown) {
        camera.position.z += moveSpeed;
        controls.target.z += moveSpeed;
      }
      if (keyboardControls.w) {
        camera.position.y += moveSpeed;
        controls.target.y += moveSpeed;
      }
      if (keyboardControls.s) {
        camera.position.y -= moveSpeed;
        controls.target.y -= moveSpeed;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    const handleResize = (): void => {
      const newWidth = mountNode.clientWidth;
      const newHeight = mountNode.clientHeight;
      camera.aspect = newWidth / Math.max(newHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("resize", handleResize);
    animate();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      controls.dispose();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (mountNode.contains(renderer.domElement)) {
        mountNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [modelPath]);

  if (!modelPath) {
    return (
      <Card className="flex h-[500px] w-full items-center justify-center p-4 text-center text-sm text-gray-300">
        3D bone model is not available for this type.
      </Card>
    );
  }

  return (
    <Card className="relative w-full p-1">
      <div ref={mountRef} style={{ width: "100%", height: "500px" }} />
    </Card>
  );
}
