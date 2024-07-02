import { ChainInfo } from '@keplr-wallet/types'
import {CHAIN_INFO} from '../../data/contract/juno_queries'

export const unsafelyReadChainInfoCache = () => CHAIN_INFO

export const useChainInfo = () => {
  // const { data, isLoading } = useQuery<ChainInfo>(
  //   chainInfoQueryKey,
  //   async () => {
  //     const response = ChainData 
  //     return response
  //   },
  //   {
  //     onError(e) {
  //       console.error('Error loading chain info:', e)
  //     },
  //   }
  // )
  const isLoading = false
  const data: ChainInfo = CHAIN_INFO

  return [data, isLoading] as const
}
