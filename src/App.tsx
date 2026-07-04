import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { TabBar } from './components/TabBar';
import { ProfilePage } from './pages/ProfilePage';
import { FriendsPage } from './pages/FriendsPage';
import { FriendProfilePage } from './pages/FriendProfilePage';
import { CafesPage } from './pages/CafesPage';
import { CafeDetailPage } from './pages/CafeDetailPage';
import { MaidDetailPage } from './pages/MaidDetailPage';
import { SalesPage } from './pages/SalesPage';
import { UploadPage } from './pages/UploadPage';
import { BinderPage } from './pages/BinderPage';
import { DictionaryPage } from './pages/DictionaryPage';
import { ShopPage } from './pages/ShopPage';
import { LoginPage } from './pages/LoginPage';
import { UpdatePrompt } from './components/UpdatePrompt';
import { Toasts } from './components/Toasts';
import { useAuth } from './data/auth';
import { claimDailyBonus } from './data/hooks';

export default function App() {
  const { session, userId, loading } = useAuth();

  useEffect(() => {
    if (userId) claimDailyBonus(userId);
  }, [userId]);

  if (loading) return null;
  if (!session || !userId) return <LoginPage />;

  return (
    <>
      <Routes>
        <Route path="/" element={<ProfilePage />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/friends/:friendId" element={<FriendProfilePage />} />
        <Route path="/cafes" element={<CafesPage />} />
        <Route path="/cafes/:cafeId" element={<CafeDetailPage />} />
        <Route path="/maids/:maidId" element={<MaidDetailPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/binder/:binderId" element={<BinderPage />} />
        <Route path="/dictionary" element={<DictionaryPage />} />
        <Route path="/shop" element={<ShopPage />} />
      </Routes>
      <TabBar />
      <UpdatePrompt />
      <Toasts />
    </>
  );
}
