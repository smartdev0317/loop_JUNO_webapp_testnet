import { useEffect, useState } from "react"
import { div } from "../libs/math"
import {  useFetchTokens } from "../hooks"
import { Type } from "../pages/Exchange"
// import { useQuery } from "@apollo/client"
// import { CONTRACT } from "../graphql/gqldocs"
import {useProtocol} from "../data/contract/protocol";
import { useRecoilValue } from "recoil"
// import { contractQuery } from "../data/contract/juno_queries"
import { walletState } from "../state/walletAtoms"
import { useQuery } from "react-query"

interface Params {
  amount: string
  token: string
  pair: string
  reverse: boolean
  type: Type
  index: number
}

interface SimulatedData {
  return_amount: string
  offer_amount: string
  commission_amount: string
  spread_amount: string
}

interface Simulated {
  amount: string
  spread: string
  commission: string
  price: string
}
interface CONTRACTType {
  pair: string
  denom?: string
  isNative: boolean
  contract_addr: string
  tokenSymbol?: string
  tokenName?: string

}

export default ({ amount: value, token, pair, reverse, type = Type.SWAP, index }: Params) => {
  const [simulated, setSimulated] = useState<Simulated>()
  const { ifNative } = useFetchTokens()

  /* context */
  const { toToken, toPlainString } = useProtocol()

  const amount = toPlainString(value)

  const toNative = (tokenParam: undefined | CONTRACTType, amount: string = "0"): any => {
    try {
      return { amount: amount ?? "0", info: { native_token: { denom: token ? tokenParam?.denom ?? "" : "" } } }
    }catch (e){
      return { amount: "0", info: { native_token: { denom: "" } } }
    }
  }

  /* query */
  const nati2 = toToken({ token, amount: amount ?? "0" })
  const nati1 = toNative(ifNative(token), amount ?? "0")

  // const variables = {
  //   contract: !pair || pair.length <= 0 ? undefined : pair,
  //   msg: !reverse
  //       ? `{"simulation": {"offer_asset":${ifNative(token) ? nati1  :  nati2} }}`
  //       : `{"reverse_simulation": { "ask_asset": ${ifNative(token)
  //           ? JSON.stringify(toNative(ifNative(token), amount ?? "0"))
  //           : JSON.stringify(toToken({ token, amount: amount ?? "0" }))}}}`,
  // }

   const variablesJuno = !reverse
   ? { simulation: { offer_asset: ifNative(token) ? nati1  :  nati2} }
   : { reverse_simulation: { ask_asset: ifNative(token)
       ? toNative(ifNative(token), amount ?? "0")
       : toToken({ token, amount: amount ?? "0" })}}
  // const result = useRecoilValue(contractQuery({ address: !pair || pair.length <= 0 ? '' : pair, variables: variablesJuno }))
  // const { data: parsed, error } = result ?? { data: {}, error: undefined }

  const { client } = useRecoilValue(walletState)
  const address = !pair || pair.length <= 0 ? '' : pair

  let { data, isLoading, refetch, error } = useQuery<SimulatedData>(
    '@token-list'+index,
    async () => {
      if(client && address){
        try{
          const data: SimulatedData = await client.queryContractSmart(!address || address.length <= 0 ? '' : address, variablesJuno)
          return data
        }catch(e){
          return { return_amount: "0", offer_amount: "0", spread_amount: "0", commission_amount: "0"}
        }
      }
    },
    {
      onError(e) {
        console.error('Error loading token list:', e)
      },
      refetchOnMount: true,
      refetchIntervalInBackground: true,
      refetchInterval: 1000 * 60,
    }
  )
  let parsed = data
  // const [parsed, setParsed] = useState<SimulatedData | undefined>(undefined)
  // const { refetch, error, loading } = useQuery(CONTRACT, {
  //   fetchPolicy: "cache-and-network",
  //   skip: true,
  //   variables: variables,
  //   onCompleted: (result) => {
  //     result.WasmContractsContractAddressStore.Result && setParsed(JSON.parse(result.WasmContractsContractAddressStore.Result))
  //   },
  //   onError: (error) =>{
  //     setParsed({return_amount: "0", offer_amount: "0", spread_amount: "0", commission_amount: "0"} as SimulatedData)
  //   }
  // })

  useEffect(() => {
    refetch()
  }, [value])

  const simulatedAmount = !reverse
      ? parsed?.return_amount
      : parsed?.offer_amount
      
  const spread = parsed?.spread_amount
  const commission = parsed?.commission_amount

  const price = {
    [Type.SWAP]: !reverse
        ? div(amount, simulatedAmount)
        : div(simulatedAmount, amount),
    [Type.SELL]: !reverse
        ? div(simulatedAmount, amount)
        : div(amount, simulatedAmount),
  }[type]

  useEffect(() => {
    error
        ? setSimulated(undefined)
        : simulatedAmount &&
        spread &&
        commission &&
        price &&
        setSimulated({ amount: simulatedAmount, spread, commission, price })
  }, [simulatedAmount, spread, commission, price, error])

  return { simulated, error, loading: isLoading, refetch }
}
