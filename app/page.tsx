'use client';
import {usePrivy} from '@privy-io/react-auth';
import Login from './components/Login';
import Wallets from './components/Wallets';

export default function Home() {
  const {ready, user} = usePrivy();
  if (!ready) {
    return <div></div>;
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100">
      <div className="text-center p-4 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">Le Banana Backend Test</h1>
      </div>

      <div className="flex flex-col md:flex-row w-full justify-center">
        <div className="w-full md:w-1/2">{!user ? <Login /> : <Wallets />}</div>
      </div>
    </div>
  );
}
