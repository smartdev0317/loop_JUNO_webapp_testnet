import Tooltip from "../../lang/Tooltip.json"
import useHash from "../../libs/useHash"
import { useTokenMethods } from "../../data/contract/info"
import { useState } from "react"
import { PostError } from "../../forms/CustomMsgFormContainer"
import Container from "../../components/Container"
import { useFindTokenDetails } from "../../data/form/select"
import { DeliverTxResponse } from "@cosmjs/stargate"
import ProExchangeForm from "../../forms/Exchange/ProExchangeForm";
import useProSwapReceipt from "forms/receipts/useProSwapReceipt"
import { useRecoilValue } from "recoil"
import { recordAggTx } from "data/API/dashboard"
import ProResult from "forms/ProResult"

export enum Type {
  "SWAP" = "Swap",
  "SELL" = "sell",
}
export interface EXCHANGE_TOKEN {
  token?: string
  symbol?: string
}

const DashboardExchange = ({
  formUpdated,
  collapseAble,
}: {
  formUpdated?: (status: boolean) => void
  collapseAble?: boolean
}) => {
  const { check8decOper } = useTokenMethods()
  const [updateTransactions, setUpdateTransactions] = useState(false)

  const { hash: type } = useHash<Type>(Type.SWAP)
  // const { state } = useLocation<{ token1?: string; token2?: string }>()

  const tab = {
    tabs: [Type.SWAP],
    tooltips: [Tooltip.Trade.General],
    current: type,
  }

  // const { getTokenOrDenom } = useFetchTokens(undefined, state)

  // LOOP ust pair
  // const { pair } = whitelist[getToken(LOOP)] ?? {}

  const [token1, setToken1] = useState<EXCHANGE_TOKEN | undefined>({
    token:
      "ibc/EAC38D55372F38F1AFD68DF7FE9EF762DCF69F26520643CF3F9D292A738D8034" ??
      "",
    symbol: "USDC",
  })
  const [token2, setToken2] = useState<EXCHANGE_TOKEN | undefined>({
    token:
      "juno1qsrercqegvs4ye0yqg93knv73ye5dc3prqwd6jcdcuj8ggp6w0us66deup" ?? "",
    symbol: "LOOP",
  })
  const [pool, setPool] = useState<string | undefined>(
    "juno1utkr0ep06rkxgsesq6uryug93daklyd6wneesmtvxjkz0xjlte9qdj2s8q"
  )
  const [pairType, setPairType] = useState<string | undefined>("loop")

  const setTokens = (token1: EXCHANGE_TOKEN, token2?: EXCHANGE_TOKEN) => {
    token1.token
      ? setToken1(check8decOper(token1.token) ? token2 : token1)
      : setToken1({
          token:
            "ibc/EAC38D55372F38F1AFD68DF7FE9EF762DCF69F26520643CF3F9D292A738D8034" ??
            "",
          symbol: "USDC",
        })
    token2?.token
      ? setToken2(check8decOper(token1.token) ? token1 : token2)
      : setToken2({
          token:
            "juno1qsrercqegvs4ye0yqg93knv73ye5dc3prqwd6jcdcuj8ggp6w0us66deup" ??
            "",
          symbol: "LOOP",
        })
  }

  const [simulatedPrice, setSimulatedPrice] = useState<string>("0")
  const [response, setResponse] = useState<DeliverTxResponse | undefined>(
    undefined
  )
  const [error, setError] = useState<PostError>()
  const recordAgg = useRecoilValue(recordAggTx)
  const responseFun = (
    response: DeliverTxResponse | undefined,
    errorResponse?: PostError,
    tx?: { token: string, amount: string,txhash:string}
  ) => {
     recordAgg(tx, '1')
    response ? setResponse(response) : setError(errorResponse)
  }
  const setSimulatedPriceFunc = (price?: string) =>
    setSimulatedPrice(price ?? "0")

  /* reset */
  const reset = () => {
    setResponse(undefined)
    setError(undefined)
    setUpdateTransactions(true)
  }

  /* result */
  const parseTx = useProSwapReceipt(type, simulatedPrice)
  const findTokenDetailFn = useFindTokenDetails(true)
  const token1Symbol = findTokenDetailFn(token1?.token)
  const token2Symbol = findTokenDetailFn(token2?.token)

  const onChangePair = (pair: string, type?: string) => {
    ;[
      "juno1ctsmp54v79x7ea970zejlyws50cj9pkrmw49x46085fn80znjmpqz2n642",
    ].includes(pair)
      ? setPool("")
      : setPool(pair)
    setPairType(type)
  }

  const [changed, setChanged] = useState<boolean>(false)
  const [isSplittedSwap, setIsSplittedSwap] = useState<boolean>(false)
  const splittedSwap = (status: boolean) => setIsSplittedSwap(status)

  
  return (
    <>
      {window.innerWidth < 600 ? (
        <></>
      ) : (
        <>
          {(response || error) && (
            <Container sm>
              <ProResult
              response={response}
              error={error}
              parseTx={parseTx}
              onFailure={reset}
              resetIt={"SWAP AGAIN"}
              asset={
                token1Symbol?.tokenSymbol + "_" + token2Symbol?.tokenSymbol
              }
              isSplittedSwap={isSplittedSwap}
            />
            </Container>
          )}
          {response || error ? null : (
            <ProExchangeForm
              isNewDesign={true}
              smScreen
              type={type ?? Type.SWAP}
              tab={tab}
              key={type}
              setTokens={setTokens}
              responseFun={responseFun}
              setSimulatedPriceFunc={setSimulatedPriceFunc}
              onChangePair={onChangePair}
              formUpdated={formUpdated}
              showResult={false}
              splittedSwap={splittedSwap}
              makeCollapseable={collapseAble}
            />
          )}
        </>
      )}
    </>
  )
}

export default DashboardExchange
