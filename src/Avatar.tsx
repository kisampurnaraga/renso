import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
type Props = { color: string; agent: string; speaking: boolean; musicPlaying?: boolean; reduced: boolean; workActivity?: 'design'|'coding'|'writing'|'study'|'other'|null; workMode?: 'calm'|'cheerful'; workstation?: 'laptop'|'desktop' };
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
function WorkScreen({ activity }: { activity: Props['workActivity'] }) {
  const isDesign = activity === 'design';
  return <group>
    <Block position={[0,0,0]} size={[1.05,0.65,0.055]} color="#29314e"/>
    <Block position={[0,0,0.033]} size={[0.94,0.53,0.014]} color={isDesign ? '#efe7ff' : '#eaf4ff'}/>
    <Block position={[-0.34,0.20,0.045]} size={[0.17,0.025,0.008]} color="#8f76d7"/>
    {isDesign ? <>
      <Block position={[-0.19,-0.015,0.047]} size={[0.30,0.27,0.008]} color="#a8d8ee"/>
      <mesh position={[-0.18,0.025,0.057]}><circleGeometry args={[0.075,20]}/><meshBasicMaterial color="#ffd26e"/></mesh>
      <Block position={[0.20,0.03,0.048]} size={[0.27,0.12,0.008]} color="#fa9fbb"/>
      <Block position={[0.20,-0.105,0.048]} size={[0.27,0.065,0.008]} color="#ad91ee"/>
    </> : Array.from({length: 5}, (_,i) => <Block key={i} position={[-0.04+(i%2)*0.07,0.115-i*0.067,0.047]} size={[0.60-(i%3)*0.11,0.02,0.008]} color={activity === 'coding' ? ['#7e7be0','#66b6ab','#de9f6e'][i%3] : '#97a4c5'}/>)}
  </group>;
}
function WorkRoom(props: Props) {
  const leftHand = useRef<THREE.Group>(null);
  const rightHand = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const mouth = useRef<THREE.Mesh>(null);
  const cheerful = props.workMode === 'cheerful';
  const outfit = props.agent === 'teduh' ? '#9290ed' : '#f5ac64';
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if(leftHand.current) leftHand.current.position.y = props.reduced ? 0 : Math.sin(t * (cheerful ? 7 : 4)) * 0.035;
    if(rightHand.current) rightHand.current.position.y = props.reduced ? 0 : Math.sin(t * (cheerful ? 7 : 4) + 1.7) * 0.035;
    if(head.current) head.current.rotation.z = props.reduced ? 0 : Math.sin(t * 1.4) * 0.035;
    if(mouth.current) mouth.current.scale.y = props.speaking && !props.reduced ? 1.4 + Math.sin(t * 18) * 0.6 : 1;
  });
  return <group position={[0,-0.40,0]}>
    {/* A compact, open-front office diorama keeps the face and screen visible together. */}
    <Block position={[0,-0.78,0]} size={[3.65,0.12,2.9]} color="#d9d1f4"/>
    <Block position={[0,0.60,-1.4]} size={[3.65,2.7,0.10]} color="#e8e4fb"/>
    <Block position={[-1.78,0.20,-0.60]} size={[0.08,1.9,1.65]} color="#dedcf5"/>
    <Block position={[0.65,1.05,-1.335]} size={[1.1,0.87,0.025]} color="#c3dff3"/>
    <Block position={[0.65,1.05,-1.305]} size={[0.035,0.87,0.025]} color="#ffffff"/>
    <Block position={[0.65,1.05,-1.305]} size={[1.1,0.035,0.025]} color="#ffffff"/>
    <Block position={[-1.10,0.87,-1.23]} size={[0.65,0.07,0.27]} color="#b3a0d0"/>
    {['#f9b498','#a5d9c2','#b8a4eb'].map((color,i) => <Block key={color} position={[-1.30+i*0.18,1.07,-1.24]} size={[0.13,0.34+(i%2)*0.06,0.17]} color={color}/>)}
    {/* Seat, backrest, and folded legs. */}
    <Block position={[-0.40,-0.10,-0.42]} size={[0.95,0.15,0.8]} color="#9791cc"/>
    <Block position={[-0.40,0.34,-0.77]} size={[0.95,0.9,0.12]} color="#9791cc"/>
    <Block position={[-0.40,-0.45,-0.42]} size={[0.12,0.58,0.12]} color="#717995"/>
    <Block position={[-0.40,-0.70,-0.42]} size={[0.8,0.06,0.62]} color="#717995"/>
    <Block position={[-0.62,-0.07,-0.01]} size={[0.29,0.26,0.60]} color="#394561"/>
    <Block position={[-0.20,-0.07,-0.01]} size={[0.29,0.26,0.60]} color="#394561"/>
    <Block position={[-0.62,-0.37,0.22]} size={[0.27,0.54,0.28]} color="#394561"/>
    <Block position={[-0.20,-0.37,0.22]} size={[0.27,0.54,0.28]} color="#394561"/>
    <Block position={[-0.62,-0.65,0.32]} size={[0.32,0.12,0.46]} color="#fff6ed"/>
    <Block position={[-0.20,-0.65,0.32]} size={[0.32,0.12,0.46]} color="#fff6ed"/>
    <Block position={[-0.40,0.38,-0.36]} size={[0.83,0.73,0.57]} color={outfit}/>
    <Block position={[-0.40,0.44,-0.06]} size={[0.22,0.18,0.025]} color={props.color}/>
    <group ref={head} position={[-0.40,1.18,-0.35]}>
      <Block position={[0,0,0]} size={[0.91,0.81,0.71]} color="#ead1b6"/>
      <Block position={[0,0.43,0]} size={[0.96,0.12,0.75]} color="#29314b"/>
      <Block position={[-0.46,0.19,0]} size={[0.12,0.40,0.75]} color="#29314b"/>
      <Block position={[0.46,0.19,0]} size={[0.12,0.40,0.75]} color="#29314b"/>
      <Block position={[-0.20,0.05,0.367]} size={[0.085,0.12,0.018]} color="#29314b"/>
      <Block position={[0.20,0.05,0.367]} size={[0.085,0.12,0.018]} color="#29314b"/>
      <mesh ref={mouth} position={[0,-0.15,0.368]}><boxGeometry args={[0.14,0.04,0.018]}/><meshBasicMaterial color="#a26a68"/></mesh>
    </group>
    {/* Desk and typing hands are lower than the avatar's face. */}
    <Block position={[0,0.10,0.64]} size={[2.65,0.12,0.88]} color="#edcbb0"/>
    {[-1.1,1.1].map(x => <Block key={x} position={[x,-0.30,0.64]} size={[0.10,0.75,0.62]} color="#bcabc9"/>)}
    <Block position={[-0.97,0.37,-0.17]} size={[0.24,0.44,0.26]} color={outfit}/>
    <Block position={[0.17,0.37,-0.17]} size={[0.24,0.44,0.26]} color={outfit}/>
    <group ref={leftHand}><Block position={[-0.78,0.23,0.27]} size={[0.22,0.16,0.52]} color={outfit}/><Block position={[-0.78,0.24,0.58]} size={[0.22,0.13,0.20]} color="#ead1b6"/></group>
    <group ref={rightHand}><Block position={[0.04,0.23,0.27]} size={[0.22,0.16,0.52]} color={outfit}/><Block position={[0.04,0.24,0.58]} size={[0.22,0.13,0.20]} color="#ead1b6"/></group>
    <group position={[0.48,0.27,0.73]} rotation={[0,-0.22,0]}>
      <Block position={[0,-0.07,0]} size={[1.1,0.045,0.47]} color="#737c9f"/>
      <Block position={[0,-0.042,0.07]} size={[0.79,0.008,0.19]} color="#c4d0e6"/>
      {props.workstation === 'desktop' ? <>
        <Block position={[0,0.10,-0.16]} size={[0.08,0.29,0.07]} color="#737c9f"/>
        <group position={[0,0.49,-0.17]}><WorkScreen activity={props.workActivity}/></group>
      </> : <group position={[0,0.28,-0.17]} rotation={[-0.12,0,0]}><WorkScreen activity={props.workActivity}/></group>}
    </group>
    {props.workActivity === 'study' && <group position={[-0.70,0.18,0.87]} rotation={[0,0.12,0]}>
      <Block position={[-0.14,0,0]} size={[0.27,0.04,0.34]} color="#fff9ed"/>
      <Block position={[0.14,0,0]} size={[0.27,0.04,0.34]} color="#fff9ed"/>
      <Block position={[0,0.025,0]} size={[0.015,0.015,0.34]} color="#af99d4"/>
    </group>}
    {/* Plant and cup make the room feel inhabited. */}
    <mesh position={[1.39,-0.51,-0.88]}><cylinderGeometry args={[0.20,0.15,0.40,12]}/><meshStandardMaterial color="#edaf98"/></mesh>
    {[[-0.12,0.10],[0.10,0.23],[0,0.39]].map(([x,y],i) => <mesh key={i} position={[1.39+x,-0.13+y,-0.88]} rotation={[0,0,i === 0 ? -0.5 : 0.5]}><sphereGeometry args={[0.18,12,10]}/><meshStandardMaterial color="#83c6a8"/></mesh>)}
    <mesh position={[-1.09,0.30,0.75]}><cylinderGeometry args={[0.09,0.075,0.24,12]}/><meshStandardMaterial color="#9dcfc8"/></mesh>
  </group>;
}
export default function Avatar(props: Props) {
  const working = Boolean(props.workActivity);
  return <Canvas camera={{position:working ? [4,2.8,6] : [3,2,5],fov:working ? 39 : 38}} dpr={[1,1.5]} gl={{antialias:true,alpha:true}} aria-label={working ? `Avatar ${props.agent} menemani aktivitas ${props.workActivity} di ruang kerja dengan ${props.workstation === 'desktop' ? 'komputer' : 'laptop'}` : `Avatar ${props.agent} dengan aura pilihanmu`}>
    <ambientLight intensity={1.5}/><directionalLight position={[3,5,4]} intensity={2}/><pointLight position={[-3,1,2]} color={props.color} intensity={8}/>
    {working ? <WorkRoom {...props}/> : <group position={[0,-0.25,0]}><Character {...props}/></group>}
  </Canvas>;
}
