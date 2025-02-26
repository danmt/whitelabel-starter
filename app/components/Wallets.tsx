'use client';
import {
  useGuestAccounts,
  usePrivy,
  useSolanaWallets,
  WalletWithMetadata,
} from '@privy-io/react-auth';
import {useEffect, useState} from 'react';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SolanaWallet from '../components/SolanaWallet';

export default function Wallets() {
  const {ready, authenticated, user, logout} = usePrivy();
  const {createWallet: createSolanaWallet, wallets: solanaWallets} = useSolanaWallets();
  const {createGuestAccount} = useGuestAccounts();
  const [pendingAction, setPendingAction] = useState('');

  const hasExistingSolanaWallet = user?.linkedAccounts.some(
    (account): account is WalletWithMetadata =>
      account.type === 'wallet' &&
      account.walletClientType === 'privy' &&
      account.chainType === 'solana',
  );

  useEffect(() => {
    if (pendingAction === 'Solana') {
      createSolanaWallet();
    }
    setPendingAction('');
  }, [user, createSolanaWallet, pendingAction, setPendingAction]);

  const createWallet = async (walletType: string) => {
    if (ready && !authenticated && !user?.isGuest) {
      await createGuestAccount();
    }
    setPendingAction(walletType);
  };

  if (!ready) {
    return;
  }

  return (
    <div className="mx-4 px-4">
      <ToastContainer />
      <h2 className="text-2xl font-bold text-center my-4">Your wallet</h2>
      <div className="text-center mt-4 mx-auto mb-4">
        <p className="status-text">
          We use Privy to enable users to create self-custodial wallets. It supports all common
          RPCs. Create wallets below to test signing messages and sending transactions.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={() => createWallet('Solana')}
          className={`btn ${hasExistingSolanaWallet ? 'btn-disabled' : ''}`}
          disabled={hasExistingSolanaWallet}
        >
          <div
            className={`${hasExistingSolanaWallet ? 'btn-text-disabled' : 'text-black'} btn-text`}
          >
            Create wallet
          </div>
        </button>
        <button onClick={logout} className="btn">
          <div className="btn-text text-black">Logout</div>
        </button>
      </div>
      <div className="mt-4">
        {solanaWallets.length > 0 && user && (
          <div className="mb-4">
            <div className="flex gap-2 flex-wrap">
              {solanaWallets.map((wallet, index) => (
                <div key={wallet.address}>
                  <SolanaWallet wallet={wallet} index={index} user={user} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
