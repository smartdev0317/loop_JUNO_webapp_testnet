import { formatAsset } from "../../libs/parse"
import { useProtocol } from "../../data/contract/protocol"

import { findPathFromContract, parseTokenText } from "./receiptHelpers"
import { Type } from "../../pages/PoolDynamic"
import { useFindTokenDetails } from "../../data/form/select"
import { div } from "../../libs/math"
import { TxLog } from "../../types/tx"
import {LOOP_SGNL_PAIR, SMALLEST, USDC} from "../../constants"
import {insertIf} from "../../libs/utils";

export default (type: Type, isAutoFarm?: boolean, pair?: string) => (logs: TxLog[]) => {
  const { getSymbol } = useProtocol()
  const val =
    type == "withdraw"
      ? findValueFromLogsForPool(logs, 0)
      : findValueFromLogsForPool(logs, 1)

  const fc = findPathFromContract(logs)
  // const { check8decOper } = useTokenMethods()
  // const tradingData=useRecoilValue(tradingListStore)

  const join = (array: { amount: string; token: string }[]) =>
    array
      .map(({ amount, token }) =>
        formatAsset(amount, getSymbol(token) == "" ? USDC : getSymbol(token))
      )
      .join(" + ")

  const token = val("_contract_address")
  const findTokenDetailFn = useFindTokenDetails()
  const symbol =
    findTokenDetailFn?.(token, "pair")?.tokenName ?? getSymbol(token)
  const deposit = parseTokenText(val("assets", 2))
  const received = val("share", 2)
  const refund = parseTokenText(val("refund_assets"))
  const withdrawn = val("withdrawn_share")
  // const withdrawnToken = fc("transfer")("contract_address")
  // const withdrawnSymbol = getSymbol(withdrawnToken)
  const depositValues = {
    value1: deposit[0]?.amount,
    value2: deposit[1]?.amount,
    token1: getSymbol(deposit[0]?.token),
    token2:
      getSymbol(deposit[1]?.token) === "" ? USDC : getSymbol(deposit[1]?.token),
  }

  // const APY=tradingData.find(item=>item.firstToken===deposit[0]?.token && item.secondToken===deposit[1]?.token)?.APY
  /* contents */

  return {
    [Type.PROVIDE]: [
        ...insertIf(pair !== LOOP_SGNL_PAIR, {
              title: "Receive",
              content: formatAsset(received, `${symbol} LP`),
              value: div(received, SMALLEST),
              pair: `${deposit.map(({ amount, token }) => token).join(" - ")} LP`,
              // apy:APY,
            },
            {
              title: "Deposited",
              content: join(deposit),
              value1: div(depositValues?.value1, SMALLEST),
              value2: div(depositValues?.value2, SMALLEST),
              token1: getSymbol(deposit[0]?.token),
              token2: getSymbol(deposit[1]?.token),
            },)
      // {
      //   value:div(received,SMALLEST),
      //   content:`${deposit.map(({amount,token})=>formatAsset(amount,getSymbol(token))).join(" - ")} LP`,
      // }
    ],
    [Type.WITHDRAW]: [
      {
        title: "Refund",
        content: join(refund),
      },
      {
        title: "Withdrawn",
        content: formatAsset(withdrawn, 'LP'),
      },
    ],
  }[type]
}

export const findValueFromLogsForPool =
  (logs: any[], eventIndex: number) =>
  (key: string, index = 0) => {
    const attribute = logs[eventIndex]?.events.find((e) => e.type === "wasm")?.attributes

    return attribute?.find((attr) => attr.key === key)?.value ?? ""
  }
