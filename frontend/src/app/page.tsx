'use client'

import { useState } from "react"
import { useWeb3 } from "@/contexts/Web3Context"
import DocumentUpload from "@/components/DocumentUpload"
import DocumentList from "@/components/DocumentList"
import TransactionHistory from "@/components/TransactionHistory"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, History, LogOut, Upload } from "lucide-react"

export default function Home() {
  const { account, connectWallet, disconnectWallet } = useWeb3()
  const [activeTab, setActiveTab] = useState("documents")

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="flex h-screen bg-black text-white font-sans antialiased overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]">
        <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/30 via-transparent to-blue-500/30 animate-gradient-shift" />
      </div>
      <nav className="relative z-10 w-64 bg-zinc-900/50 backdrop-blur-xl border-r border-zinc-800 p-4 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 text-transparent bg-clip-text">
            GovChain
          </h1>
          <p className="text-sm text-zinc-400">Document Management</p>
        </div>
        <div className="space-y-2 flex-1">
          {[
            { id: "documents", icon: FileText, label: "My Documents" },
            { id: "upload", icon: Upload, label: "Upload Document" },
            { id: "history", icon: History, label: "Transaction History" },
          ].map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={`w-full justify-start ${
                activeTab === item.id ? "bg-zinc-800/50 text-white" : ""
              }`}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>
        <div className="mt-auto">
          {account ? (
            <>
              <div className="mb-2 p-2 rounded-md bg-zinc-800/50 text-xs font-mono text-zinc-400">
                {truncateAddress(account)}
              </div>
              <Button onClick={disconnectWallet} variant="ghost" className="w-full justify-start text-red-400">
                <LogOut className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </>
          ) : (
            <Button onClick={connectWallet} className="w-full">
              Connect Wallet
            </Button>
          )}
        </div>
      </nav>


      <main className="flex-1 p-6 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">
              {activeTab === "documents" && "My Documents"}
              {activeTab === "upload" && "Upload Document"}
              {activeTab === "history" && "Transaction History"}
            </h1>

            {account ? (
              <>
                {activeTab === "documents" && <DocumentList />}
                {activeTab === "upload" && <DocumentUpload />}
                {activeTab === "history" && <TransactionHistory />}
              </>
            ) : (
              <div className="text-center text-zinc-400 py-12">
                Please connect your wallet to access the document management system.
              </div>
            )}
          </div>
        </ScrollArea>
      </main>
    </div>
  )
}
