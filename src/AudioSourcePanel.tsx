import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { FC } from 'react';

/**
 * Props for AudioSourcePanel.
 * @param title - Display title of the panel.
 * @param sourceUrl - URL of the audio source (Audius).
 * @param artist - Artist attribution.
 * @param license - License information.
 * @param link - External link to the track.
 * @param isLoading - Show loading state.
 * @param isError - Show error state.
 * @param onPlayPause - Callback when play/pause action occurs. Receives boolean playing.
 * @param onVolumeChange - Callback when volume changes. Receives value 0-100.
 * @param agentOptInId - Optional id for agent opt‑in state.
 * @param agentOptInEnabled - Whether agent opt‑in is enabled.
 */
export interface AudioSourcePanelProps {
  title: string;
  sourceUrl: string;
  artist: string;
  license: string;
  link: string;
  isLoading?: boolean;
  isError?: boolean;
  onPlayPause?: (playing: boolean) => void;
  onVolumeChange?: (value: number) => void;
  agentOptInId?: string;
  agentOptInEnabled?: boolean;
}

const AudioSourcePanel: FC<AudioSourcePanelProps> = ({
  title,
  sourceUrl,
  artist,
  license,
  link,
  isLoading = false,
  isError = false,
  onPlayPause,
  onVolumeChange,
  agentOptInId,
  agentOptInEnabled = false,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(35);
  const [loaded, setLoaded] = useState(false);

  // Update audio element on sourceUrl change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = sourceUrl;
    setLoaded(false);
    audio.load();
  }, [sourceUrl]);

  // Sync volume state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume / 100;
  }, [volume]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => {}); // ignore play promise rejection
    }
  };

  // Reflect play state changes from audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);
    const handleEnded = () => setPlaying(false);
    const handleCanPlay = () => setLoaded(true);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    onVolumeChange?.(val);
  };

  const handlePlayPause = () => {
    togglePlay();
    onPlayPause?.(!playing);
  };

  const panelStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '390px',
    boxSizing: 'border-box',
    padding: '1rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    overflow: 'hidden',
  };

  return (
    <div style={panelStyle} aria-label="Audio source panel">
      <h3>{title}</h3>
      {isLoading && <p>Loading...</p>}
      {isError && <p>Error loading track.</p>}
      {!isLoading && !isError && (
        <>
          <p>
            <strong>Artist:</strong> {artist}
          </p>
          <p>
            <strong>License:</strong> {license}
          </p>
          <p>
            <a href={link} target="_blank" rel="noopener noreferrer">
              Open track
            </a>
          </p>
          <audio ref={audioRef} preload="metadata" hidden />
          <button
            onClick={handlePlayPause}
            aria-pressed={playing}
            aria-label={playing ? "Pause" : "Play"}
            disabled={!loaded}
          >
            {playing ? 'Pause' : 'Play'}
          </button>
          <label htmlFor="volume-control">
            Volume:
            <input
              id="volume-control"
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              disabled={!loaded}
            />
          </label>
          {agentOptInEnabled && (
            <p>
              Agent opt‑in ID: {agentOptInId ?? 'none'}
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default AudioSourcePanel;
