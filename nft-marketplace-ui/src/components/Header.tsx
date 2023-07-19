import Link from 'next/link';
import { ConnectButton } from 'web3uikit';

export const Header = () => {
   return (<div className='p-4 border-b-2'>
    <div className="flex justify-between">
        <div>

<Link href='/'>
        <h1>NFT Marketplace</h1>
</Link>
<Link href='/sell'>
        <h2>sell</h2>
</Link>
        </div>
        <ConnectButton />
    </div>


   </div>)

}