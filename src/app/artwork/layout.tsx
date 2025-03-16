export default function ArtworkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      {children}
    </div>
  );
} 