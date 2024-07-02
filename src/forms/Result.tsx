import { useEffect } from "react"
import { useSetRecoilState } from "recoil"

import WaitNewDesign from "components/WaitNewDesign"
import Wait, { STATUS } from "components/Wait"
import MESSAGE from "lang/MESSAGE.json"
import { getPath, MenuKey } from "../routes"
import TxInfo from "./TxInfo"
import { PostError } from "./FormContainer"
import { priceKeyIndexState } from "data/app"
import TxInfoNewDesign from "./TxInfoNewDesign"
import NEW_PORTFOLIO_ICON from "images/new_porfolio_icon.svg"

declare const window: any

interface Props {
  response?: any
  parseTx: any
  gov?: boolean
  onFailure: (type?: string) => void
  error?: PostError
  resetIt?: string
  asset?: string
  type?: any
  formUpdated?: any
  newDesign?: boolean
  showAddTokenBtn?: boolean
}

const Result = ({
  response,
  error,
  parseTx,
  gov,
  onFailure,
  resetIt,
  asset,
  type,
  formUpdated,
  showAddTokenBtn,
  newDesign,
  ...props
}: Props) => {
  const success = !error

  // const hash = response?.transactionHash ?? ""
  const raw_log = response?.rawLog ?? ""

  useEffect(() => {
    if (formUpdated) {
      formUpdated(success)
    }
  }, [])


  /* polling */
  // const [refetchInterval, setRefetchInterval] = useState<number | false>(false)
  // const getTxInfos = useRecoilValue(getTxInfosQuery)
  // const [loading, setIsLoading] = useState(false)

  // const { data: txInfo } = tx

  /* status */
  // const status =
  //   tx?.status === "loading"
  //     ? STATUS.LOADING
  //     : tx?.status === "error"
  //     ? STATUS.FAILURE
  //     : STATUS.SUCCESS

  const status=
     !response
      ? STATUS.FAILURE
      : STATUS.SUCCESS

  // useEffect(() => {
  //   success && hash && setRefetchInterval(TX_POLLING_INTERVAL)
  // }, [success, hash])

  const serPriceKeyIndexStateState = useSetRecoilState(priceKeyIndexState)

  useEffect(() => {
    if (response) {
      serPriceKeyIndexStateState((n) => n + 1)
    }
  }, [status, serPriceKeyIndexStateState])

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

  /* render */
  const message =
    response?.rawLog ||
    raw_log ||
    error?.message || MESSAGE.Result.DENIED

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
        <TxInfo asset={asset} txInfo={response} parser={parseTx} type={type} showAddTokenBtn={showAddTokenBtn} />
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
                  <img src={NEW_PORTFOLIO_ICON} alt={""} />
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
  // return <></>
}

export default Result
