import HeroSection from '@/components/HeroSection';
import CommunityFeed from '@/components/CommunityFeed';
import MyReports from '@/components/MyReports';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main>
        <HeroSection onGetStarted={() => {
          console.log('Get started clicked');
        }} />
        <div className="container mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
          <CommunityFeed />
          <MyReports />
        </div>
      </main>
    </div>
  );
}