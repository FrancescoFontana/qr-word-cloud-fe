import WordCloud from '@/components/WordCloud';

export default function Home() {
  // Example words for the word cloud
  const words = [
    { text: 'Example', value: 10 },
    { text: 'Word', value: 8 },
    { text: 'Cloud', value: 12 },
  ];

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">Word Cloud Generator</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Word Cloud</h2>
          <WordCloud words={words} />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <p className="text-gray-600">
            Enter a code to create or view a word cloud. The code should be 5 characters long.
          </p>
        </div>
      </div>
    </main>
  );
} 