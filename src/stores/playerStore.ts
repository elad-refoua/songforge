import { create } from 'zustand';

interface Song {
  id: string;
  title: string;
  genre: string;
  mood: string;
  audio_url: string;
}

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  audio: HTMLAudioElement | null;
  play: (song: Song) => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  stop: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  progress: 0,
  duration: 0,
  audio: null,

  play: (song: Song) => {
    const { audio, currentSong } = get();

    // If same song, just resume
    if (currentSong?.id === song.id && audio) {
      audio.play();
      set({ isPlaying: true });
      return;
    }

    // Stop previous audio
    if (audio) {
      audio.pause();
      audio.src = '';
    }

    // Create new audio element
    const newAudio = new Audio(song.audio_url);

    newAudio.addEventListener('loadedmetadata', () => {
      set({ duration: newAudio.duration });
    });

    newAudio.addEventListener('timeupdate', () => {
      set({ progress: newAudio.currentTime });
    });

    newAudio.addEventListener('ended', () => {
      set({ isPlaying: false, progress: 0 });
    });

    newAudio.play();
    set({ currentSong: song, audio: newAudio, isPlaying: true, progress: 0 });
  },

  pause: () => {
    const { audio } = get();
    if (audio) {
      audio.pause();
      set({ isPlaying: false });
    }
  },

  toggle: () => {
    const { isPlaying, audio } = get();
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      set({ isPlaying: false });
    } else {
      audio.play();
      set({ isPlaying: true });
    }
  },

  seek: (time: number) => {
    const { audio } = get();
    if (audio) {
      audio.currentTime = time;
      set({ progress: time });
    }
  },

  stop: () => {
    const { audio } = get();
    if (audio) {
      audio.pause();
      audio.src = '';
    }
    set({ currentSong: null, isPlaying: false, progress: 0, duration: 0, audio: null });
  },
}));
