"use client"

import { useContractRead } from "wagmi"
import { parseAbi } from "viem"

interface AllocationRowProps {
  marketToken: string
  allocation: string
}

export function AllocationRow({ marketToken, allocation }: AllocationRowProps) {
  // Get market token symbol
  const { data: symbol } = useContractRead({
    address: marketToken as `0x${string}`,
    abi: parseAbi(["function symbol() view returns (string)"]),
    functionName: "symbol",
  })

  // Build standardized token icon path using uppercase symbols with aliasing
  const toIconPath = (symbol: string) => {
    const base = (symbol || '').split('_')[1] || symbol
    const u = (base || '').toUpperCase()
    return `/tokens/${u}.png`
  }

  // Format market name from GTX_TOKEN_USDC to TOKEN/USDC
  const formatMarketName = (symbol: string) => {
    const parts = symbol.split("_")
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}`
    }
    return symbol
  }

  const formattedSymbol = (symbol ?? "") as string
  const marketName = formatMarketName(formattedSymbol) || `${marketToken.slice(0, 6)}...${marketToken.slice(-4)}`

  // Format allocation percentage
  const allocationPercentage = Number(allocation) / 100

  return (
    <tr className="border-b border-blue-500/20 hover:bg-blue-500/5 transition-colors duration-200">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 p-0.5">
            <img
              src={toIconPath(formattedSymbol) || "/tokens/default-token.png"}
              alt={marketName}
              className="w-full h-full rounded-full bg-black"
            />
          </div>
          <span className="text-blue-500 font-medium">{marketName}</span>
        </div>
      </td>
      <td className="p-4 font-medium">{allocationPercentage}%</td>
    </tr>
  )
}

