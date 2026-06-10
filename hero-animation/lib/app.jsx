const GRAD = 'linear-gradient(135deg, hsl(214 32% 95%) 0%, hsl(223 45% 93%) 45%, hsl(230 55% 90%) 100%)';

function SeekHook() {
  const tl = useTimeline();
  React.useEffect(() => {
    window.__seek = (t) => { tl.setPlaying(false); tl.setTime(t); };
    window.__reset = () => { tl.setPlaying(false); tl.setTime(0); };
    window.__play = () => tl.setPlaying(true);
    window.__pause = () => tl.setPlaying(false);

    const onMessage = (event) => {
      if (event.data === 'autopilot:showcase-play') {
        tl.setTime(0);
        tl.setPlaying(true);
      }
      if (event.data === 'autopilot:showcase-reset') {
        tl.setPlaying(false);
        tl.setTime(0);
      }
    };

    window.addEventListener('message', onMessage);
    window.parent?.postMessage('autopilot:showcase-ready', '*');
    return () => window.removeEventListener('message', onMessage);
  }, [tl]);
  return null;
}

function Scene() {
  const time = useTime();
  const { DURATION } = window.HERO_DATA;

  // barely-there camera push-in to keep the frame alive
  const camScale = window.interpolate([0, DURATION], [1.0, 1.02], window.Easing.easeInOutSine)(time);

  return (
    <div data-screen-label={`t=${time.toFixed(1)}s`}
      style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', left: 64, top: 52, right: 64, bottom: 56,
        transform: `scale(${camScale})`, transformOrigin: 'center center' }}>
        <BrowserFrame>
          <SidebarRail />
          <ConvList />
          <ChatPanel />
          <LeadPanel />
        </BrowserFrame>
      </div>
    </div>
  );
}

function HeroVideo() {
  const { DURATION } = window.HERO_DATA;
  return (
    <Stage width={1920} height={1080} duration={DURATION} loop={true} autoplay={false}
      background={GRAD} persistKey="autopilot-hero-embed">
      <Scene />
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<HeroVideo />);

window.Scene = Scene;
window.HERO_GRAD = GRAD;
