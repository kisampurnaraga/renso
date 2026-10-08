import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';
const TeamWorkspace = React.lazy(()=>import('./TeamWorkspace'));
function Root() {
  const [route,setRoute] = React.useState(()=>location.hash);
  React.useEffect(()=>{const change=()=>setRoute(location.hash);window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change);},[]);
  return route==='#/team'?<React.Suspense fallback={<p role="status">Menyiapkan ruang tim…</p>}><TeamWorkspace/></React.Suspense>:<App/>;
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><Root/></React.StrictMode>);
if ('serviceWorker' in navigator && !location.hostname.match(/^(localhost|127\.0\.0\.1)$/)) window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
