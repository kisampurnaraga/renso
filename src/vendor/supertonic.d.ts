export function loadTextToSpeech(path:string,options:object,progress?:(name:string,current:number,total:number)=>void):Promise<{textToSpeech:{sampleRate:number;call(text:string,lang:string,style:unknown,steps:number,speed:number):Promise<{wav:number[]}>}}>;
export function loadVoiceStyle(paths:string[]):Promise<unknown>;
export function writeWavFile(data:number[],sampleRate:number):ArrayBuffer;
