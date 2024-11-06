import { useState } from 'react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from  "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, AlertCircle, CheckCircle2, Loader2,FileText, ArrowUpCircle} from "lucide-react"
import toast from 'react-hot-toast'
import { useWeb3 } from '../contexts/Web3Context'
import { ethers } from 'ethers'

interface PropertyDetails {
  propertyType: string;
  location: string;
  area: string;
  propertyValue: string;
  propertyDescription: string;
}

interface TransactionMetadata {
  hash: string;
  blockNumber: number;
  gasUsed: string;
  tokenId: string;
  ipfsHash: string;
}

export default function DocumentUpload() {
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState<string | null>(null)
  const {contract, account, uploadToPinata } = useWeb3()
  const [file, setFile] = useState<File | null>(null)
  const [propertyDetails, setPropertyDetails] = useState<PropertyDetails>({
    propertyType: '',
    location: '',
    area: '',
    propertyValue: '',
    propertyDescription: ''
  })

  const handleInputChange = (field: keyof PropertyDetails, value: string) => {
    setPropertyDetails(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const showTransactionDetails = (metadata: TransactionMetadata) => {
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-zinc-900 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <ArrowUpCircle className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-foreground">
                  Document Uploaded Successfully
                </p>
                <div className="mt-1 space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <FileText className="h-4 w-4 mr-1" />
                    Token ID: #{metadata.tokenId}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Transaction Hash: {truncateAddress(metadata.hash)}</div>
                    <div>Block Number: {metadata.blockNumber}</div>
                    <div>Gas Used: {metadata.gasUsed}</div>
                    <div className="truncate">
                      IPFS Hash: {truncateAddress(metadata.ipfsHash)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex border-l border-zinc-700">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary hover:text-primary/80 focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      ),
      {
        duration: 8000,
        position: 'top-right',
      }
    )
  }

  const createJsonFile = () => {
    const jsonData = JSON.stringify(propertyDetails, null, 2)
    const blob = new Blob([jsonData], { type: 'application/json' })
    return new File([blob], 'property-details.json', { type: 'application/json' })
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }


  const handleUpload = async (e: React.FormEvent) => {
    console.log("clicked");
    console.log(contract);
    console.log(account);
    e.preventDefault()
    if (!contract || !account) return
    console.log("reached");

    try {
      setUploading(true)
      setError(null)
      
      // Create JSON file from property details
      const file = createJsonFile()
      setStatus('Creating JSON file...')
      
      const ipfsHash = await uploadToPinata(file)

      setStatus('Preparing transaction...')
      
      const provider = new ethers.BrowserProvider(window.ethereum)
      const network = await provider.getNetwork()
      console.log('Current network:', network)

      const balance = await provider.getBalance(account)
      console.log('Account balance:', ethers.formatEther(balance))

      setStatus('Estimating gas...')
      const gasEstimate = await contract.uploadDocument.estimateGas(ipfsHash)
      console.log('Estimated gas:', gasEstimate.toString())

      const gasLimit = Math.ceil(Number(gasEstimate) * 1.2)
      
      setStatus('Creating transaction...')
      const tx = await contract.uploadDocument(ipfsHash, {
        from: account,
        gasLimit: gasLimit,
      })
      
      setStatus('Waiting for confirmation...')
      console.log('Transaction hash:', tx.hash)
      
      const receipt = await tx.wait()
      console.log('Transaction receipt:', receipt)

      // Get the token ID from the DocumentCreated event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsedLog = contract.interface.parseLog(log);
          return parsedLog?.name === 'DocumentCreated';
        } catch {
          return false;
        }
      });

      const tokenId = event ? contract.interface.parseLog(event)?.args?.[0].toString() : 'Unknown';
      
      // Show transaction details toast
      showTransactionDetails({
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        tokenId: tokenId,
        ipfsHash: ipfsHash
      });
      
      setStatus('Document uploaded successfully!')
      setFile(null)

      
    } catch (error: any) {
      console.error('Upload error details:', error)
      let errorMessage = 'Error uploading document. '
      
      if (error.code === 'ACTION_REJECTED') {
        errorMessage += 'Transaction was rejected by user.'
      } else if (error.code === -32603) {
        errorMessage += 'Please verify you have enough ETH and are connected to the correct network.'
      } else {
        errorMessage += error.message || 'Unknown error occurred.'
      }
      
      setError(errorMessage)
      setStatus('')

      toast.error(
        <div className="flex flex-col gap-1">
          <span className="font-medium">Upload Failed</span>
          <span className="text-sm">{errorMessage}</span>
        </div>
      );
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Property Details</CardTitle>
        <CardDescription>Enter property details to create and upload JSON document</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpload} className="space-y-6">
        <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="propertyType">Property Type</Label>
              <Select
                value={propertyDetails.propertyType}
                onValueChange={(value) => handleInputChange('propertyType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={propertyDetails.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Enter property location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Area (sq ft)</Label>
              <Input
                id="area"
                type="number"
                value={propertyDetails.area}
                onChange={(e) => handleInputChange('area', e.target.value)}
                placeholder="Enter property area"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="propertyValue">Property Value</Label>
              <Input
                id="propertyValue"
                type="number"
                value={propertyDetails.propertyValue}
                onChange={(e) => handleInputChange('propertyValue', e.target.value)}
                placeholder="Enter property value"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="propertyDescription">Property Description</Label>
              <Textarea
                id="propertyDescription"
                value={propertyDetails.propertyDescription}
                onChange={(e) => handleInputChange('propertyDescription', e.target.value)}
                placeholder="Enter property description"
                rows={4}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={
              uploading || 
              !propertyDetails.propertyType || 
              !propertyDetails.location || 
              !propertyDetails.area || 
              !propertyDetails.propertyValue
            }
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {status}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Property Details
              </>
            )}
          </Button>

          {(status || error) && (
            <Alert variant={error ? "destructive" : "success"}>
              <div className="flex items-start gap-2">
                {error ? (
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mt-0.5" />
                )}
                <AlertDescription>
                  {error || status}
                </AlertDescription>
              </div>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

// import { useState } from 'react'
// import { useWeb3 } from '@/contexts/Web3Context'
// import { ethers } from 'ethers'
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Label } from "@/components/ui/label"
// import { Upload, Network, AlertCircle, CheckCircle2, Loader2, FileText, ArrowUpCircle } from "lucide-react"
// import { cn } from "@/lib/utils"
// import toast from 'react-hot-toast'

// interface TransactionMetadata {
//   hash: string;
//   blockNumber: number;
//   gasUsed: string;
//   tokenId: string;
//   ipfsHash: string;
// }

// export default function DocumentUpload() {
//   const { contract, account, uploadToPinata } = useWeb3()
//   const [file, setFile] = useState<File | null>(null)
//   const [uploading, setUploading] = useState(false)
//   const [status, setStatus] = useState('')
//   const [error, setError] = useState<string | null>(null)

//   const showTransactionDetails = (metadata: TransactionMetadata) => {
//     toast.custom(
//       (t) => (
//         <div
//           className={`${
//             t.visible ? 'animate-enter' : 'animate-leave'
//           } max-w-md w-full bg-zinc-900 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
//         >
//           <div className="flex-1 w-0 p-4">
//             <div className="flex items-start">
//               <div className="flex-shrink-0 pt-0.5">
//                 <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
//                   <ArrowUpCircle className="h-6 w-6 text-green-500" />
//                 </div>
//               </div>
//               <div className="ml-3 flex-1">
//                 <p className="text-sm font-medium text-foreground">
//                   Document Uploaded Successfully
//                 </p>
//                 <div className="mt-1 space-y-1">
//                   <div className="flex items-center text-sm text-muted-foreground">
//                     <FileText className="h-4 w-4 mr-1" />
//                     Token ID: #{metadata.tokenId}
//                   </div>
//                   <div className="text-xs text-muted-foreground space-y-1">
//                     <div>Transaction Hash: {truncateAddress(metadata.hash)}</div>
//                     <div>Block Number: {metadata.blockNumber}</div>
//                     <div>Gas Used: {metadata.gasUsed}</div>
//                     <div className="truncate">
//                       IPFS Hash: {truncateAddress(metadata.ipfsHash)}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//           <div className="flex border-l border-zinc-700">
//             <button
//               onClick={() => toast.dismiss(t.id)}
//               className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary hover:text-primary/80 focus:outline-none"
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       ),
//       {
//         duration: 8000,
//         position: 'top-right',
//       }
//     );
//   };

//   const handleUpload = async (e: React.FormEvent) => {
//     console.log(contract)
//     e.preventDefault()
//     if (!file || !contract || !account) return

//     try {
//       setUploading(true)
//       setError(null)
//       setStatus('Uploading to IPFS...')
      
//       const ipfsHash = await uploadToPinata(file)
      
//       setStatus('Preparing transaction...')
      
//       const provider = new ethers.BrowserProvider(window.ethereum)
//       const network = await provider.getNetwork()
//       console.log('Current network:', network)

//       const balance = await provider.getBalance(account)
//       console.log('Account balance:', ethers.formatEther(balance))

//       setStatus('Estimating gas...')
//       const gasEstimate = await contract.uploadDocument.estimateGas(ipfsHash)
//       console.log('Estimated gas:', gasEstimate.toString())

//       const gasLimit = Math.ceil(Number(gasEstimate) * 1.2)
      
//       setStatus('Creating transaction...')
//       const tx = await contract.uploadDocument(ipfsHash, {
//         from: account,
//         gasLimit: gasLimit,
//       })
      
//       setStatus('Waiting for confirmation...')
//       console.log('Transaction hash:', tx.hash)
      
//       const receipt = await tx.wait()
//       console.log('Transaction receipt:', receipt)

//       // Get the token ID from the DocumentCreated event
//       const event = receipt.logs.find((log: any) => {
//         try {
//           const parsedLog = contract.interface.parseLog(log);
//           return parsedLog?.name === 'DocumentCreated';
//         } catch {
//           return false;
//         }
//       });

//       const tokenId = event ? contract.interface.parseLog(event)?.args?.[0].toString() : 'Unknown';
      
//       // Show transaction details toast
//       showTransactionDetails({
//         hash: receipt.hash,
//         blockNumber: receipt.blockNumber,
//         gasUsed: receipt.gasUsed.toString(),
//         tokenId: tokenId,
//         ipfsHash: ipfsHash
//       });
      
//       setStatus('Document uploaded successfully!')
//       setFile(null)
//     } catch (error: any) {
//       console.error('Upload error details:', error)
//       let errorMessage = 'Error uploading document. '
      
//       if (error.code === 'ACTION_REJECTED') {
//         errorMessage += 'Transaction was rejected by user.'
//       } else if (error.code === -32603) {
//         errorMessage += 'Please verify you have enough ETH and are connected to the correct network.'
//       } else {
//         errorMessage += error.message || 'Unknown error occurred.'
//       }
      
//       setError(errorMessage)
//       setStatus('')

//       toast.error(
//         <div className="flex flex-col gap-1">
//           <span className="font-medium">Upload Failed</span>
//           <span className="text-sm">{errorMessage}</span>
//         </div>
//       );
//     } finally {
//       setUploading(false)
//     }
//   }

//   const verifyNetwork = async () => {
//     if (window.ethereum) {
//       try {
//         await window.ethereum.request({
//           method: 'wallet_switchEthereumChain',
//           params: [{ chainId: '0x7A69' }],
//         })
//       } catch (switchError: any) {
//         if (switchError.code === 4902) {
//           try {
//             await window.ethereum.request({
//               method: 'wallet_addEthereumChain',
//               params: [{
//                 chainId: '0x7A69',
//                 chainName: 'Anvil Local',
//                 nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
//                 rpcUrls: ['http://127.0.0.1:8545'],
//               }],
//             })
//           } catch (addError) {
//             console.error('Error adding network:', addError)
//           }
//         }
//       }
//     }
//   }

//   const truncateAddress = (address: string) => {
//     return `${address.slice(0, 6)}...${address.slice(-4)}`
//   }

//   return (
//     <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
//       <CardHeader>
//         <CardTitle>Upload Document</CardTitle>
//         <CardDescription>Upload your document to IPFS and register it on the blockchain</CardDescription>
//       </CardHeader>
//       <CardContent>
//         <form onSubmit={handleUpload} className="space-y-6">
//           <div className="space-y-2">
//             <Label htmlFor="document">Select Document</Label>
//             <div className="relative">
//               <input
//                 id="document"
//                 type="file"
//                 onChange={(e) => setFile(e.target.files?.[0] || null)}
//                 className="hidden"
//                 disabled={uploading}
//               />
//               <Button
//                 type="button"
//                 variant="outline"
//                 className={cn(
//                   "w-full justify-start text-muted-foreground hover:text-foreground",
//                   file && "text-foreground"
//                 )}
//                 onClick={() => document.getElementById("document")?.click()}
//                 disabled={uploading}
//               >
//                 <Upload className="mr-2 h-4 w-4" />
//                 {file ? file.name : "Choose file"}
//               </Button>
//             </div>
//           </div>

//           <div className="space-y-2">
//             <Button
//               type="button"
//               variant="secondary"
//               className="w-full"
//               onClick={verifyNetwork}
//               disabled={uploading}
//             >
//               <Network className="mr-2 h-4 w-4" />
//               Verify Network Connection
//             </Button>

//             <Button
//               type="submit"
//               className="w-full"
//               disabled={!file || uploading || !account}
//             >
//               {uploading ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   {status}
//                 </>
//               ) : (
//                 <>
//                   <Upload className="mr-2 h-4 w-4" />
//                   Upload Document
//                 </>
//               )}
//             </Button>
//           </div>

//           {(status || error) && (
//             <div className={cn(
//               "p-3 rounded-lg text-sm flex items-start gap-2",
//               error ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
//             )}>
//               {error ? (
//                 <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
//               ) : (
//                 <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
//               )}
//               <p>{error || status}</p>
//             </div>
//           )}

//           {account && (
//             <div className="text-sm text-muted-foreground text-center">
//               Connected Account: {truncateAddress(account)}
//             </div>
//           )}
//         </form>
//       </CardContent>
//     </Card>
//   )
// }