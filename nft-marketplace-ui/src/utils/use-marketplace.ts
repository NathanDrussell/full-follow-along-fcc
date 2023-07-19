import { useChain, useWeb3Contract } from 'react-moralis';
import * as localhostMarketplace from './contracts.localhost.json';

// listAsset
// buyAsset
// updateAsset
// cancelAsset

const MARKETPLACE_CONTRACTS = {
    [localhostMarketplace.network.chainId]: localhostMarketplace
}


export const useMarketplace = () => {
    const chain = useChain()
    const contracts = MARKETPLACE_CONTRACTS[chain.chainId as any]

    const listAsset = useWeb3Contract({
        abi: contracts.Marketplace.abi,
        contractAddress: contracts.Marketplace.address,
        functionName: 'listAsset',
        params: {}
    })

    const buyAsset = useWeb3Contract({
        abi: contracts.Marketplace.abi,
        contractAddress: contracts.Marketplace.address,
        functionName: 'buyAsset',
        params: {}
    })

    const updateAsset = useWeb3Contract({
        abi: contracts.Marketplace.abi,
        contractAddress: contracts.Marketplace.address,
        functionName: 'updateAsset',
        params: {}
    })

    const cancelAsset = useWeb3Contract({
        abi: contracts.Marketplace.abi,
        contractAddress: contracts.Marketplace.address,
        functionName: 'cancelListing',
        params: {}
    })

    return {
        listAsset,
        buyAsset,
        updateAsset,
        cancelAsset
    }
}


