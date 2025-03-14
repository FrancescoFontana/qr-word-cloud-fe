import { create } from 'zustand';

interface Word {
  text: string;
  value: number;
}

interface WordCloudState {
  words: Word[];
  isBlurred: boolean;
  setWords: (words: Word[]) => void;
  setBlurred: (isBlurred: boolean) => void;
  addWord: (word: string) => void;
}

export const useWordCloudStore = create<WordCloudState>((set) => ({
  words: [],
  isBlurred: true,
  setWords: (words) => set({ words }),
  setBlurred: (isBlurred) => set({ isBlurred }),
  addWord: (word) =>
    set((state) => {
      const existingWord = state.words.find((w) => w.text === word);
      if (existingWord) {
        return {
          words: state.words.map((w) =>
            w.text === word ? { ...w, value: w.value + 1 } : w
          ),
        };
      }
      return {
        words: [...state.words, { text: word, value: 1 }],
      };
    }),
})); 