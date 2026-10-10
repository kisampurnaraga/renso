/// <reference lib="webworker" />
import * as ort from 'onnxruntime-web/wasm';
import wasmUrl from '../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm?url';
import wasmModuleUrl from '../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs?url';
import {loadTextToSpeech,loadVoiceStyle,writeWavFile} from './vendor/supertonic.js';
const assets='https://huggingface.co/supertone-oss-archive/supertonic-3/resolve/aafc6e32416a594460b32413efc49d7fe4ce6d46';
ort.env.wasm.numThreads=1;
ort.env.wasm.proxy=false;
ort.env.wasm.wasmPaths={wasm:wasmUrl,mjs:wasmModuleUrl};
let model:Awaited<ReturnType<typeof loadTextToSpeech>>|null=null;
const styles=new Map<string,unknown>();
self.onmessage=async(event:MessageEvent<{text:string;language:'id'|'en';voice:'F1'|'M1';speed:number}>)=>{
  try{
    model??=await loadTextToSpeech(`${assets}/onnx`,{executionProviders:['wasm'],graphOptimizationLevel:'all'},(_name,current,total)=>self.postMessage({type:'progress',message:`Memuat model suara ${current}/${total}…`}));
    let style=styles.get(event.data.voice);
    if(!style){style=await loadVoiceStyle([`${assets}/voice_styles/${event.data.voice}.json`]);styles.set(event.data.voice,style);}
    self.postMessage({type:'progress',message:'Membuat suara di perangkatmu…'});
    const output=await model.textToSpeech.call(event.data.text,event.data.language,style,5,event.data.speed);
    const wav=writeWavFile(output.wav,model.textToSpeech.sampleRate);
    self.postMessage({type:'audio',wav},[wav]);
  }catch{self.postMessage({type:'error',message:'Model suara natural belum dapat dijalankan. Coba suara perangkat atau teks saja.'});}
};
