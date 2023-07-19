"use client";
import { ethers } from 'ethers';
import { atom, useAtom } from 'jotai';
import React, { useEffect } from 'react';

declare global {
  interface Window {
    ethereum: any;
  }
}

// Create your atoms and derivatives
const accountAtom = atom<string>('');
const useConnectedAccount = () => useAtom(accountAtom)

const useAutoReconnect = () => {
  const [, setAccount] = useConnectedAccount();
    useEffect(() => {
        const provider = new ethers.BrowserProvider(window.ethereum);
        provider.send('eth_accounts', []).then(accounts => {
            if (accounts.length > 0) setAccount(accounts[0]);
        })
      }, [])
}

export const WalletProfile = () => {
  const [account, setAccount] = useConnectedAccount();

  useAutoReconnect();

  const connectWallet = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_requestAccounts', [])
    setAccount(accounts[0]);
  }


if (account) {
    return <div>{account.slice(0, 6)}...{account.slice(-4)}</div>
}

  return (
    <button onClick={connectWallet}>Connect wallet</button>
  )
}