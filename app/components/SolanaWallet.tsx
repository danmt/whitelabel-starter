import {ConnectedSolanaWallet, User} from '@privy-io/react-auth';
import {Account, getAccount, getAssociatedTokenAddress} from '@solana/spl-token';
import {Connection, PublicKey, Transaction} from '@solana/web3.js';
import bs58 from 'bs58';
import React, {useEffect, useState} from 'react';
import {toast} from 'react-toastify';

interface SolanaWalletProps {
  wallet: ConnectedSolanaWallet;
  index: number;
  user: User;
}

interface RewardKind {
  kind: string;
  tokens: number;
}

const API_URL = 'http://localhost:5000';
const RPC_URL = 'https://devnet.helius-rpc.com/?api-key=127d0f9b-34b2-4120-9bad-5a429d1f10f6';
const MINT_ADDRESS = 'CTMApYyrzN8PnchQ48XUzxi1ESuSpHjd1p5ZVA8mpvVk';
const MINT_DECIMALS = 9;
const REWARD_KINDS: RewardKind[] = [
  {kind: '20% off', tokens: 50},
  {kind: 'Free Shipping', tokens: 75},
  {kind: '2x1', tokens: 100},
];

async function requestRewardClaim(rewardKind: string, userId: string, userWalletAddress: string) {
  const response = await fetch(`${API_URL}/api/request-reward-claim`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      rewardKind,
      userId,
      userWalletAddress,
    }),
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Failed to request reward claim');
  return result as {rewardId: string; serializedTransaction: string};
}

async function claimReward(signature: string, rewardId: string) {
  const response = await fetch(`${API_URL}/api/claim-reward`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      signature,
      rewardId,
    }),
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Failed to claim reward');
  return result as {identifier: string; code: string; signature: string};
}

const SolanaWallet: React.FC<SolanaWalletProps> = ({wallet, index, user}) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [selectedRewardKind, setSelectedRewardKind] = useState<string | null>(null);
  const [claimedCouponCode, setClaimedCouponCode] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false); // Track claiming state

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const connection = new Connection(RPC_URL, 'confirmed');
        const mintPublicKey = new PublicKey(MINT_ADDRESS);
        const userPublicKey = new PublicKey(wallet.address);
        const tokenAccount = await getAssociatedTokenAddress(mintPublicKey, userPublicKey);
        const accountInfo: Account = await getAccount(connection, tokenAccount);
        const balanceInTokens = Number(accountInfo.amount) / Math.pow(10, MINT_DECIMALS);
        
        setBalance(balanceInTokens);
      } catch (error: any) {
        toast.error(`Failed to fetch balance: ${error?.message}`);
        setBalance(0);
      }
    };
    fetchBalance();
  }, [wallet.address]);

  const handleClaimReward = async (rewardKind: string) => {
    setIsClaiming(true); // Start claiming state
    const toastId = toast.loading(`Claiming ${rewardKind} reward...`); // Eager toast with loading

    try {
      const rewardClaim = await requestRewardClaim(rewardKind, user.id, wallet.address);
      const transaction = Transaction.from(bs58.decode(rewardClaim.serializedTransaction));
      const signedTransaction = await wallet.signTransaction!(transaction);
      const signature = signedTransaction.signatures[1].signature!.toString('base64');
      const reward = await claimReward(signature, rewardClaim.rewardId);

      setClaimedCouponCode(reward.code);
      toast.update(toastId, {
        render: `Reward claimed successfully! Tx: ${reward.signature}`,
        type: 'success',
        isLoading: false,
        autoClose: 5000, // Close after 5 seconds
      });
    } catch (error: any) {
      toast.update(toastId, {
        render: `Failed to claim reward: ${error?.message}`,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setIsClaiming(false); // Reset claiming state
    }
  };

  return (
    <div className="wallet-container">
      <h3 className="wallet-header">Solana wallet {index + 1}</h3>
      <p className="wallet-address">
        <span className="break-all">{wallet.address}</span>
      </p>
      <p className="wallet-balance">
        Balance: {balance !== null ? `${balance} Tokens` : 'Loading...'}
      </p>
      <div className="flex justify-between">
        <div className="flex gap-x-3">
          {REWARD_KINDS.map((reward) => (
            <button
              key={reward.kind}
              onClick={() => setSelectedRewardKind(reward.kind)}
              className="wallet-button wallet-button-primary"
            >
              <div className="btn-text">{reward.kind}</div>
            </button>
          ))}
        </div>
      </div>
      {selectedRewardKind && !claimedCouponCode && (
        <div className="mt-4 p-2 border rounded shadow bg-white text-left">
          <h2 className="text-lg font-semibold mb-2">Claim {selectedRewardKind}</h2>
          <p className="text-xs text-gray-600 mb-2">
            Required Tokens: {REWARD_KINDS.find((r) => r.kind === selectedRewardKind)?.tokens}
          </p>
          <div className="flex gap-x-3 items-center">
            <button
              onClick={() => {
                const reward = REWARD_KINDS.find((r) => r.kind === selectedRewardKind);
                if (reward) handleClaimReward(reward.kind);
              }}
              className={`wallet-button wallet-button-primary flex items-center gap-2 ${isClaiming ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isClaiming}
            >
              <div className="btn-text">Claim</div>
              {isClaiming && (
                <span className="animate-spin h-4 w-4 border-2 border-t-transparent border-white rounded-full"></span>
              )}
            </button>
            <button
              onClick={() => setSelectedRewardKind(null)}
              className="wallet-button wallet-button-secondary"
              disabled={isClaiming}
            >
              <div className="btn-text">Cancel</div>
            </button>
          </div>
        </div>
      )}
      {claimedCouponCode && (
        <div className="mt-4 p-2 border rounded shadow bg-white text-left">
          <h2 className="text-lg font-semibold mb-2">Reward Claimed!</h2>
          <p className="text-xs text-gray-600 mb-2">
            Your Coupon Code: <span className="font-bold">{claimedCouponCode}</span>
          </p>
          <button
            onClick={() => {
              setClaimedCouponCode(null);
              setSelectedRewardKind(null);
            }}
            className="wallet-button wallet-button-secondary"
          >
            <div className="btn-text">Close</div>
          </button>
        </div>
      )}
    </div>
  );
};

export default SolanaWallet;
