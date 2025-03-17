import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Model({ url, rotation = 0 }) {
  const { scene, animations } = useGLTF(url);
  const mixer = new THREE.AnimationMixer(scene);

  // Apply rotation
  scene.rotation.y = THREE.MathUtils.degToRad(rotation);

  // Play all animations
  animations.forEach((clip) => {
    const action = mixer.clipAction(clip);
    action.play();
  });


  

  useFrame((state, delta) => {
    mixer.update(delta);
  });

  return <primitive object={scene} scale={18} position={[0, -31, -1]} />;
}

const Avatar = ({ currentView, modelUrl = '/3dmodel/model2.glb' }) => {
  const angleMap = {
    'center': 0,
    'centerTop': 0,
    'halfLeft': 45,
    'halfLeftTop': 45,
    'fullLeft': 90,
    'fullLeftTop': 90,
    'halfRight': -45,
    'halfRightTop': -45,
    'fullRight': -90,
    'fullRightTop': -90
  };

  const rotation = angleMap[currentView] || 0;

  return (
    <div className="w-full h-64 bg-transparent rounded-lg overflow-hidden">
      <Canvas
        camera={{ position: [-8, 2, 15], fov: 50 }}
        style={{
          width: '100%',
          height: '100%',
          background: 'transparent',
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[-2, 4, 5]} 
          intensity={2} 
        />

        <Suspense fallback={null}>
          <Model url={modelUrl} rotation={rotation} />
        </Suspense>

        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={10}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
};

export default Avatar;