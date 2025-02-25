import {ConnectedSolanaWallet, usePrivy, User} from '@privy-io/react-auth';
import {PublicKey, Transaction} from '@solana/web3.js';
import bs58 from 'bs58';
import React, {useState} from 'react';
import {toast} from 'react-toastify';

interface SolanaWalletProps {
  wallet: ConnectedSolanaWallet;
  index: number;
  user: User;
}

async function requestRewardClaim(rewardKind: string, walletAddress: string) {
  // Send to backend
  const response = await fetch('http://localhost:5000/api/request-reward-claim', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      rewardKind,
      userWalletAddress: walletAddress,
    }),
  });

  const result = await response.json();

  return result as {rewardId: string; serializedTransaction: string};
}

async function claimReward(
  signature: string,
  rewardId: string,
  userId: string,
  walletAddress: string,
  serializedTransaction: string,
) {
  // Send to backend
  const response = await fetch('http://localhost:5000/api/claim-reward', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      signature,
      rewardId,
      userId,
      userPublicKey: walletAddress,
      serializedTransaction,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to claim reward');
  }

  return result as {identifier: string; code: string; signature: string};
}

const SolanaWallet: React.FC<SolanaWalletProps> = ({wallet, index, user}) => {
  const [showSignMessage, setShowSignMessage] = useState(false);
  const [showSendTransaction, setShowSendTransaction] = useState(false);
  const {signMessage} = usePrivy();

  const rewardKind = '20% off';
  const platformWalletPublicKey = new PublicKey('2BrPimYeYc26ghuGtPDWhGy7BAHDQeviSvQWsRRCUL7q');

  const customSolanaSendTransaction = async () => {
    try {
      const rewardClaim = await requestRewardClaim(rewardKind, wallet.address);
      const transaction = Transaction.from(bs58.decode(rewardClaim.serializedTransaction));

      // Sign the transaction with the user's wallet
      const signedTx = await wallet.signTransaction!(transaction);
      const serializedTx = bs58.encode(signedTx.serialize({requireAllSignatures: false}));
      const signature = signedTx.signatures[1].signature!.toString('base64');

      // Send to backend
      const reward = await claimReward(
        signature,
        rewardClaim.rewardId,
        user.id,
        wallet.address,
        serializedTx,
      );

      toast.success(`Reward claimed successfully! Tx: ${reward.signature}`);
    } catch (error: any) {
      toast.error(`Failed to send transaction: ${error?.message}`);
    }
  };

  const customSignMessage = async () => {
    try {
      const signature = await signMessage({message: 'Your message here'});
      toast.success(`Message signed successfully! ${signature}`);
    } catch (error: any) {
      toast.error(`Failed to sign message: ${error?.message}`);
    }
  };

  return (
    <div className="wallet-container">
      <h3 className="wallet-header">Solana wallet {index + 1}</h3>
      <p className="wallet-address">
        <span className="break-all">{wallet.address}</span>
      </p>
      <div className="flex justify-between">
        <div className="flex flex-col">
          <button
            onClick={() => setShowSignMessage(true)}
            className="wallet-button wallet-button-primary mb-3"
          >
            <div className="btn-text">Sign message</div>
          </button>
          <button
            onClick={() => setShowSendTransaction(true)}
            className="wallet-button wallet-button-secondary"
          >
            <div className="btn-text">Send transaction</div>
          </button>
        </div>
      </div>
      {showSignMessage && (
        <div className="mt-4 p-2 border rounded shadow bg-white text-left">
          <h2 className="text-lg font-semibold mb-2">Sign message confirmation</h2>
          <p className="text-xs text-gray-600 mb-2">
            Signing message with Privy wallet: <span className="break-all">{wallet.address}</span>
          </p>
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => customSignMessage()}
              className="wallet-button wallet-button-primary"
            >
              <div className="btn-text">Sign message</div>
            </button>
            <button
              onClick={() => setShowSignMessage(false)}
              className="wallet-button wallet-button-secondary"
            >
              <div className="btn-text">Cancel</div>
            </button>
          </div>
        </div>
      )}
      {showSendTransaction && (
        <div className="mt-4 p-2 border rounded shadow bg-white text-left">
          <h2 className="text-lg font-semibold mb-2">Claim Reward</h2>
          <p className="text-xs text-gray-600 mb-2">
            From: <br />
            <span className="break-all">{wallet.address}</span>
          </p>
          <p className="text-xs text-gray-600 mb-2">
            To Vault: <br />
            <span className="break-all">{platformWalletPublicKey.toString()}</span>
          </p>
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => customSolanaSendTransaction()}
              className="wallet-button wallet-button-primary"
            >
              <div className="btn-text">Claim</div>
            </button>
            <button
              onClick={() => setShowSendTransaction(false)}
              className="wallet-button wallet-button-secondary"
            >
              <div className="btn-text">Cancel</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SolanaWallet;
