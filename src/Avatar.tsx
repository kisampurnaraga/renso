import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
type Props = { color: string; agent: string; speaking: boolean; musicPlaying?: boolean; reduced: boolean };
function Block({ position, size, color }: { position: [number,number,number]; size: [number,number,number]; color: string }) {
  return <mesh position={position}><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={0.65}/></mesh>;
}
function Character({ color, agent, speaking, musicPlaying, reduced }: Props) {
  const body = useRef<THREE.Group>(null);
  const aura = useRef<THREE.Mesh>(null);
  const mouth = useRef<THREE.Mesh>(null);
  const arm = useRef<THREE.Group>(null);
  useFrame(({clock}) => {
    const t = clock.elapsedTime;
    if(body.current) { body.current.position.y = reduced ? 0 : Math.sin(t*(musicPlaying?3.2:1.8))*(musicPlaying?0.1:0.065); body.current.rotation.y = reduced ? -0.15 : -0.15+Math.sin(t*0.5)*0.09; }
    if(aura.current) aura.current.scale.setScalar(reduced ? 1 : 1+Math.sin(t*(speaking?8:2))*0.035);
    if(mouth.current) mouth.current.scale.y = speaking && !reduced ? 1.5+Math.sin(t*18)*0.9 : 1;
    if(arm.current) arm.current.rotation.z = reduced ? -0.12 : -0.12+Math.sin(t*(musicPlaying?3.2:2))*(musicPlaying?0.22:0.07);
  });
  const outfit = agent === 'teduh' ? '#7c86dc' : '#ed9c60';
  return <>
    <mesh ref={aura} position={[0,0.4,-0.3]}><sphereGeometry args={[1.55,24,16]}/><meshBasicMaterial color={color} transparent opacity={0.09} depthWrite={false}/></mesh>
    <group ref={body}>
      <Block position={[0,1.25,0]} size={[1.13,0.98,0.85]} color="#e1c9b2"/>
      <Block position={[0,1.77,0]} size={[1.17,0.15,0.89]} color="#24283c"/>
      <Block position={[-0.57,1.4,0]} size={[0.15,0.5,0.94]} color="#24283c"/>
      <Block position={[0.57,1.4,0]} size={[0.15,0.5,0.94]} color="#24283c"/>
      <Block position={[-0.245,1.32,0.435]} size={[0.10,0.14,0.025]} color="#22243c"/>
      <Block position={[0.245,1.32,0.435]} size={[0.10,0.14,0.025]} color="#22243c"/>
      <mesh ref={mouth} position={[0,1.08,0.445]}><boxGeometry args={[0.17,0.045,0.025]}/><meshBasicMaterial color="#705150"/></mesh>
      <Block position={[0,0.4,0]} size={[0.94,0.75,0.62]} color={outfit}/>
      <Block position={[0,0.43,0.322]} size={[0.27,0.22,0.025]} color={color}/>
      <Block position={[-0.68,0.4,0]} size={[0.3,0.7,0.4]} color={outfit}/>
      <Block position={[-0.68,-0.04,0]} size={[0.29,0.2,0.38]} color="#e1c9b2"/>
      <group ref={arm} position={[0.63,0.7,0]}>
        <Block position={[0,-0.3,0]} size={[0.3,0.7,0.4]} color={outfit}/>
        <Block position={[0,-0.74,0]} size={[0.29,0.2,0.38]} color="#e1c9b2"/>
      </group>
      <Block position={[-0.26,-0.32,0]} size={[0.36,0.66,0.45]} color="#30364e"/>
      <Block position={[0.26,-0.32,0]} size={[0.36,0.66,0.45]} color="#30364e"/>
      <Block position={[-0.26,-0.72,0.10]} size={[0.43,0.19,0.66]} color="#f2efe8"/>
      <Block position={[0.26,-0.72,0.10]} size={[0.43,0.19,0.66]} color="#f2efe8"/>
    </group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.89,0]}><ringGeometry args={[1.0,1.04,64]}/><meshBasicMaterial color={color} transparent opacity={0.65} side={THREE.DoubleSide}/></mesh>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.9,0]}><circleGeometry args={[1.05,64]}/><meshBasicMaterial color={color} transparent opacity={0.09}/></mesh>
  </>;
}
export default function Avatar(props: Props) {
  return <Canvas camera={{position:[3,2,5],fov:38}} dpr={[1,1.5]} gl={{antialias:true,alpha:true}} aria-label={`Avatar ${props.agent} dengan aura pilihanmu`}>
    <ambientLight intensity={1.5}/><directionalLight position={[3,5,4]} intensity={2}/><pointLight position={[-3,1,2]} color={props.color} intensity={8}/>
    <group position={[0,-0.25,0]}><Character {...props}/></group>
  </Canvas>;
}
