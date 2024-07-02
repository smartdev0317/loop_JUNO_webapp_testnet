import { useEffect, useState } from "react"
import { ReactNode, HTMLAttributes, FormEvent } from "react"
import classNames from "classnames"
import { DeliverTxResponse, GasPrice, StdFee } from "@cosmjs/stargate"
import { useRecoilValue } from "recoil"
import { MsgExecuteContractEncodeObject, SigningCosmWasmClient} from "@cosmjs/cosmwasm-stargate"

import MESSAGE from "../lang/MESSAGE.json"
import {SMALLEST} from "../constants"
import {div, gt, sum} from "../libs/math"
import useHash from "../libs/useHash"
import useTax from "../graphql/useTax"
import useFee from "../graphql/useFee"
import Container from "../components/Container"
import Tab from "../components/Tab"
import Card from "../components/Card"
import Confirm from "../components/Confirm"
import FormFeedback from "../components/FormFeedback"
import Button from "../components/Button"
import useAddress from "../hooks/useAddress"
import { CustomActions } from "./LoopStakeForm"
import styles from "./FormContainer.module.scss"
import { useWallet, useWalletManager } from "@noahsaso/cosmodal";
import {useFindBalance} from "../data/contract/normalize"
import { unsafelyGetDefaultExecuteFee } from "../utils/fees"
import { junoRPCURL, nativeDenom } from "../data/contract/juno_queries"
import { useProtocol } from "../data/contract/protocol"
import {lookupSymbol} from "../libs/parse"
import {DEFAULT_FEE_NUM} from '../constants'

interface Props {
  data: MsgExecuteContractEncodeObject[]
  memo?: string
  gasAdjust?: number

  /** Form information */
  contents?: Content[]
  /** uusd amount for tax calculation */
  pretax?: string
  /** Exclude tax from the contract */
  deduct?: boolean
  /** Form feedback */
  messages?: ReactNode[]

  /** Submit disabled */
  disabled?: boolean
  /** Submit label */
  label?: string

  /** Render tab */
  tab?: Tab
  /** Form event */
  attrs?: HTMLAttributes<HTMLFormElement>

  /** Parser for results */
  parseTx?: ResultParser
  /** Gov tx */
  gov?: boolean
  closeModal?: () => void
  children?: ReactNode
  partial?: boolean
  farmResponseFun?: (
    res: DeliverTxResponse | undefined,
    err?: PostError | undefined,
    types?:string | undefined,
    transactionStatus?:boolean | undefined
  ) => void
  customActions?: (data: CustomActions) => ReactNode
  afterSubmitChilds?: ReactNode
  extResponse?: DeliverTxResponse
  className?: string
  verifyUstBalance?: boolean
  tabLabels?: { [index: string]: string }
  postSubmitFn?: () => void
  formSubmited?: boolean
  resetFunc?: (type?: string) => void
  msgInfo?: { max: string; value: string; symbol: string }
  setLoading?: (loading: boolean) => void
  closeModalStake?: () => void
}
export type PostError = any

