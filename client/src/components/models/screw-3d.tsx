"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface Screw3DProps {
  containerWidth?: string;
  containerHeight?: string;
  screwHeight?: number;
  screwRadius?: number;
  headHeight?: number;
}

export default function Screw3D({
  containerWidth = "100%",
  containerHeight = "500px",
  screwHeight = 0.5,
  screwRadius = 0.15,
  headHeight = 0.2,
}: Screw3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) {
      return;
    }

    const mountNode = mountRef.current;
    const width = mountNode.clientWidth;
    const height = mountNode.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    mountNode.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, width / Math.max(height, 1), 0.01, 20);
    camera.position.y = 0;
    camera.position.z = 1.3;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x8888bb, 1.0);
    hemisphereLight.position.set(0, 1, 0);
    scene.add(hemisphereLight);

    const frontLight = new THREE.DirectionalLight(0xffffff, 1.5);
    frontLight.position.set(0, 0, 5);
    scene.add(frontLight);

    const topLight = new THREE.DirectionalLight(0xffffff, 1.0);
    topLight.position.set(0, 5, 0);
    scene.add(topLight);

    const sideLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sideLight.position.set(5, 0, 0);
    scene.add(sideLight);

    const screwMaterial = new THREE.MeshStandardMaterial({
      color: 0xc0c0c0,
      metalness: 0.7,
      roughness: 0.3,
    });

    const scaledHeight = screwHeight * 0.01;
    const scaledRadius = screwRadius * 0.01;
    const scaledHeadHeight = headHeight;

    const headRadius = scaledRadius * 1.4;

    const headGeometry = new THREE.CylinderGeometry(headRadius, headRadius, scaledHeadHeight, 32);
    const head = new THREE.Mesh(headGeometry, screwMaterial);
    head.position.y = scaledHeight / 2 + scaledHeadHeight / 2;

    const bodyGeometry = new THREE.CylinderGeometry(scaledRadius, scaledRadius * 0.8, scaledHeight, 32);
    const body = new THREE.Mesh(bodyGeometry, screwMaterial);

    const screwGroup = new THREE.Group();
    screwGroup.add(head);
    screwGroup.add(body);
    scene.add(screwGroup);

    const createTextSprite = (text: string, position: THREE.Vector3): THREE.Sprite => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) {
        const fallbackSprite = new THREE.Sprite(new THREE.SpriteMaterial());
        fallbackSprite.position.copy(position);
        return fallbackSprite;
      }

      context.font = "Bold 20px Arial";
      context.fillStyle = "white";
      context.fillText(text, 10, 50);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.copy(position);
      sprite.scale.set(0.7, 0.5, 1);
      return sprite;
    };

    const heightLabel = createTextSprite(
      `Height: ${screwHeight}mm`,
      new THREE.Vector3(0, scaledHeight + 0.1, 0),
    );
    scene.add(heightLabel);

    const widthLabel = createTextSprite(
      `Width: ${(screwRadius * 2) / 2}mm`,
      new THREE.Vector3(scaledRadius * 3, 0, 0.2),
    );
    scene.add(widthLabel);

    let animationFrameId = 0;
    const animate = (): void => {
      animationFrameId = window.requestAnimationFrame(animate);
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

    window.addEventListener("resize", handleResize);
    animate();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      if (mountNode.contains(renderer.domElement)) {
        mountNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [screwHeight, screwRadius, headHeight]);

  return (
    <div
      ref={mountRef}
      style={{
        width: containerWidth,
        height: containerHeight,
        minHeight: containerHeight,
        position: "relative",
      }}
    />
  );
}
