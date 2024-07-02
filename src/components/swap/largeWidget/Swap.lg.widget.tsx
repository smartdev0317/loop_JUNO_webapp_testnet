import { useState } from "react"
import { useRecoilValue } from "recoil"
import { DeliverTxResponse } from "@cosmjs/stargate"

import { Container } from "components"
import Tooltip from "../../../lang/Tooltip.json"
import { LOOP } from "../../../constants"
import { useTokenMethods } from "../../../data/contract/info"
import { useProtocol } from "../../../data/contract/protocol"
import { PostError } from "../../../forms/CustomMsgFormContainer"
import { recordAggTx } from "data/API/dashboard"
import ProExchangeForm from "../../../forms/Exchange/ProExchangeForm"
import ProResult from "forms/ProResult"
import useProSwapReceipt from "forms/receipts/useProSwapReceipt"

export enum Type {
  "SWAP" = "Swap",
  "SELL" = "sell",
}

export interface EXCHANGE_TOKEN {
  token?: string
  symbol?: string
}

const SwapWidgetLarge = ({ poolSwapWidget }: { poolSwapWidget?: boolean }) => {
  const { getToken, whitelist } = useProtocol()
  const { check8decOper } = useTokenMethods()

  const type = Type.SWAP
  //    const {state} = useLocation<{ token1?: string; token2?: string }>()

  const tab = {
    tabs: [Type.SWAP],
    tooltips: [Tooltip.Trade.General],
    current: type,
  }

  //  const { getTokenOrDenom } = useFetchTokens(undefined, state)

  /*if('xfi' in window){
      console.log("wallet detected");
    }*/

  // LOOP ust pair
  const { pair } = whitelist[getToken(LOOP)] ?? {}

  const [token1, setToken1] = useState<EXCHANGE_TOKEN | undefined>({
    token: pair ?? "",
    symbol: "USDC",
  })
  const [token2, setToken2] = useState<EXCHANGE_TOKEN | undefined>({
    token: getToken(LOOP) ?? "",
    symbol: LOOP,
  })
  //  const [pool, setPool] = useState<string | undefined>(
  //    "terra106a00unep7pvwvcck4wylt4fffjhgkf9a0u6eu"
  //  )

  const setTokens = (token1: EXCHANGE_TOKEN, token2?: EXCHANGE_TOKEN) => {
    token1.token
      ? setToken1(check8decOper(token1.token) ? token2 : token1)
      : setToken1({
          token: pair ?? "",
          symbol: "USDC",
        })
    token2?.token
      ? setToken2(check8decOper(token1.token) ? token1 : token2)
      : setToken2({
          token: getToken(LOOP) ?? "",
          symbol: LOOP,
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
    tx?: { token: string; amount: string; txhash: string }
  ) => {
    recordAgg(tx, "1")
    response ? setResponse(response) : setError(errorResponse)
  }

  const setSimulatedPriceFunc = (price?: string) =>
    setSimulatedPrice(price ?? "0")

  /* reset */

  /* result */
  /*const title = {
      name: MenuKey.SWAP.toString(),
      className: undefined
    }*/

  const parseTx = useProSwapReceipt(type, simulatedPrice)

  const reset = () => {
    setResponse(undefined)
    setError(undefined)
  }

  return (
    <div>
      {response || error ? (
        <Container sm>
          <ProResult
            response={response}
            error={error}
            parseTx={parseTx}
            onFailure={reset}
            resetIt={"SWAP AGAIN"}
            asset={token1?.symbol + "_" + token2?.symbol}
            isSplittedSwap={false}
          />
        </Container>
      ) : (
        <ProExchangeForm
          isNewDesign={true}
          smScreen
          type={type}
          tab={tab}
          key={type}
          setTokens={setTokens}
          responseFun={responseFun}
          setSimulatedPriceFunc={setSimulatedPriceFunc}
          poolSwapWidget={poolSwapWidget}
        />
      )}
    </div>
  )
}

export default SwapWidgetLarge
