import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { StockItem } from '../types/stock';
import { Box, RotateCw, Cpu } from 'lucide-react';

interface ThreeStockViewerProps {
  items: StockItem[];
  selectedItemId?: string;
  onSelectItem: (item: StockItem) => void;
}

export const ThreeStockViewer: React.FC<ThreeStockViewerProps> = ({
  items,
  selectedItemId,
  onSelectItem,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeItem, setActiveItem] = useState<StockItem | undefined>(
    items.find((i) => i.id === selectedItemId) || items[0]
  );
  const [isRotating, setIsRotating] = useState(true);

  useEffect(() => {
    if (items.length > 0 && !items.find((i) => i.id === activeItem?.id)) {
      setActiveItem(items[0]);
    }
  }, [items]);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 2.5, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x60a5fa, 2.5, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const cyanPointLight = new THREE.PointLight(0x06b6d4, 2, 50);
    cyanPointLight.position.set(-5, -2, -5);
    scene.add(cyanPointLight);

    const crateGroup = new THREE.Group();
    scene.add(crateGroup);

    const boxGeometry = new THREE.BoxGeometry(2, 1.4, 1.4);
    const boxMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      metalness: 0.2,
      roughness: 0.1,
      transmission: 0.7,
      transparent: true,
      opacity: 0.85,
      ior: 1.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
    crateGroup.add(boxMesh);

    const wireGeo = new THREE.EdgesGeometry(boxGeometry);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    crateGroup.add(wireframe);

    const coreGeo = new THREE.OctahedronGeometry(0.4, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      wireframe: true,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    crateGroup.add(coreMesh);

    const ringGeo = new THREE.RingGeometry(1.5, 1.55, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = -1.0;
    scene.add(ringMesh);

    const gridHelper = new THREE.GridHelper(10, 20, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = -1.2;
    scene.add(gridHelper);

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (isRotating) {
        crateGroup.rotation.y = elapsedTime * 0.4;
      }
      coreMesh.rotation.x = elapsedTime * 0.8;
      coreMesh.rotation.z = elapsedTime * 0.5;

      crateGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.1;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isRotating]);

  return (
    <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
        <div className="flex items-center gap-2">
          <Box className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300">
            3D Holographic Asset Inspection
          </h2>
        </div>

        <button
          onClick={() => setIsRotating(!isRotating)}
          className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            isRotating ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
          {isRotating ? 'Rotation ON' : 'Paused'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        <div className="lg:col-span-7 relative h-72 sm:h-80 w-full bg-slate-950/80 rounded-xl border border-cyan-500/20 overflow-hidden flex items-center justify-center">
          <div ref={mountRef} className="w-full h-full" />

          <div className="absolute top-3 left-3 bg-slate-900/90 border border-cyan-500/40 px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-300 flex items-center gap-2 backdrop-blur-md">
            <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>SPECIMEN: {activeItem?.code || 'ITM-101'}</span>
          </div>

          <div className="absolute bottom-3 right-3 bg-slate-900/90 border border-cyan-500/40 px-3 py-1 rounded-lg text-[11px] font-mono text-slate-300">
            Serials Count: <span className="text-cyan-400 font-bold">{activeItem?.serials?.length || 0}</span>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-3">
          {activeItem ? (
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-cyan-400 font-mono font-bold">{activeItem.code}</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-bold uppercase border border-cyan-500/30">
                  Qty: {activeItem.serials?.length || 0}
                </span>
              </div>

              <h3 className="text-base font-bold text-white">{activeItem.name}</h3>
              <p className="text-xs text-slate-400">Model: <span className="text-slate-200 font-semibold">{activeItem.model}</span></p>

              <div className="pt-2 border-t border-slate-800 font-mono text-xs text-slate-300 space-y-1">
                <div>Location: <span className="text-amber-300">{activeItem.location || 'Warehouse'}</span></div>
                <div>Category: <span className="text-slate-300">{activeItem.category || 'General'}</span></div>
                <div className="pt-1">
                  <span className="text-slate-400 block text-[11px] mb-1">Serials:</span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {activeItem.serials && activeItem.serials.length > 0 ? (
                      activeItem.serials.map((s, idx) => (
                        <span key={idx} className="bg-slate-900 border border-cyan-500/30 text-cyan-300 px-1.5 py-0.5 rounded text-[10px]">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 italic text-[10px]">No serials</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Select an item below to inspect in 3D.</p>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Select Specimen ({items.length})
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveItem(item);
                    onSelectItem(item);
                  }}
                  className={`px-2.5 py-1 text-xs rounded-lg font-mono transition-colors whitespace-nowrap shrink-0 ${
                    activeItem?.id === item.id
                      ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {item.code} - {item.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
