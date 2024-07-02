// @ts-nocheck
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import { useQuery } from "react-query"
import { useRecoilValue } from "recoil"
import { convertMicroDenomToDenom } from "../../utils/conversion/conversion"
import { CW20 } from "../../services/newServices/cw20"
import { walletState } from "../../state/walletAtoms"
import { DEFAULT_TOKEN_BALANCE_REFETCH_INTERVAL } from "../../utils/constants"
import { nativeDenom } from "../../data/contract/juno_queries"
import {LOOP_addr} from "../../constants";
import {priceKeyIndexState} from "../../data/app";
import {fetchAPIQuery} from "../../data/API/dashboard";
import { WalletConnectionStatus } from "@noahsaso/cosmodal"

export async function fetchTokenBalance({
    client,
    token: { denom, native, token_address, decimals },
    address,
  }: {
    client: SigningCosmWasmClient
    token: {
      denom?: string
      token_address?: string
      native?: boolean
      decimals?: number
    }
    address: string
  }) {
    if (!denom && !token_address) {
      throw new Error(
        `No denom or token_address were provided to fetch the balance.`
      )
    }
  
    /*
     * if this is a native asset or an ibc asset that has juno_denom
     *  */
    if (native) {
      const coin = await client.getBalance(address, denom)
      const amount = coin ? Number(coin.amount) : 0
      return convertMicroDenomToDenom(amount, decimals)
    }
  
    /*
     * everything else
     *  */
    if (token_address) {
      const balance = await CW20(client).use(token_address).balance(address)
      return convertMicroDenomToDenom(Number(balance), decimals)
    }
  
    return 0
  }

//   export const useJunoTokenBalance =  (tokenSymbol: string) => {
//     const { address, status ,client} = useRecoilValue(walletState)
//     if (tokenSymbol && client) {
//       const data = fetchTokenBalance({
//         client,
//         token: unsafelyGetTokenInfo(tokenSymbol),
//         address: address,
//       })
//       return data
//     }
//   }

  export const useJunoTokenBalance = (tokenSymbol: string) => {
    let { address, status, client  } = useRecoilValue(walletState)

    const { data: balance = 0, refetch, isLoading } = useQuery(
      ['tokenBalance', tokenSymbol, address],
      async ({ queryKey: [, symbol] }) => {
        if (symbol && client) {
          
          const token = { denom: nativeDenom ?? 'ujunox', token_address: '', native: true, decimals: 6 }
          
          return await fetchTokenBalance({
            client,
            address,
            token: token ?? {},
          })
        }
      },
      {
        enabled: Boolean(tokenSymbol && status === WalletConnectionStatus.Connected || tokenSymbol && status === 4),
        refetchOnMount: 'always',
        refetchInterval: 5000,
        refetchIntervalInBackground: true,
      }
    )
  
    return { balance, isLoading, refetch }
  }