import { useEffect, useState } from 'react';

interface QRCodeProps {
  text: string;
}

export default function QRCode({ text }: QRCodeProps) {
  const [qrCode, setQrCode] = useState<string>('');

  useEffect(() => {
    if (!text) {
      setQrCode('');
      return;
    }

    // Generate QR code using the backend API
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })
      .then(response => response.json())
      .then(data => setQrCode(data.qrCode))
      .catch(error => console.error('Error generating QR code:', error));
  }, [text]);

  if (!text) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Enter some text to generate a QR code</p>
      </div>
    );
  }

  if (!qrCode) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-64">
      <img
        src={qrCode}
        alt="Generated QR Code"
        className="max-w-full max-h-full"
      />
    </div>
  );
} 