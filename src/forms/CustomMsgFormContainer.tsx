import {useEffect, useState} from "react"
import {ReactNode, HTMLAttributes, FormEvent} from "react"
import {DeliverTxResponse, GasPrice} from "@cosmjs/stargate"
import {MsgExecuteContractEncodeObject, SigningCosmWasmClient} from "@cosmjs/cosmwasm-stargate"

import MESSAGE from "../lang/MESSAGE.json"
import Tooltip from "../lang/Tooltip.json"
import {SMALLEST} from "../constants"
import {div, gt, plus, sum} from "../libs/math"
import useHash from "../libs/useHash"
import useTax from "../graphql/useTax"
import Container from "../components/Container"
import Tab from "../components/Tab"
import Card from "../components/Card"
import Confirm from "../components/Confirm"
import FormFeedback from "../components/FormFeedback"
import Button from "../components/Button"
import Count from "../components/Count"
import {TooltipIcon, Tooltip as Tooltips} from "../components/Tooltip"
import useAddress from "../hooks/useAddress"
import ConnectListModal from "../layouts/ConnectListModal"
import {useModal} from "../containers/Modal"
import styles from "./FormContainer.module.scss"
import UstNotEnough from "../components/Static/UstNotEnough"
import {useFindBalance, useLoopPrice} from "../data/contract/normalize"
import {TitleHeader} from "../types/Types"
import {useProtocol} from "../data/contract/protocol"
import {StdFee} from "@cosmjs/amino"
import {useRecoilValue} from "recoil"
import {unsafelyGetDefaultExecuteFee} from "../utils/fees"

import {junoRPCURL, nativeDenom} from "../data/contract/juno_queries"
import CHECKED_ICON from "../images/checked.svg"
import {useWallet, useWalletManager} from "@noahsaso/cosmodal"
import {DEFAULT_FEE_NUM} from '../constants'
import { lookupSymbol } from "../libs/parse"

export type PostError = any

interface Props {
    data: MsgExecuteContractEncodeObject[]
    memo?: string
    gasAdjust?: number
    asset?: string
    showForm?: boolean
    webApp?: boolean

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
    label?: ReactNode

    /** Render tab */
    tab?: Tab
    /** Form event */
    attrs?: HTMLAttributes<HTMLFormElement>

    /** Parser for results */
    parseTx?: ResultParser
    /** Gov tx */
    gov?: boolean

    children?: ReactNode
    partial?: boolean
    msgInfo?: { max: string; value: string; symbol: string }
    farmResponseFun?: (
        res: DeliverTxResponse | undefined,
        errors: PostError | undefined,
        type?: string
    ) => void
    responseFun?: (
        res: DeliverTxResponse | undefined,
        errorRes?: PostError | undefined
    ) => void
    afterSubmitChilds?: ReactNode
    slippage?: ReactNode
    title?: TitleHeader
    sm?: boolean
    showSubmitBtn?: boolean
    icon?: string | ReactNode
    customActions?: (data: any) => ReactNode
    makeCollapseable?: boolean
    HeaderForm?: ReactNode | any
    hideContent?: boolean
    headerBorder?: boolean
    mainSectionClass?: string
    showCheckbox?: boolean
    isAutoFarm?: boolean
    setIsAutoFarm?: (isAutoFarm: boolean) => void
    resetFunc?: (type?: string) => void
    showResult?: boolean
    allowAutoFarm?: boolean
    showHeaderTabs?: boolean
    formSubmited?: boolean
    isNewDesign?: boolean
}

