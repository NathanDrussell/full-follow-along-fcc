import { WalletProfile } from "./components/WalletProfile";


export default function Home() {
  return (
    <main className="">
    <div className="flex p-4 justify-between">
      <h1>Decentralized Lottery</h1>

      <WalletProfile />
    </div>
    <hr />
    <div className="p-4">
      <h2>Lottery</h2>
      <span><strong>Current playesr:</strong> {'-'}</span>
      <span><strong>Last drew winner:</strong> {'-'}</span>
      <span><strong>You haven't entered</strong></span>

      <button>
        Enter lottery
      </button>
    </div>
    </main>
  )
}
