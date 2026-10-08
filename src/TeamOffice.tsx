import { Component, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as THREE from 'three';
import { TEAM_WORKSPACE } from './team-workspace-data';

type AgentPresence='resting'|'available';
type Props = {language:'id'|'en';selected:string;onSelect:(id:string)=>void;reduced:boolean;reset:number;division?:string;jobStatuses?:Record<string,string>;agentPresence?:Record<string,AgentPresence>};
const outfits = ['#62a9ad','#797de1','#dc92b1','#eab25b','#6eb7b8','#83b889','#889bcf','#dd946c','#e397ba','#a18bca'];

function Box({at,size,color}:{at:[number,number,number];size:[number,number,number];color:string}) {
  return <mesh position={at}><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.75}/></mesh>;
}
function Label({text,position,selected=false}:{text:string;position:[number,number,number];selected?:boolean}) {
  const texture = useMemo(()=>{
    const canvas = document.createElement('canvas');canvas.width=512;canvas.height=96;
    const ctx=canvas.getContext('2d')!;ctx.fillStyle=selected?'#70549a':'#ffffff';ctx.beginPath();ctx.roundRect(0,0,512,96,24);ctx.fill();
    ctx.fillStyle=selected?'#ffffff':'#4d3e65';ctx.font='600 29px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,48,480);
    const result=new THREE.CanvasTexture(canvas);result.colorSpace=THREE.SRGBColorSpace;return result;
  },[text,selected]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  return <sprite position={position} scale={[2.5,.47,1]}><spriteMaterial map={texture} depthTest={false}/></sprite>;
}
function AgentModel({color,index,reduced,working=false}:{color:string;index:number;reduced:boolean;working?:boolean}) {
  const body=useRef<THREE.Group>(null);
  const leftHand=useRef<THREE.Group>(null),rightHand=useRef<THREE.Group>(null);
  useFrame(({clock})=>{
    if(body.current)body.current.position.y=0;
    [leftHand.current,rightHand.current].forEach((hand,i)=>{if(hand)hand.rotation.x=working&&!reduced?-.6+Math.sin(clock.elapsedTime*9+i*Math.PI)*.12:0;});
  });
  return <group ref={body} position={[0,0,0]}>
    <Box at={[0,1.66,0]} size={[.65,.65,.58]} color={['#efd3bb','#d3ae91','#b58a6d'][index%3]}/>
    <Box at={[0,2,0]} size={[.69,.13,.62]} color={index%2?'#544057':'#30354c'}/>
    <Box at={[-.31,1.79,0]} size={[.1,.33,.61]} color={index%2?'#544057':'#30354c'}/>
    {[-.14,.14].map(x=><Box key={x} at={[x,1.71,.299]} size={[.06,.085,.025]} color="#39374b"/>)}
    <Box at={[0,1.49,.30]} size={[.12,.035,.022]} color="#936574"/>
    <Box at={[0,1.08,0]} size={[.62,.55,.4]} color={color}/>
    <Box at={[0,1.12,.21]} size={[.15,.13,.025]} color="#fff4db"/>
    {[-1,1].map(side=><group key={side}><group ref={side===-1?leftHand:rightHand} position={[side*.42,1.25,.11]}><Box at={[0,-.2,0]} size={[.19,.48,.25]} color={color}/><Box at={[0,-.45,.05]} size={[.19,.16,.24]} color="#e1bea3"/></group><Box at={[side*.17,.58,.18]} size={[.23,.46,.27]} color="#40455d"/><Box at={[side*.17,.34,.30]} size={[.26,.13,.43]} color="#fff9ee"/></group>)}
    {index===3?<><Box at={[-.37,1.72,0]} size={[.13,.34,.32]} color="#584877"/><Box at={[.37,1.72,0]} size={[.13,.34,.32]} color="#584877"/><Box at={[0,2.1,0]} size={[.74,.08,.14]} color="#584877"/></>:null}
    {index===1||index===6?<><Box at={[0,1.71,.33]} size={[.52,.025,.03]} color="#655679"/>{[-.14,.14].map(x=><Box key={x} at={[x,1.69,.33]} size={[.17,.13,.03]} color="#655679"/>)}</>:null}
  </group>;
}
function Desk({index,color}:{index:number;color:string}) {
  return <group>
    <Box at={[0,.85,.9]} size={[2.15,.13,1.04]} color="#f7e3cc"/>
    {[-.88,.88].map(x=><Box key={x} at={[x,.4,.95]} size={[.1,.8,.72]} color="#c4bfda"/>)}
    <Box at={[0,1.27,1.03]} size={[.83,.54,.09]} color="#41465e"/>
    <Box at={[0,1.28,.975]} size={[.73,.44,.015]} color={index===1||index===6?'#26384e':'#edf2ff'}/>
    {[0,1,2].map(row=><Box key={row} at={[-.06,1.40-row*.105,.959]} size={[.49-row*.07,.022,.01]} color={color}/>)}
    <Box at={[0,1.02,1.03]} size={[.07,.2,.08]} color="#41465e"/>
    <Box at={[0,.94,.64]} size={[.64,.045,.26]} color="#d8d8e7"/>
    <Box at={[0,.75,-.07]} size={[.8,.15,.64]} color={color}/><Box at={[0,1.02,-.31]} size={[.78,.68,.10]} color={color}/>
    <Box at={[0,.38,-.06]} size={[.1,.7,.1]} color="#747990"/>
    <Box at={[0,.08,-.06]} size={[.66,.1,.52]} color="#747990"/>
    {index===3?<group position={[.74,1,.83]}><Box at={[0,0,0]} size={[.3,.25,.26]} color="#6e5b83"/><mesh position={[0,0,-.14]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.07,.07,.025,12]}/><meshStandardMaterial color="#d1c5ea"/></mesh></group>:index===4?<><Box at={[.72,.96,.81]} size={[.35,.08,.4]} color="#c598db"/><Box at={[.72,1.01,.81]} size={[.26,.02,.31]} color="#fcecf4"/></>:index===5?<><Box at={[.72,1.03,.84]} size={[.27,.13,.29]} color="#6aa98e"/><mesh position={[.72,1.04,.68]}><circleGeometry args={[.055,12]}/><meshBasicMaterial color="#e5f9ed"/></mesh></>:<><Box at={[.7,.94,.88]} size={[.33,.03,.35]} color="#e1c7ec"/><Box at={[.69,.975,.88]} size={[.31,.035,.3]} color="#fff4db"/></>}
    <mesh position={[-.76,.99,.82]}><cylinderGeometry args={[.08,.07,.16,10]}/><meshStandardMaterial color="#faf2ff"/></mesh>
  </group>;
}
function Plant({at}:{at:[number,number,number]}) {
  return <group position={at}><mesh position={[0,.22,0]}><cylinderGeometry args={[.23,.16,.44,12]}/><meshStandardMaterial color="#d9bcb4"/></mesh><Box at={[0,.65,0]} size={[.07,.6,.07]} color="#679776"/>{[-1,1].map(side=><mesh key={side} position={[side*.18,.82+side*.12,0]} rotation={[0,0,side*-.5]}><sphereGeometry args={[.22,8,6]}/><meshStandardMaterial color="#9cc5a6"/></mesh>)}</group>;
}
function Controls({reset}:{reset:number}) {
  const {camera,gl,invalidate,size}=useThree();
  useEffect(()=>{
    camera.position.set(14,15,19);
    if(camera instanceof THREE.PerspectiveCamera){camera.fov=size.width>700?32:43;camera.updateProjectionMatrix();}
    const controls=new OrbitControls(camera,gl.domElement);controls.target.set(0,.4,0);controls.minDistance=10;controls.maxDistance=30;controls.maxPolarAngle=Math.PI/2.35;controls.minPolarAngle=.25;controls.enablePan=false;controls.enableDamping=false;
    const changed=()=>invalidate();
    controls.addEventListener('change',changed);controls.update();
    return ()=>{controls.removeEventListener('change',changed);controls.dispose();};
  },[camera,gl,invalidate,reset,size.width]);
  return null;
}
function OfficeScene(props:Props) {
  const teams=TEAM_WORKSPACE.teams.filter(team=>!props.division || (team as typeof team & {divisionId?:string}).divisionId===props.division);
  const columns=Math.min(3,Math.max(1,teams.length));
  const rows=Math.ceil(teams.length/columns);
  const depth=Math.max(9,rows*3.1+4);
  const loungeZ=depth/2-1.3;
  return <>
    <color attach="background" args={['#eee8fa']}/><ambientLight intensity={1.1}/><directionalLight position={[8,14,10]} intensity={1.6}/><directionalLight position={[-8,8,-8]} intensity={.6} color="#bbd3ff"/>
    <Box at={[0,-.18,0]} size={[14,.35,depth]} color="#e9d9c8"/>
    <Box at={[0,1.6,-depth/2]} size={[14,3.55,.18]} color="#e5dcef"/>
    <Box at={[-7,1.6,0]} size={[.18,3.55,depth]} color="#f0e6f0"/>
    {[-4,0,4].map(x=><group key={x}><Box at={[x,2.3,-depth/2+.12]} size={[2.25,1.5,.06]} color="#aacbdc"/><Box at={[x,2.3,-depth/2+.18]} size={[.06,1.5,.05]} color="#fff6e9"/><Box at={[x,2.3,-depth/2+.18]} size={[2.25,.06,.05]} color="#fff6e9"/></group>)}
    <Label text="RENSO · STUDIO" position={[0,3.7,-depth/2+.2]}/>
    <Box at={[0,.03,loungeZ-1.15]} size={[13,.05,.15]} color="#bda8d5"/>
    <Box at={[-5.7,.7,loungeZ-1.15]} size={[.13,1.4,1.3]} color="#bda8d5"/>
    <Box at={[5.7,.7,loungeZ-1.15]} size={[.13,1.4,1.3]} color="#bda8d5"/>
    <Label text={props.language==='id'?'RUANG ISTIRAHAT':'REST LOUNGE'} position={[0,2.5,loungeZ+.7]}/>
    <Box at={[0,.02,loungeZ]} size={[12,.025,2.2]} color="#d9e7df"/>
    {teams.map((team,index)=>{
      const x=(index%columns-(columns-1)/2)*3.6;
      const z=-depth/2+1.3+Math.floor(index/columns)*3.1;
      const selected=props.selected===team.id;
      const status=props.jobStatuses?.[team.id] || 'unknown';
      const presence=props.agentPresence?.[team.id] || 'resting';
      const working=status==='running';
      const waiting=['queued','dispatching','dispatched'].includes(status);
      const resting=presence==='resting'&&!working&&!waiting;
      const color=outfits[index%outfits.length];
      const metadata=team as typeof team & {agentName?:string};
      const name=metadata.agentName || team.name[props.language];
      const state=props.language==='id'?(working?'Bekerja':waiting?'Menunggu worker':resting?'Istirahat':'Siap bekerja'):(working?'Working':waiting?'Waiting for worker':resting?'Resting':'Ready for work');
      const loungeX=(index-(teams.length-1)/2)*Math.min(1.65,10/Math.max(1,teams.length));
      return <group key={team.id} onClick={event=>{event.stopPropagation();props.onSelect(team.id);}}>
        <group position={[x,0,z]}>
          <mesh position={[0,.012,.3]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[3.3,2.9]}/><meshStandardMaterial color={selected?'#c9b4ef':index%2?'#eadce8':'#e4e0f3'}/></mesh>
          <Box at={[-1.65,.45,.3]} size={[.06,.9,2.6]} color="#d4c4de"/>
          <Desk index={index} color={color}/>
          {!resting?<AgentModel color={color} index={index} reduced={props.reduced} working={working}/>:null}
          <Label text={`${name} · ${state}`} position={[0,2.7,0]} selected={selected}/>
        </group>
        <group position={[loungeX,0,loungeZ]}>
          <Box at={[0,.3,-.07]} size={[1.4,.45,.75]} color={color}/><Box at={[0,.7,-.4]} size={[1.4,.7,.13]} color={color}/>
          {resting?<><AgentModel color={color} index={index} reduced={props.reduced}/><Label text={name} position={[0,2.4,0]} selected={selected}/></>:null}
        </group>
      </group>;
    })}
    <Plant at={[-6.1,0,-depth/2+.8]}/><Plant at={[6.1,0,-depth/2+.8]}/><Plant at={[6.1,0,loungeZ]}/>
    <Controls reset={props.reset}/>
  </>;
}
class OfficeBoundary extends Component<{children:ReactNode;language:'id'|'en'},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<div className="office-fallback">{this.props.language==='id'?'Kantor 3D belum tersedia di perangkat ini. Pilih agent melalui tombol di bawah.':'3D is unavailable on this device. Select an agent with the buttons below.'}</div>:this.props.children;}
}
export default function TeamOffice(props:Props) {
  const count=TEAM_WORKSPACE.teams.filter(team=>!props.division||team.divisionId===props.division).length;
  return <OfficeBoundary language={props.language}><Canvas camera={{position:[12,13,16],fov:43}} dpr={[1,1.5]} frameloop={props.reduced?'demand':'always'} gl={{antialias:false,alpha:false}} aria-label={props.language==='id'?`Kantor 3D tim Renso dengan ${count} karakter agent`:`Renso 3D office with ${count} agent characters`}><OfficeScene {...props}/></Canvas></OfficeBoundary>;
}