export const FormContainer = ({
                                  data: msgs,
                                  memo,
                                  gasAdjust = 1,
                                  farmResponseFun,
                                  responseFun,
                                  sm = true,
                                  showSubmitBtn = true,
                                  asset,
                                  showForm,
                                  webApp,
                                  customActions,
                                  mainSectionClass,
                                  makeCollapseable = false,
                                  HeaderForm,
                                  headerBorder = false,
                                  showCheckbox = false,
                                  allowAutoFarm = true,
                                  isNewDesign = false,
                                  formSubmited,
                                  isAutoFarm,
                                  showHeaderTabs,
                                  showResult,
                                  setIsAutoFarm,
                                  resetFunc,
                                  ...props
                              }: Props) => {
    const {
        contents,
        hideContent = false,
        messages,
        label,
        tab,
        children,
        slippage,
        title,
    } = props
    const {
        attrs,
        pretax,
        deduct,
        parseTx = () => [],
        gov,
        msgInfo,
        afterSubmitChilds,
        icon,
    } = props

    /* context */
    const {hash} = useHash()
    const [error, setError] = useState<PostError>()
    const defaultExecuteFee = unsafelyGetDefaultExecuteFee()
    const address = useAddress()
    const modal = useModal()
    const {connect, connectedWallet} = useWalletManager()


    /* tax */
    // const fee = useFee(msgs?.length, gasAdjust)
    const fee = {amount: "2"}
    // const { post } = useWallet()
    const findBalanceFn = useFindBalance()
    // const { terra } = useLCDClient()
    const uusd = findBalanceFn(nativeDenom) ?? "0"

    const {calcTax, loading: loadingTax} = useTax()
    const tax = pretax ? calcTax(pretax) : "0"
    const uusdAmount = !deduct
        ? sum([pretax ?? "0", tax, fee.amount])
        : fee.amount

    const {ibcList} = useProtocol()
    const sym = msgInfo?.symbol
        ? ibcList[msgInfo.symbol]
            ? ibcList[msgInfo.symbol]?.symbol
            : lookupSymbol?.(msgInfo.symbol)
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
    const disabled =
        loadingTax || props.disabled || invalid || submitted || !msgs?.length

    const RPC = useRecoilValue(junoRPCURL)

    const submit = async () => {
        setSubmitted(true)

        try {
            // const { gasPrice } = fee

            // const txOptions: {
            //   msgs: MsgExecuteContractEncodeObject[]
            //   gasPrices: string
            //   purgeQueue: boolean
            //   memo: string | undefined
            //   fee?: Fee
            // } = {
            //   msgs,
            //   memo,
            //   // gasPrices: `${gasPrice}uusd`,
            //   // fee: new Fee(gas, { uusd: plus(amount, !deduct ? tax : undefined) }),
            //   purgeQueue: true,
            // }

            // const signMsg = await terra.tx.create([{ address: address }], txOptions)

            // txOptions.fee = signMsg.auth_info.fee

            // const wallet = await Secp256k1HdWallet.generate();
            // const [{ address }] = await wallet.getAccounts();

            // // Ensure the address has some tokens to spend

            // const lcdApi = "https://…";
            // const client = new SigningCosmosClient(lcdApi, address, wallet);


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
            // const response = await post(txOptions)
            !responseFun && setResponse(result)
            responseFun?.(result, undefined)
            farmResponseFun?.(result, undefined, "farm_stake")
            setSubmitted(false)
        } catch (error) {
            farmResponseFun?.(undefined, error, "farm_stake")
            responseFun?.(undefined, error)
            setError(error)
            setSubmitted(false)
        }
    }

    /* reset */
    const reset = (type: string = "done") => {
        setSubmitted(false)
        setResponse(undefined)
        setError(undefined)
        resetFunc?.(type)
    }

    /* event */
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        !disabled && submit()
    }

    useEffect(() => {
        if (formSubmited && !submitted) {
            submit()
        }
    }, [formSubmited])

    /* render */
    const render = (children: ReactNode | ((button: ReactNode) => ReactNode)) => {
        const next = address
            ? {
                onClick: handleSubmit,
                children: label ?? hash ?? "Submit",
                loading: submitted,
                disabled,
                className: styles.submitBtn
            }
            : {
                onClick: connect,
                children: MESSAGE.Form.Button.ConnectWallet,
            }

        const txFee = (
            <Count symbol={'JUNO'} dp={6}>
                {plus(!deduct ? tax : 0, fee.amount)}
            </Count>
        )

        const form = (
            <>
                {children}

                {!hideContent && !webApp &&
                    gt(uusd, div(plus(!deduct ? tax : 0, fee.amount), SMALLEST)) &&
                    contents && (
                        <Confirm
                            list={[
                                ...contents,
                                {
                                    title: (
                                        <TooltipIcon content={Tooltip.Forms.TxFee}>
                                            Gas Fee
                                        </TooltipIcon>
                                    ),
                                    content: (
                                        <span className={styles.fee}>
                      <span className={styles.approx}>&#8776;</span> {txFee}
                    </span>
                                    ),
                                },
                            ]}
                        />
                    )}

                {gt(uusd, div(plus(!deduct ? tax : 0, fee.amount), SMALLEST)) &&
                    (invalid ?? messages)?.map((message, index) => (
                        <FormFeedback className={styles.formFeedback} key={index}>{message}</FormFeedback>
                    ))}
                {!gt(uusd, div(plus(!deduct ? tax : 0, fee.amount), SMALLEST)) && (
                    <UstNotEnough uusdAmount={txFee}/>
                )}

                {customActions
                    ? customActions(next)
                    : showSubmitBtn && (
                    <Button webApp={webApp} {...next} className={styles.submitted} icon={icon} type="button" size="lg"
                            submit/>
                )}
                {afterSubmitChilds && afterSubmitChilds}
                {showCheckbox && !disabled && (
                    <div
                        className={styles.checkbox}
                        onClick={allowAutoFarm ? () => setIsAutoFarm(!isAutoFarm) : () => {
                        }}
                    >
                        <Tooltips
                            content={allowAutoFarm ? "" : "This pool is not on V3 yet, check back over the next few weeks."}>
                            <div className={styles.box}>
                                {isAutoFarm && <img src={CHECKED_ICON} alt={"CHECKED_ICON"}/>}
                            </div>
                            <label>Auto Farm for higher APY</label>
                        </Tooltips>
                    </div>
                )}
            </>
        )

        return tab ? (
            <Tab {...tab}>{form}</Tab>
        ) : (
            <>
                <Card
                    hasForm
                    header={title?.name ?? ""}
                    slippage={slippage}
                    headerClass={title?.className ?? ""}
                    lg
                    className={styles.card}
                    showForm={showForm}
                    HeaderForm={HeaderForm}
                    makeCollapseable={makeCollapseable}
                    headerBorder={headerBorder}
                    mainSectionClass={mainSectionClass}
                    showHeaderTabs={showHeaderTabs}
                    webApp={webApp}
                >
                    {form}
                </Card>
                {webApp && (
                    <>
                        {slippage}
                        <div className={styles.divider}/>
                        {!hideContent &&
                            gt(uusd, div(plus(!deduct ? tax : 0, fee.amount), SMALLEST)) &&
                            contents && (
                                <Confirm
                                    webApp
                                    list={[
                                        ...contents,
                                        {
                                            title: (
                                                <TooltipIcon content={Tooltip.Forms.TxFee}>
                                                    Gas Fee
                                                </TooltipIcon>
                                            ),
                                            content: (
                                                <span className={styles.fee}>
                      <span className={styles.approx}>&#8776;</span> {txFee}
                    </span>
                                            ),
                                        },
                                    ]}
                                />
                            )}
                    </>
                )}
            </>
        )
    }

    return (
        <Container sm={sm}>
            {/* {(response || error) ?
      (
        <Result
          asset={asset}
          response={response}
          error={error}
          parseTx={parseTx}
          onFailure={reset}
          gov={gov}
        />
      ) : ( */}
            <form {...attrs} onSubmit={handleSubmit}>
                {render(children)}
            </form>
            {/* )} */}
            {!address && <ConnectListModal {...modal} />}
        </Container>
    )
}

export default FormContainer