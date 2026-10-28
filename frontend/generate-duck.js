import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'fs';
import path from 'path';

// Robust Node.js polyfill for FileReader used by GLTFExporter
globalThis.FileReader = class FileReader {
  constructor() {
    this.onloadend = null;
    this.onload = null;
    this.onerror = null;
    this.result = null;
  }

  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (typeof this.onloadend === 'function') this.onloadend();
      if (typeof this.onload === 'function') this.onload({ target: this });
    }).catch((err) => {
      if (typeof this.onerror === 'function') this.onerror(err);
    });
  }

  readAsDataURL(blob) {
    blob.arrayBuffer().then((buf) => {
      const b64 = Buffer.from(buf).toString('base64');
      this.result = `data:application/octet-stream;base64,${b64}`;
      if (typeof this.onloadend === 'function') this.onloadend();
      if (typeof this.onload === 'function') this.onload({ target: this });
    }).catch((err) => {
      if (typeof this.onerror === 'function') this.onerror(err);
    });
  }
};

// Create realistic rubber duck 3D scene hierarchy
const duckGroup = new THREE.Group();
duckGroup.name = 'RubberDuck';

// PBR Materials for authentic rubber / bath toy aesthetic
const duckYellowMaterial = new THREE.MeshStandardMaterial({
  color: 0xffcd00,
  roughness: 0.25,
  metalness: 0.05,
  name: 'DuckYellowPBR',
});

const beakOrangeMaterial = new THREE.MeshStandardMaterial({
  color: 0xff5a14,
  roughness: 0.32,
  metalness: 0.02,
  name: 'BeakOrangePBR',
});

const eyeBlackMaterial = new THREE.MeshStandardMaterial({
  color: 0x0a0a0f,
  roughness: 0.12,
  metalness: 0.3,
  name: 'EyeBlackPBR',
});

const eyePupilWhiteMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.18,
  metalness: 0.08,
  name: 'EyePupilWhitePBR',
});

// 1. Duck Body (Hydrodynamic teardrop / buoy shape)
const bodyGeometry = new THREE.SphereGeometry(1.0, 36, 28);
bodyGeometry.scale(1.08, 0.9, 1.38);
const bodyMesh = new THREE.Mesh(bodyGeometry, duckYellowMaterial);
bodyMesh.name = 'DuckBody';
bodyMesh.castShadow = true;
bodyMesh.receiveShadow = true;
duckGroup.add(bodyMesh);

// 2. Duck Tail (upturned buoyant tail)
const tailGeometry = new THREE.ConeGeometry(0.38, 0.85, 24);
tailGeometry.rotateX(-Math.PI * 0.42);
const tailMesh = new THREE.Mesh(tailGeometry, duckYellowMaterial);
tailMesh.position.set(0, 0.45, -1.28);
tailMesh.castShadow = true;
duckGroup.add(tailMesh);

// 3. Duck Head & Neck
const headGeometry = new THREE.SphereGeometry(0.7, 36, 28);
headGeometry.scale(0.92, 1.02, 0.96);
const headMesh = new THREE.Mesh(headGeometry, duckYellowMaterial);
headMesh.position.set(0, 1.12, 0.65);
headMesh.castShadow = true;
duckGroup.add(headMesh);

const neckGeometry = new THREE.CylinderGeometry(0.48, 0.66, 0.65, 24);
const neckMesh = new THREE.Mesh(neckGeometry, duckYellowMaterial);
neckMesh.position.set(0, 0.68, 0.46);
neckMesh.rotation.x = 0.2;
duckGroup.add(neckMesh);

// 4. Duck Wings (Left and Right)
const wingGeometry = new THREE.SphereGeometry(0.58, 24, 20);
wingGeometry.scale(0.28, 0.68, 1.08);

const leftWing = new THREE.Mesh(wingGeometry, duckYellowMaterial);
leftWing.position.set(0.98, 0.22, -0.05);
leftWing.rotation.set(0.12, 0.1, -0.25);
leftWing.castShadow = true;
duckGroup.add(leftWing);

const rightWing = new THREE.Mesh(wingGeometry, duckYellowMaterial);
rightWing.position.set(-0.98, 0.22, -0.05);
rightWing.rotation.set(0.12, -0.1, 0.25);
rightWing.castShadow = true;
duckGroup.add(rightWing);

// 5. Duck Beak (Sculpted Duck Bill)
const topBillGeo = new THREE.CylinderGeometry(0.28, 0.36, 0.58, 24);
topBillGeo.scale(1.25, 0.45, 1.05);
topBillGeo.rotateX(Math.PI * 0.5);
const topBillMesh = new THREE.Mesh(topBillGeo, beakOrangeMaterial);
topBillMesh.position.set(0, 1.04, 1.3);
topBillMesh.rotation.x = -0.05;
topBillMesh.castShadow = true;
duckGroup.add(topBillMesh);

const bottomBillGeo = new THREE.CylinderGeometry(0.22, 0.3, 0.42, 24);
bottomBillGeo.scale(1.15, 0.35, 0.9);
bottomBillGeo.rotateX(Math.PI * 0.5);
const bottomBillMesh = new THREE.Mesh(bottomBillGeo, beakOrangeMaterial);
bottomBillMesh.position.set(0, 0.92, 1.22);
duckGroup.add(bottomBillMesh);

// 6. Eyes with catchlights (reflecting swimming pool light)
const eyeGeo = new THREE.SphereGeometry(0.11, 20, 20);
const leftEye = new THREE.Mesh(eyeGeo, eyeBlackMaterial);
leftEye.position.set(0.42, 1.28, 0.98);
duckGroup.add(leftEye);

const rightEye = new THREE.Mesh(eyeGeo, eyeBlackMaterial);
rightEye.position.set(-0.42, 1.28, 0.98);
duckGroup.add(rightEye);

const catchlightGeo = new THREE.SphereGeometry(0.038, 14, 14);
const leftCatch = new THREE.Mesh(catchlightGeo, eyePupilWhiteMaterial);
leftCatch.position.set(0.45, 1.32, 1.05);
duckGroup.add(leftCatch);

const rightCatch = new THREE.Mesh(catchlightGeo, eyePupilWhiteMaterial);
rightCatch.position.set(-0.45, 1.32, 1.05);
duckGroup.add(rightCatch);

// Center pivot and ground baseline
duckGroup.position.set(0, 0, 0);

// Export to GLB
const exporter = new GLTFExporter();
exporter.parse(
  duckGroup,
  (gltf) => {
    const outPath = path.resolve('public/rubber_duck.glb');
    fs.writeFileSync(outPath, Buffer.from(gltf));
    console.log(`>>> Successfully exported rubber_duck.glb (${gltf.byteLength} bytes) to ${outPath}`);
  },
  (err) => {
    console.error('Error generating GLB:', err);
  },
  { binary: true }
);
