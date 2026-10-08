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
    <Block position={[0,0,0.033]} size={[0.94,0.53,0.014]} color={isDesign ? '#efe7ff' : activity === 'coding' ? '#182e3a' : activity === 'writing' ? '#fff2d4' : '#eaf4ff'}/>
    <Block position={[-0.34,0.20,0.045]} size={[0.17,0.025,0.008]} color="#8f76d7"/>
    {isDesign ? <>
      <Block position={[-0.19,-0.015,0.047]} size={[0.30,0.27,0.008]} color="#a8d8ee"/>
      <mesh position={[-0.18,0.025,0.057]}><circleGeometry args={[0.075,20]}/><meshBasicMaterial color="#ffd26e"/></mesh>
      <Block position={[0.20,0.03,0.048]} size={[0.27,0.12,0.008]} color="#fa9fbb"/>
      <Block position={[0.20,-0.105,0.048]} size={[0.27,0.065,0.008]} color="#ad91ee"/>
    </> : Array.from({length: 5}, (_,i) => <Block key={i} position={[-0.04+(i%2)*0.07,0.115-i*0.067,0.047]} size={[0.60-(i%3)*0.11,0.02,0.008]} color={activity === 'coding' ? ['#7e7be0','#66b6ab','#de9f6e'][i%3] : '#97a4c5'}/>)}
  </group>;
}
function RoomAssets({ activity }: { activity: Props['workActivity'] }) {
  if(activity === 'design') return <group name="studio-design-assets">
    {/* A large creative pinboard and floor easel define the studio silhouette. */}
    <group position={[-1.43,1.02,0.30]} name="visible-studio-pinboard">
      <Block position={[0,0,0]} size={[0.68,1.05,0.04]} color="#dba68e"/>
      {['#ff9eaf','#9bd8ce','#c8b1f1','#ffdc84'].map((c,i) => <Block key={c} position={[-0.17+(i%2)*0.34,0.32-Math.floor(i/2)*0.28,0.03]} size={[0.25,0.22,0.02]} color={c}/>)}
      <Block position={[0,-0.29,0.03]} size={[0.51,0.25,0.02]} color="#fff9ef"/>
      <Block position={[0,-0.26,0.045]} size={[0.36,0.045,0.01]} color="#b69bde"/>
      <Block position={[-0.05,-0.35,0.045]} size={[0.26,0.025,0.01]} color="#ec91b0"/>
    </group>
    <group position={[1.20,0.26,-0.83]}>
      <group rotation={[0,0,-0.12]}><Block position={[-0.24,-0.20,0]} size={[0.055,1.67,0.08]} color="#be8e65"/></group>
      <group rotation={[0,0,0.12]}><Block position={[0.24,-0.20,0]} size={[0.055,1.67,0.08]} color="#be8e65"/></group>
      <Block position={[0,0.19,0.03]} size={[0.78,1.05,0.055]} color="#fff6ed"/>
      <Block position={[0,0.16,0.068]} size={[0.61,0.80,0.01]} color="#c7b8f4"/>
      <mesh position={[0.10,0.32,0.08]}><circleGeometry args={[0.17,20]}/><meshBasicMaterial color="#ffda81"/></mesh>
      <Block position={[-0.09,-0.05,0.082]} size={[0.40,0.16,0.013]} color="#f497b9"/>
      <Block position={[0,-0.38,0.07]} size={[0.91,0.075,0.16]} color="#be8e65"/>
    </group>
    <group position={[0.75,0.20,0.51]} rotation={[0,0.12,0]} name="drawing-tablet">
      <Block position={[0,0,0]} size={[0.63,0.05,0.34]} color="#69728d"/>
      <Block position={[0,0.029,0]} size={[0.51,0.008,0.24]} color="#b9d9e9"/>
      <Block position={[0.12,0.04,0.02]} size={[0.20,0.009,0.12]} color="#f2a8bc"/>
      <group rotation={[0,0.5,0]}><Block position={[0.34,0.04,0]} size={[0.025,0.025,0.40]} color="#484664"/></group>
    </group>
  </group>;
  if(activity === 'coding') return <group name="studio-coding-assets">
    <Block position={[0.85,1.17,-1.33]} size={[1.50,0.84,0.035]} color="#203b4c"/>
    {[0,1,2,3].map(i => <Block key={i} position={[0.73+(i%2)*0.10,1.41-i*0.16,-1.302]} size={[0.91-(i%3)*0.17,0.044,0.012]} color={i%2 ? '#a4abff' : '#70e0b0'}/>)}
    <group position={[1.34,-0.18,-0.69]} name="computer-tower">
      <Block position={[0,0,0]} size={[0.53,1.09,0.67]} color="#304357"/>
      <Block position={[0,0.10,0.35]} size={[0.39,0.75,0.025]} color="#1e293c"/>
      {[-0.09,0.28].map(y => <mesh key={y} position={[0,y,0.368]}><ringGeometry args={[0.09,0.125,20]}/><meshBasicMaterial color="#7de8c1"/></mesh>)}
    </group>
    <group position={[0.79,0.76,0.86]} rotation={[0,Math.PI+0.65,0]} scale={0.69} name="second-terminal-monitor">
      <Block position={[0,-0.42,0]} size={[0.09,0.36,0.06]} color="#4b657a"/>
      <WorkScreen activity="coding"/>
    </group>
    <mesh position={[0.35,0.22,0.49]} scale={[1,0.6,1.4]}><sphereGeometry args={[0.085,12,8]}/><meshStandardMaterial color="#4c5a78"/></mesh>
    <Block position={[-1.10,1.16,-1.30]} size={[0.63,0.83,0.07]} color="#7cabb4"/>
    {[0,1,2].map(i => <Block key={i} position={[-1.10,0.92+i*0.22,-1.25]} size={[0.49,0.09,0.04]} color="#d3f8e9"/>)}
  </group>;
  if(activity === 'writing') return <group name="studio-writing-assets">
    <Block position={[1.18,0.30,-1.15]} size={[0.91,2.03,0.36]} color="#b78e68"/>
    <Block position={[1.18,0.30,-0.958]} size={[0.77,1.88,0.025]} color="#e1c6a3"/>
    {[-0.27,0.32,0.91].map((y,row) => <group key={y}>
      <Block position={[1.18,y-0.08,-0.89]} size={[0.92,0.06,0.39]} color="#b78e68"/>
      {['#aa7771','#799b89','#c6a86b','#8a82ab'].map((c,i) => <Block key={c} position={[0.86+i*0.21,y+0.15,-0.91]} size={[0.13,0.38+(i%2)*0.08,0.22]} color={row%2 ? c : ['#799b89','#c6a86b','#aa7771','#8a82ab'][i]}/>)}
    </group>)}
    <Block position={[-0.95,1.20,-1.33]} size={[0.95,0.66,0.04]} color="#a88164"/>
    <Block position={[-0.95,1.20,-1.30]} size={[0.81,0.52,0.02]} color="#fff2d7"/>
    {[0,1,2].map(i => <Block key={i} position={[-0.95,1.36-i*0.14,-1.28]} size={[0.51-(i%2)*0.13,0.025,0.01]} color="#bc9c80"/>)}
    <group position={[0.76,0.20,0.53]} name="manuscript-and-notebook">
      <Block position={[0,0,0]} size={[0.66,0.055,0.39]} color="#b9b39d"/>
      <Block position={[0,0.034,0]} size={[0.61,0.016,0.36]} color="#fff7e3"/>
      {[0,1,2].map(i => <Block key={i} position={[0,0.045,-0.10+i*0.08]} size={[0.41,0.003,0.012]} color="#b7a78e"/>)}
      <Block position={[0.35,0.045,0]} size={[0.023,0.025,0.34]} color="#e39a57"/>
    </group>
    <Block position={[0.92,0.23,0.94]} size={[0.37,0.12,0.29]} color="#fff9ef"/>
  </group>;
  if(activity === 'study') return <group name="studio-study-assets">
    <Block position={[0.15,1.18,-1.33]} size={[2.87,1.09,0.06]} color="#b88b58"/>
    <Block position={[0.15,1.18,-1.29]} size={[2.72,0.94,0.025]} color="#357269"/>
    {/* Simple chalk geometry stays crisp and avoids downloading font assets. */}
    <Block position={[0.90,1.24,-1.268]} size={[0.047,0.40,0.008]} color="#e8f5d8"/>
    <Block position={[0.90,1.24,-1.268]} size={[0.39,0.047,0.008]} color="#e8f5d8"/>
    {[1.24,1.10].map(y => <Block key={y} position={[0.39,y,-1.268]} size={[0.23,0.036,0.008]} color="#f4e5a3"/>)}
    <group position={[-0.90,1.25,-1.25]}>
      <mesh><ringGeometry args={[0.20,0.22,24]}/><meshBasicMaterial color="#def0db"/></mesh>
      <Block position={[0,0,0.006]} size={[0.36,0.025,0.007]} color="#def0db"/>
    </group>
    <Block position={[0.95,-0.17,-0.63]} size={[1.10,0.12,0.77]} color="#d5a76f"/>
    {['#83a5c5','#e7b864','#a291cd'].map((c,i) => <Block key={c} position={[0.98,-0.04+i*0.16,-0.57]} size={[0.77-i*0.07,0.14,0.49]} color={c}/>)}
    <group position={[0.76,0.22,0.51]} name="open-study-book">
      <group rotation={[0,0,-0.07]}><Block position={[-0.16,0,0]} size={[0.31,0.055,0.40]} color="#fff8dd"/></group>
      <group rotation={[0,0,0.07]}><Block position={[0.16,0,0]} size={[0.31,0.055,0.40]} color="#fff8dd"/></group>
      {[-0.16,0.16].map(x => [0,1,2].map(i => <Block key={x+':'+i} position={[x,0.041,-0.12+i*0.10]} size={[0.20,0.004,0.014]} color="#8b9e8d"/>))}
      <Block position={[0.43,0.02,0]} size={[0.06,0.04,0.29]} color="#f4e878"/>
    </group>
  </group>;
  return <group name="studio-other-assets">
    <Block position={[0.65,1.05,-1.33]} size={[1.1,0.87,0.025]} color="#c3dff3"/>
    <Block position={[0.65,1.05,-1.30]} size={[0.035,0.87,0.025]} color="#ffffff"/>
    <Block position={[0.65,1.05,-1.30]} size={[1.1,0.035,0.025]} color="#ffffff"/>
    <Block position={[-1.10,0.87,-1.23]} size={[0.65,0.07,0.27]} color="#b3a0d0"/>
    {['#f9b498','#a5d9c2','#b8a4eb'].map((c,i) => <Block key={c} position={[-1.30+i*0.18,1.07,-1.24]} size={[0.13,0.34+(i%2)*0.06,0.17]} color={c}/>)}
    <mesh position={[1.39,-0.51,-0.88]}><cylinderGeometry args={[0.20,0.15,0.40,12]}/><meshStandardMaterial color="#edaf98"/></mesh>
    {[[-0.12,0.10],[0.10,0.23],[0,0.39]].map(([x,y],i) => <mesh key={i} position={[1.39+x,-0.13+y,-0.88]}><sphereGeometry args={[0.18,12,10]}/><meshStandardMaterial color="#83c6a8"/></mesh>)}
  </group>;
}
function WorkRoom(props: Props) {
  const leftHand = useRef<THREE.Group>(null);
  const rightHand = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const mouth = useRef<THREE.Mesh>(null);
  const cheerful = props.workMode === 'cheerful';
  const outfit = props.agent === 'teduh' ? '#9290ed' : '#f5ac64';
  const palette = {
    design: { floor:'#ecc8d8', wall:'#ffe6eb', side:'#e2cbf3', desk:'#e7b9cd' },
    coding: { floor:'#7eaaaa', wall:'#c1e8df', side:'#94c4c5', desk:'#526f83' },
    writing: { floor:'#d7b590', wall:'#fff0d0', side:'#e9d5b0', desk:'#b9895f' },
    study: { floor:'#d6dfa7', wall:'#edf3d6', side:'#d6e4b8', desk:'#d5a76f' },
    other: { floor:'#d9d1f4', wall:'#e8e4fb', side:'#dedcf5', desk:'#edcbb0' },
  }[props.workActivity || 'other'];
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if(leftHand.current) leftHand.current.position.y = props.reduced ? 0 : Math.sin(t * (cheerful ? 7 : 4)) * 0.035;
    if(rightHand.current) rightHand.current.position.y = props.reduced ? 0 : Math.sin(t * (cheerful ? 7 : 4) + 1.7) * 0.035;
    if(head.current) head.current.rotation.z = props.reduced ? 0 : Math.sin(t * 1.4) * 0.035;
    if(mouth.current) mouth.current.scale.y = props.speaking && !props.reduced ? 1.4 + Math.sin(t * 18) * 0.6 : 1;
  });
  return <group position={[0,-0.40,0]}>
    <group name={`room-${props.workActivity}`}>
      <Block position={[0,-0.78,0]} size={[3.65,0.12,2.9]} color={palette.floor}/>
      <Block position={[0,0.60,-1.4]} size={[3.65,2.7,0.10]} color={palette.wall}/>
      <Block position={[-1.78,0.20,-0.60]} size={[0.08,1.9,1.65]} color={palette.side}/>
      <RoomAssets activity={props.workActivity}/>
    </group>
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
    <Block position={[0,0.10,0.64]} size={[2.65,0.12,0.88]} color={palette.desk}/>
    {[-1.1,1.1].map(x => <Block key={x} position={[x,-0.30,0.64]} size={[0.10,0.75,0.62]} color="#bcabc9"/>)}
    <Block position={[-0.97,0.37,-0.17]} size={[0.24,0.44,0.26]} color={outfit}/>
    <Block position={[0.17,0.37,-0.17]} size={[0.24,0.44,0.26]} color={outfit}/>
    <group ref={leftHand}><Block position={[-0.78,0.23,0.27]} size={[0.22,0.16,0.52]} color={outfit}/><Block position={[-0.78,0.24,0.58]} size={[0.22,0.13,0.20]} color="#ead1b6"/></group>
    <group ref={rightHand}><Block position={[0.04,0.23,0.27]} size={[0.22,0.16,0.52]} color={outfit}/><Block position={[0.04,0.24,0.58]} size={[0.22,0.13,0.20]} color="#ead1b6"/></group>
    {/* The character faces +Z. Rotating the workstation by PI makes its
        screen's local +Z display face world -Z, toward the seated character.
        The keyboard sits nearer the character than the screen hinge. */}
    <group position={[-0.35,0.27,0.62]} rotation={[0,Math.PI,0]} name="avatar-facing-workstation">
      <Block position={[0,-0.07,0]} size={[1.1,0.045,0.47]} color="#737c9f"/>
      <Block position={[0,-0.042,0.07]} size={[0.79,0.008,0.19]} color="#c4d0e6"/>
      {props.workstation === 'desktop' ? <>
        <Block position={[0,0.10,-0.24]} size={[0.08,0.29,0.07]} color="#737c9f"/>
        <group position={[0,0.49,-0.24]}><WorkScreen activity={props.workActivity}/></group>
      </> : <group position={[0,0.28,-0.24]} rotation={[-0.12,0,0]}><WorkScreen activity={props.workActivity}/></group>}
    </group>
    <mesh position={[-1.09,0.30,0.75]}><cylinderGeometry args={[0.09,0.075,0.24,12]}/><meshStandardMaterial color="#9dcfc8"/></mesh>
  </group>;
}
export default function Avatar(props: Props) {
  const working = Boolean(props.workActivity);
  return <Canvas camera={{position:working ? [5,3,-0.8] : [3,2,5],fov:working ? 39 : 38}} dpr={[1,1.5]} gl={{antialias:true,alpha:true}} aria-label={working ? `Avatar ${props.agent} menemani aktivitas ${props.workActivity} di ruang kerja dengan ${props.workstation === 'desktop' ? 'komputer' : 'laptop'}` : `Avatar ${props.agent} dengan aura pilihanmu`}>
    <ambientLight intensity={1.5}/><directionalLight position={[3,5,4]} intensity={2}/><pointLight position={[-3,1,2]} color={props.color} intensity={8}/>
    {working ? <WorkRoom {...props}/> : <group position={[0,-0.25,0]}><Character {...props}/></group>}
  </Canvas>;
}
