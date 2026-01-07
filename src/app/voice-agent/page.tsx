// app/page.tsx
import GeminiAudioChat from "@/app/voice-agent/components/GeminiAudioChat";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <GeminiAudioChat />
    </main>
  );
}
