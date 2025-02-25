import React, { useState } from 'react';
import { usePrivy, ConnectedSolanaWallet } from '@privy-io/react-auth';
import { PublicKey, Transaction, Connection } from '@solana/web3.js';
import { createTransferInstruction, TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { toast } from 'react-toastify';
import bs58 from 'bs58'

interface SolanaWalletProps {
  wallet: ConnectedSolanaWallet;
  index: number;
}

const SolanaWallet: React.FC<SolanaWalletProps> = ({ wallet, index }) => {
  const [showSignMessage, setShowSignMessage] = useState(false);
  const [showSendTransaction, setShowSendTransaction] = useState(false);
  const { signMessage } = usePrivy();

  const tokensSent = 100;

  const customSolanaSendTransaction = async () => {
    try {
      // Configure connection to Devnet (or Mainnet if configured in backend)
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

      // Fetch recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();

      // Platform vault public key (from your backend config)
      const platformWalletPublicKey = new PublicKey('2BrPimYeYc26ghuGtPDWhGy7BAHDQeviSvQWsRRCUL7q');
      const mintPublicKey = new PublicKey('CTMApYyrzN8PnchQ48XUzxi1ESuSpHjd1p5ZVA8mpvVk');
      const mintDecimals = 9; // Adjust based on your token's decimals
      const userPublicKey = new PublicKey(wallet.address);

      // Get associated token accounts
      const userTokenAccount = await getAssociatedTokenAddress(mintPublicKey, userPublicKey);
      const platformTokenAccount = await getAssociatedTokenAddress(mintPublicKey, platformWalletPublicKey);

      // Example reward claim: 100 tokens
      const tokensInSmallestUnit = Math.floor(tokensSent * Math.pow(10, mintDecimals));

      // Build transaction
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: platformWalletPublicKey,
      }).add(
        createTransferInstruction(
          userTokenAccount, // Source: user's token account
          platformTokenAccount, // Destination: platform's vault
          userPublicKey, // Owner: user's wallet
          tokensInSmallestUnit, // Amount in smallest unit
          [], // No multi-signers
          TOKEN_PROGRAM_ID
        )
      );

      // Sign the transaction with the user's wallet
      const signedTx = await wallet.signTransaction!(transaction);
      const serializedTx = bs58.encode(signedTx.serialize({ requireAllSignatures: false }));
      const signature = signedTx.signatures[1].signature?.toString('base64');

      // Send to backend
      const response = await fetch('http://localhost:5000/api/claim-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature,
          rewardKind: '2x1', // Example reward kind
          userId: 'user123', // Example user ID
          userPublicKey: wallet.address,
          tokensSent,
          serializedTransaction: serializedTx,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Reward claimed successfully! Tx: ${result.signature}`);
      } else {
        throw new Error(result.error || 'Failed to claim reward');
      }
    } catch (error: any) {
      toast.error(`Failed to send transaction: ${error?.message}`);
    }
  };

  const customSignMessage = async () => {
    try {
      const signature = await signMessage({ message: 'Your message here' });
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
            <span className="break-all">2BrPimYeYc26ghuGtPDWhGy7BAHDQeviSvQWsRRCUL7q</span>
          </p>
          <p className="text-xs text-gray-600 mb-2">Tokens: {tokensSent}</p>
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