export const MiniFormContainer = ({
  data: msgs,
  className,
  gasAdjust = 1,
  memo,
  customActions,
  extResponse,
  farmResponseFun,
  setLoading,
  closeModal,
                                    postSubmitFn,
  tabLabels,
                                    resetFunc,
                                    msgInfo,
                                verifyUstBalance = true,
                                formSubmited = false,
                                    closeModalStake,
  ...props
}: Props) => {
  const { contents, messages, label, tab, children } = props
  const {
    attrs,
    pretax,
    deduct,
    parseTx = () => [],
    gov,
    afterSubmitChilds,
  } = props

  /* context */
  const { hash } = useHash()
  // const { agreementState } = useSettings()

  const findBalanceFn = useFindBalance()
  const uusd = findBalanceFn(nativeDenom) ?? "0"
  const address = useAddress()
  const defaultExecuteFee = unsafelyGetDefaultExecuteFee()

  /* tax */
  const fee = useFee(msgs?.length, gasAdjust)

  const { calcTax, loading: loadingTax } = useTax()
  const tax = pretax ? calcTax(pretax) : "0"
  const uusdAmount = !deduct
    ? sum([pretax ?? "0", tax, fee.amount])
    : fee.amount

    const { ibcList } = useProtocol()
    const sym = msgInfo?.symbol
      ? ibcList[msgInfo.symbol]
        ? ibcList[msgInfo.symbol]?.symbol
        : lookupSymbol(msgInfo.symbol)
      : "balance"
  
    const invalid =
      address &&
      msgInfo &&
      gt(msgInfo.value, div(msgInfo.max, SMALLEST)) &&
      !gt(uusd, uusdAmount)
        ? [`Not enough ${sym}`]
        : undefined

  /* confirm */
  /*const [confirming, setConfirming] = useState(false)
  const confirm = () => (hasAgreed ? submit() : setConfirming(true))
  const cancel = () => setConfirming(false)*/

  /* submit */
  const [submitted, setSubmitted] = useState(false)
  const [response, setResponse] = useState<DeliverTxResponse | undefined>()
  const [error, setError] = useState<PostError>()
  const {connectedWallet}=useWalletManager()


  const disabled =
    loadingTax || props.disabled || invalid || submitted || !msgs?.length

    const RPC = useRecoilValue(junoRPCURL)
  const submit = async () => {
    setSubmitted(true)
    farmResponseFun?.(undefined, undefined,undefined,true)
    setLoading?.(true)
    try {
      const fee: StdFee = {
        amount: defaultExecuteFee.amount,
          gas: (Number(defaultExecuteFee.gas) * DEFAULT_FEE_NUM).toString(),
      }

      let result: DeliverTxResponse
      if (typeof window['obiSignAndBroadcast'] === 'function') {
        // This is an obi Wallet
        result = await window['obiSignAndBroadcast'](address, [...msgs])
      } else {
        let wasmChainClient = await SigningCosmWasmClient.connectWithSigner(
            RPC,
            connectedWallet.offlineSigner,
            {
              gasPrice: GasPrice.fromString("0.0025" + nativeDenom),
            }
            )
        result = await wasmChainClient.signAndBroadcast(
            address,
            [...msgs],
            "auto"
        )
      }
      closeModal?.()
      postSubmitFn?.()
      !farmResponseFun && setResponse(result)
      farmResponseFun?.(result, undefined,undefined,false)
      setSubmitted(false)
      setLoading?.(false)
      closeModalStake?.()
    } catch (error) {
      closeModal?.()
      farmResponseFun?.(undefined, error,undefined,false)
      !farmResponseFun && setError(error)
      setSubmitted(true)
      setLoading?.(false)
    }
  }

  const [externalResponse, setExternalResponse] = useState<DeliverTxResponse>()

  useEffect(() => {
    extResponse && setExternalResponse(extResponse)
  }, [extResponse])

  /* reset */
  const reset = (type: string = 'done') => {
    resetFunc?.(type)
    setSubmitted(false)
    setResponse(undefined)
    setError(undefined)
    setExternalResponse(undefined)
  }

  /* event */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    !disabled && submit()
  }

  useEffect(()=>{
    if(formSubmited && !submitted){
      submit()
    }
  },[formSubmited])

  /* render */
  const render = (children: ReactNode | ((button: ReactNode) => ReactNode)) => {
    const next = address
      ? {
          onClick: handleSubmit,
          children: label ?? hash ?? "Submit",
          loading: submitted,
          disabled,
        }
      : {
          onClick: undefined,
          children: MESSAGE.Form.Button.ConnectWallet,
        }

   /* const txFee = (
      <Count symbol={UST} dp={6}>
        {plus(tax, fee.amount)}
      </Count>
    )*/

    const form = (
      <>
        {children}

        {contents && contents.length > 0 && (
          <Confirm
            list={[
              ...contents
            ]}
          />
        )}

        {(invalid ?? messages)?.map((message, index) => (
          <FormFeedback key={index}>{message}</FormFeedback>
        ))}

        {customActions ? (
          customActions(next)
        ) : (
          <Button {...next} type="button" size="lg" submit />
        )}
        {afterSubmitChilds && afterSubmitChilds}
      </>
    )

    return tab ? (
      <Tab {...tab} tabLabels={tabLabels}>
        {form}
      </Tab>
    ) : (
      <Card lg className={classNames(styles.card, styles.cardMini)} mainSectionClass={styles.cardMini}>
        {form}
      </Card>
    )
  }
  return (
    <Container sm className={className}>
      {/* {response || error ? (
        <Result
          response={response}
          error={error}
          parseTx={parseTx}
          onFailure={reset}
          gov={gov}
        />
      ) : externalResponse || error ? (
        <Result
          response={externalResponse}
          error={error}
          parseTx={parseTx}
          onFailure={reset}
        />
      ) : ( */}
        <form
          {...attrs}
          onSubmit={handleSubmit}
          className={tab?.current === "Airdrop" ? styles.airdropBox : ""}
        >
          {
            // !confirming ? (
            //   render(children)
            // ) : (
            //   <Caution goBack={cancel} onAgree={submit} />
            // )
            render(children)
          }
        </form>
      {/* )} */}
    </Container>
  )
}

export default MiniFormContainer
