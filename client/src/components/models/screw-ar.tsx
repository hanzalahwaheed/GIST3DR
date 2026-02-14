"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";

interface ScrewARProps {
  screwHeight?: number;
  screwRadius?: number;
  headHeight?: number;
}

export default function ScrewAR({
  screwHeight = 0.2,
  screwRadius = 0.03,
  headHeight = 0.04,
}: ScrewARProps): null {
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / Math.max(window.innerHeight, 1), 0.01, 20);

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

    const scaledHeight = screwHeight * 0.01 * 0.1;
    const scaledRadius = screwRadius * 0.01 * 0.1;
    const scaledHeadHeight = headHeight * 2.5 * 0.1;

    const headRadius = scaledRadius * 1.4;
    const headGeometry = new THREE.CylinderGeometry(headRadius, headRadius, scaledHeadHeight, 32);
    const screwMaterial = new THREE.MeshStandardMaterial({
      color: 0xc0c0c0,
      metalness: 0.7,
      roughness: 0.3,
    });

    const head = new THREE.Mesh(headGeometry, screwMaterial);
    head.position.y = scaledHeight / 2 + scaledHeadHeight / 2;

    const bodyGeometry = new THREE.CylinderGeometry(scaledRadius, scaledRadius * 0.8, scaledHeight, 32);
    const body = new THREE.Mesh(bodyGeometry, screwMaterial);

    const screwGroup = new THREE.Group();
    screwGroup.add(head);
    screwGroup.add(body);

    screwGroup.position.x = -0.2;
    screwGroup.position.z = -0.5;
    screwGroup.position.y = 0;
    scene.add(screwGroup);

    const arButton = ARButton.createButton(renderer);
    document.body.appendChild(arButton);

    const handleResize = (): void => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / Math.max(window.innerHeight, 1);
      camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", handleResize);

    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);

      if (renderer.domElement.parentNode === document.body) {
        document.body.removeChild(renderer.domElement);
      }

      if (arButton.parentNode === document.body) {
        document.body.removeChild(arButton);
      }

      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, [screwHeight, screwRadius, headHeight]);

  return null;
}
