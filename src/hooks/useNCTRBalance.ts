import { useReadContract, useAccount } from 'wagmi';
import { formatUnits } from 'viem';

const NCTR_CONTRACT_ADDRESS = '0x973104fAa7F2B11787557e85953ECA6B4e262328' as const;

// ERC20 ABI for balanceOf and decimals
const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export function useNCTRBalance() {
  const { address, isConnected } = useAccount();

  // Fetch token balance
  const { data: balance, isLoading: isLoadingBalance, refetch: refetchBalance } = useReadContract({
    address: NCTR_CONTRACT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  });

  // Fetch token decimals
  const { data: decimals } = useReadContract({
    address: NCTR_CONTRACT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'decimals',
  });

  // Format balance
  const formattedBalance = balance && decimals 
    ? formatUnits(balance, decimals)
    : '0';

  const numericBalance = parseFloat(formattedBalance);

  return {
    balance: numericBalance,
    formattedBalance,
    isLoading: isLoadingBalance,
    isConnected,
    contractAddress: NCTR_CONTRACT_ADDRESS,
    refetch: refetchBalance,
  };
}
