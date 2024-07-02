import { useEffect } from "react"

import MESSAGE from "../lang/MESSAGE.json"
import { getPath, MenuKey } from "../routes"
import Wait, { STATUS } from "../components/Wait"
import { PostError } from "./FormContainer"
import TxInfoNewDesign from "./TxInfoNewDesign"
import WaitNewDesign from "../components/WaitNewDesign"
import NEW_PORTFOLIO_ICON from "../images/new_porfolio_icon.svg"
import { DeliverTxResponse } from "@cosmjs/stargate"
import ProTxInfo from "./ProTxInfo";
import {useSetRecoilState} from "recoil";
import {priceKeyIndexState} from "../data/app";

interface Props {
  response?: DeliverTxResponse
  parseTx: any
  gov?: boolean
  onFailure: (type?: string) => void
  error?: PostError
  resetIt?: string
  asset?: string
  type?: any
  formUpdated?: any
  newDesign?: boolean
  isSplittedSwap?: boolean
  tokens?: string
}

const ProResult = ({
                  response,
                  error,
                  parseTx,
                  gov,
                  onFailure,
                  resetIt,
                  asset,
                  type,
                  formUpdated,
                  newDesign,
                  isSplittedSwap,
    tokens,
                  ...props
                }: Props) => {
  const success = !error

  const raw_log = response?.rawLog ?? ""

  useEffect(() => {
    if (formUpdated) {
      formUpdated(success)
    }
  }, [])

  const status=
      !response
          ? STATUS.FAILURE
          : response.code === 0 ? STATUS.SUCCESS : STATUS.FAILURE

  /* verbose */
  const verbose = response ? JSON.stringify(response, null, 2) : undefined
  useEffect(() => {
    const log = () => {
      console.groupCollapsed("Logs")
      console.info(verbose)
      console.groupEnd()
    }

    verbose && log()
  }, [verbose])

    const serPriceKeyIndexStateState = useSetRecoilState(priceKeyIndexState)

    useEffect(() => {
        if (response) {
            serPriceKeyIndexStateState((n) => n + 1)
        }
    }, [status, serPriceKeyIndexStateState])

  /* render */
  const message =
      response?.rawLog ||
      raw_log ||
      error?.message

  const content = {
    [STATUS.SUCCESS]:
    response &&
    (newDesign ? (
        <TxInfoNewDesign
            asset={asset}
            txInfo={response}
            parser={parseTx}
            type={type}
        />
    ) : (
        <ProTxInfo
            asset={asset}
            txInfo={response}
            parser={parseTx}
            type={type}
            isSplittedSwap={isSplittedSwap}
            tokens={tokens}
        />
    )),
    [STATUS.LOADING]: "Please wait while your request is being processed",
    [STATUS.FAILURE]: message,
  }[status]


  const wait = {
    status,
    // receipt,
    link:
        status === STATUS.SUCCESS
            ? {
              to: getPath(!gov ? MenuKey.MY : MenuKey.GOV),
              children: newDesign ? (
                  !gov ? (
                      <>
                        <img src={NEW_PORTFOLIO_ICON} alt={"NEW_PORTFOLIO_ICON"} />
                        {MenuKey.MY}
                      </>
                  ) : (
                      MenuKey.GOV
                  )
              ) : !gov ? (
                  MenuKey.MY
              ) : (
                  MenuKey.GOV
              ),
            }
            : undefined,
    resetIt:
        status === STATUS.SUCCESS
            ? {
              onClick: () => onFailure("done"),
              children: resetIt ? resetIt : newDesign ? "Close" : "Done",
            }
            : undefined,
    button:
        status === STATUS.FAILURE
            ? {
              onClick: () => onFailure("reset"),
              children: MESSAGE.Result.Button.FAILURE,
            }
            : undefined,
  }

  return newDesign ? (
      <WaitNewDesign {...wait}>{content}</WaitNewDesign>
  ) : (
      <Wait {...wait}>{content}</Wait>
  )
}

export default ProResult