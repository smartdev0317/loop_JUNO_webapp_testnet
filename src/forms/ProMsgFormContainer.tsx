import React, { useState } from "react"
import classNames from "classnames"
import { ChainInfoID, useWallet, useWalletManager } from "@noahsaso/cosmodal"
import { ReactNode, HTMLAttributes, FormEvent } from "react"
import { StdFee } from "@cosmjs/amino"
import { useRecoilValue } from "recoil"
import { DeliverTxResponse, GasPrice } from "@cosmjs/stargate"
import {
  MsgExecuteContractEncodeObject,
  SigningCosmWasmClient,
} from "@cosmjs/cosmwasm-stargate"

import {
  TooltipIcon,
  Count,
  Button,
  FormFeedback,
  Confirm,
  Card,
  Tab,
  Container,
  Icon,
} from "components"
import MESSAGE from "../lang/MESSAGE.json"
import { SMALLEST } from "../constants"
import { div, gt, plus, sum } from "../libs/math"
import useHash from "../libs/useHash"
import useTax from "../graphql/useTax"
import useAddress from "../hooks/useAddress"
import styles from "./FormContainer.module.scss"
import UstNotEnough from "components/Static/UstNotEnough"
import { useFindBalance } from "../data/contract/normalize"
import { TitleHeader } from "../types/Types"
import { lookupSymbol, decimal } from "../libs/parse"
import { useProtocol } from "../data/contract/protocol"
import { unsafelyGetDefaultExecuteFee } from "../utils/fees"
import { junoRPCURL, nativeDenom } from "../data/contract/juno_queries"
import { useFindTokenDetails } from "../data/form/select"
import "react-spinning-wheel/dist/style.css"
import { DEFAULT_FEE_NUM } from "../constants"
import junoSwapImg from "images/icons/junoswap.svg"
import { TooltipLgIcon } from "../components/Tooltip"
export type PostError = any
interface Props {
  data: MsgExecuteContractEncodeObject[]
  memo?: string
  gasAdjust?: number
  asset?: string
  showForm?: boolean

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
  msgInfo?: { max: string; value: string; symbol: string; decimals?: number }
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
  route?: Array<{
    path: string
    steps: number
    portionOfTotal: number
    price: number
    path1: { dex: number; from: string; to: string; poolAddress: string }
    path2?: { dex: number; from: string; to: string; poolAddress: string }
    path3?: { dex: number; from: string; to: string; poolAddress: string }
  }>
  dexsPrice?: {
    terra: number
    astroport: number
    aggregator: number
    startAmount: number
  }
  showLoading?: boolean
  webApp?: boolean
  askAmount?: { token: string; amount: string }
  poolSwapWidget?: boolean
}

export const ProMsgFormContainer = ({
  data: msgs,
  memo,
  gasAdjust = 1,
  farmResponseFun,
  responseFun,
  sm = true,
  showSubmitBtn = true,
  asset,
  showForm,
  customActions,
  mainSectionClass,
  makeCollapseable = false,
  HeaderForm,
  headerBorder = false,
  showCheckbox = false,
  poolSwapWidget,
  allowAutoFarm = true,
  isAutoFarm,
  showHeaderTabs,
  showResult,
  setIsAutoFarm,
  resetFunc,
  route: swapRoutes = null,
  askAmount,
  dexsPrice,
  showLoading,
  webApp,
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
  const { hash } = useHash()
  const [error, setError] = useState<PostError>()
  const { connect, connectedWallet } = useWalletManager()
  const defaultExecuteFee = unsafelyGetDefaultExecuteFee()
  const address = useAddress()
  // const modal = useModal()
  /* tax */
  // const fee = useFee(msgs?.length, gasAdjust)
  const fee = { amount: "2" }
  const findBalanceFn = useFindBalance()
  const uusd = findBalanceFn(nativeDenom) ?? "0"

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
    gt(
      msgInfo.value,
      div(msgInfo.max, msgInfo.decimals ? 10 ** msgInfo.decimals : SMALLEST)
    ) &&
    !gt(uusd, uusdAmount)
      ? [`Not enough ${sym}`]
      : undefined

  /* submit */
  const [submitted, setSubmitted] = useState(false)
  const [response, setResponse] = useState<DeliverTxResponse | undefined>()
  const disabled =
    loadingTax || props.disabled || invalid || submitted || !msgs?.length

  const RPC = useRecoilValue(junoRPCURL)

  const submit = async () => {
    setSubmitted(true)
    try {
      const fee: StdFee = {
        amount: defaultExecuteFee.amount,
        gas: (Number(defaultExecuteFee.gas) * DEFAULT_FEE_NUM).toString(),
      }

      let result: DeliverTxResponse
      if (typeof window["obiSignAndBroadcast"] === "function") {
        // This is an obi Wallet
        result = await window["obiSignAndBroadcast"](address, [...msgs])
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
      console.log("error", error)
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

  const findTokenDetailFn = useFindTokenDetails(true)

  const symbolFromAddress = (address?: string) => {
    return address
      ? lookupSymbol(findTokenDetailFn(address)?.tokenSymbol ?? "??? ")
      : ""
  }

  const dexName = (dex: number) => {
    if (dex === 0) {
      return "JUNO"
    } else if (dex === 1) {
      return "LOOP"
    } else if (dex === 2) {
      return "WYND"
    } else {
      return "DEX NOT FOUND"
    }
  }

  /* render */
  const render = (children: ReactNode | ((button: ReactNode) => ReactNode)) => {
    const next = address
      ? {
          onClick: handleSubmit,
          children: label ?? hash ?? "Submit",
          loading: submitted,
          className: classNames(
            styles.submit,
            makeCollapseable ? styles.submitted : ""
          ),
          disabled,
        }
      : {
          onClick: connect,
          className: label === "SWAP" ? styles.connectSwapBtn : "",
          children: MESSAGE.Form.Button.ConnectWallet,
        }

    const txFee = (
      <Count symbol={nativeDenom} dp={6}>
        {plus(!deduct ? tax : 0, fee.amount)}
      </Count>
    )
    // let totalPrice = 0;
    // route.length > 0? route.forEach((item) => {totalPrice += item.price}) : null
    const form = (
      <div className={poolSwapWidget ? styles.poolSwap : ""}>
        <div className={poolSwapWidget ? styles.form : ""}>
          {children}
          {customActions
            ? customActions(next)
            : showSubmitBtn && (
                <Button
                  webApp={webApp}
                  {...next}
                  icon={icon}
                  type="button"
                  size="lg"
                  submit
                />
              )}
        </div>
        <div className={poolSwapWidget ? styles.impact : ""}>
          {poolSwapWidget && slippage}
          {!(swapRoutes === null) && (
            <TooltipLgIcon
              className={styles.bestRouteTooltip}
              iconClassName={styles.aquaColor}
              placement="bottom"
              arrow={false}
              content={
                <React.Fragment>
                  <div className={styles.bestRoute}>
                    {/*
                                    (dexsPrice.terra && dexsPrice.aggregator > dexsPrice.terra) &&
                                    <div className={styles.badge}>
                                    Best route : save {Math.round(dexsPrice.terra > dexsPrice.astroport ? 100 * 100 * (dexsPrice.aggregator / dexsPrice.terra - 1) : 100 * 100 * (dexsPrice.aggregator / dexsPrice.astroport - 1)) / 100} % { }
                                    </div>
                                    */}

                    <div className={styles.convertedRate}>
                      <h3>{symbolFromAddress(swapRoutes?.[0]?.path1?.from)}</h3>
                      <img src="../log-loop.png" alt="" />
                    </div>
                    {swapRoutes?.map((routeItem) => {
                      return (
                        <div className={styles.routes}>
                          <h6>
                            {routeItem?.portionOfTotal
                              ? Math.trunc(routeItem?.portionOfTotal * 100) +
                                "%"
                              : null}
                          </h6>
                          <Icon name="arrow_forward_ios" size={12} />
                          <div className={styles.route}>
                            <div className={styles.coins}>
                              <div className={styles.path}>
                                <span style={{ marginRight: 3 }}>
                                  {symbolFromAddress(routeItem?.path1.from)}
                                </span>
                                <div className={styles.dex}>
                                  <Icon name="arrow_forward_ios" size={10} />
                                  <span className={styles.dexName}>
                                    {dexName(routeItem?.path1.dex)}
                                  </span>
                                </div>
                                <span style={{ marginLeft: 3 }}>
                                  {symbolFromAddress(routeItem?.path1.to)}
                                </span>
                                {routeItem?.steps > 1 && [
                                  <div className={styles.dex}>
                                    <Icon name="arrow_forward_ios" size={10} />
                                    <span className={styles.dexName}>
                                      {dexName(routeItem?.path2.dex)}
                                    </span>
                                  </div>,
                                  <span style={{ marginLeft: 3 }}>
                                    {symbolFromAddress(routeItem?.path2.to)}
                                  </span>,
                                ]}
                                {routeItem?.steps > 2 && [
                                  <div className={styles.dex}>
                                    <Icon name="arrow_forward_ios" size={10} />
                                    <span className={styles.dexName}>
                                      {dexName(routeItem?.path3.dex)}
                                    </span>
                                  </div>,
                                  <span style={{ marginLeft: 3 }}>
                                    {symbolFromAddress(routeItem?.path3.to)}
                                  </span>,
                                ]}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* {route?.[0] &&
                                                <div className={styles.routes}>
                                                    <h6>{route?.[0]?.portionOfTotal ? Math.trunc(route?.[0]?.portionOfTotal * 100) + "%" : null}</h6>
                                                    <Icon name="arrow_forward_ios" size={12}/>
                                                    <div className={styles.route}>
                                                        <div className={styles.coins}>
                                                            <div className={styles.path}>
                                                    <span
                                                        style={{marginRight: 3}}>{symbolFromAddress(route?.[0]?.path1.from)}</span>
                                                                <div className={styles.dex}>
                                                                    <Icon name="arrow_forward_ios" size={10}/>
                                                                    <span
                                                                        className={styles.dexName}>{dexName(route?.[0]?.path1.dex)}</span>
                                                                </div>
                                                                <span
                                                                    style={{marginLeft: 3}}>{symbolFromAddress(route?.[0]?.path1.to)}</span>
                                                                {
                                                                    route?.[0]?.steps > 1 &&
                                                                    [
                                                                        <div className={styles.dex}>
                                                                            <Icon name="arrow_forward_ios" size={10}/>
                                                                            <span
                                                                                className={styles.dexName}>{dexName(route?.[0]?.path2.dex)}</span>
                                                                        </div>,
                                                                        <span
                                                                            style={{marginLeft: 3}}>{symbolFromAddress(route?.[0]?.path2.to)}</span>
                                                                    ]
                                                                }
                                                                {
                                                                    route?.[0]?.steps > 2 &&
                                                                    [
                                                                        <div className={styles.dex}>
                                                                            <Icon name="arrow_forward_ios" size={10}/>
                                                                            <span
                                                                                className={styles.dexName}>{dexName(route?.[0]?.path3.dex)}</span>
                                                                        </div>,
                                                                        <span
                                                                            style={{marginLeft: 3}}>{symbolFromAddress(route?.[0]?.path3.to)}</span>
                                                                    ]
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            }

                                            {route?.[1] &&
                                                <div className={styles.routes}>
                                                    <h6>{route?.[1]?.portionOfTotal ? Math.trunc(route?.[1]?.portionOfTotal * 100) + "%" : null}</h6>
                                                    <Icon name="arrow_forward_ios" size={12}/>
                                                    <div className={styles.route}>
                                                        <div className={styles.coins}>
                                                            <div className={styles.path}>
                                                    <span
                                                        style={{marginRight: 3}}>{symbolFromAddress(route?.[1]?.path1.from)}</span>
                                                                <div className={styles.dex}>
                                                                    <Icon name="arrow_forward_ios" size={10}/>
                                                                    <span
                                                                        className={styles.dexName}>{dexName(route?.[1]?.path1.dex)}</span>
                                                                </div>
                                                                <span
                                                                    style={{marginLeft: 3}}>{symbolFromAddress(route?.[1]?.path1.to)}</span>
                                                                {
                                                                    route?.[1].steps > 1 &&
                                                                    [
                                                                        <div className={styles.dex}>
                                                                            <Icon name="arrow_forward_ios" size={10}/>
                                                                            <span
                                                                                className={styles.dexName}>{dexName(route?.[1]?.path2.dex)}</span>
                                                                        </div>,
                                                                        <span
                                                                            style={{marginLeft: 3}}>{symbolFromAddress(route?.[1]?.path2.to)}</span>
                                                                    ]
                                                                }
                                                                {
                                                                    route?.[1]?.steps > 2 &&
                                                                    [
                                                                        <div className={styles.dex}>
                                                                            <Icon name="arrow_forward_ios" size={10}/>
                                                                            <span
                                                                                className={styles.dexName}>{dexName(route?.[1]?.path3.dex)}</span>
                                                                        </div>,
                                                                        <span
                                                                            style={{marginLeft: 3}}>{symbolFromAddress(route?.[1]?.path3.to)}</span>
                                                                    ]
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            }

                                            {route?.[2] &&
                                                <div className={styles.routes}>
                                                    <h6>{route?.[2].portionOfTotal ? Math.trunc(route?.[2].portionOfTotal * 100) + "%" : null}</h6>
                                                    <Icon name="arrow_forward_ios" size={12}/>
                                                    <div className={styles.route}>
                                                        <div className={styles.coins}>
                                                            <div className={styles.path}>
                                                    <span
                                                        style={{marginRight: 3}}>{symbolFromAddress(route?.[2].path1.from)}</span>
                                                                <div className={styles.dex}>
                                                                    <Icon name="arrow_forward_ios" size={10}/>
                                                                    <span
                                                                        className={styles.dexName}>{dexName(route?.[2].path1.dex)}</span>
                                                                </div>
                                                                <span
                                                                    style={{marginLeft: 3}}>{symbolFromAddress(route?.[2].path1.to)}</span>
                                                                {
                                                                    route?.[2].steps > 1 &&
                                                                    [
                                                                        <div className={styles.dex}>
                                                                            <Icon name="arrow_forward_ios" size={10}/>
                                                                            <span
                                                                                className={styles.dexName}>{dexName(route?.[2].path2.dex)}</span>
                                                                        </div>,
                                                                        <span
                                                                            style={{marginLeft: 3}}>{symbolFromAddress(route?.[2].path2.to)}</span>
                                                                    ]
                                                                }
                                                                {
                                                                    route?.[2].steps > 2 &&
                                                                    [
                                                                        <div className={styles.dex}>
                                                                            <Icon name="arrow_forward_ios" size={10}/>
                                                                            <span
                                                                                className={styles.dexName}>{dexName(route?.[2].path3.dex)}</span>
                                                                        </div>,
                                                                        <span
                                                                            style={{marginLeft: 3}}>{symbolFromAddress(route?.[2].path3.to)}</span>
                                                                    ]
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            } */}
                  </div>
                </React.Fragment>
              }
            >
              <h6 className={styles.tradeText}>
                Best Trade{" "}
                {dexsPrice?.terra &&
                  dexsPrice.aggregator > dexsPrice?.terra && (
                    <>
                      | Save{" "}
                      {Math.round(
                        100 *
                          100 *
                          (dexsPrice.aggregator / dexsPrice?.terra - 1)
                      ) / 100}{" "}
                      %
                    </>
                  )}
              </h6>
            </TooltipLgIcon>
          )}
          {
            //                        (!(route === null)) && (
            //                        <TooltipIcon
            //                            className={styles.bestRouteTooltip}
            //                            iconClassName={styles.aquaColor}
            //                            placement="bottom"
            //                            arrow={false}
            //                            content={"Best trade on Juno chain"}
            //                        >
            //                            <h6 className={styles.tradeText}>
            //                                Best Trade {(dexsPrice?.terra && dexsPrice.aggregator > dexsPrice?.terra) && <>|
            //                                Save {Math.round(100 * 100 * (dexsPrice.aggregator / dexsPrice?.terra - 1)) / 100} %</>}
            //                            </h6>
            //                        </TooltipIcon>
            //                    )
          }
          {!(swapRoutes === null) &&
            dexsPrice?.terra &&
            dexsPrice.aggregator > dexsPrice?.terra && (
              <Confirm
                className={styles.confirmList}
                titleClassName={styles.titleClassName}
                list={[
                  {
                    title: (
                      <TooltipIcon content="Total tokens received on JunoSwap and the savings difference">
                        <img
                          src={junoSwapImg}
                          alt=""
                          className={styles.profileImg}
                        />{" "}
                        JunoSwap
                      </TooltipIcon>
                    ),
                    content: (
                      <span className={styles.fee}>
                        {decimal(dexsPrice?.terra?.toString(), 3)}{" "}
                        {askAmount?.token}{" "}
                        {dexsPrice?.terra &&
                          dexsPrice?.aggregator > dexsPrice?.terra && (
                            <div>
                              <span className={styles.dim}> |</span>
                              <span className={styles.red}>
                                {" -"}{" "}
                                {Math.round(
                                  100 *
                                    100 *
                                    (dexsPrice.aggregator / dexsPrice?.terra -
                                      1)
                                ) / 100}{" "}
                                %
                              </span>
                            </div>
                          )}
                      </span>
                    ),
                  },
                ]}
              />
            )}
          {!(swapRoutes === null) && !webApp && (
            <div className={styles.contentsData}>
              {!hideContent &&
                gt(uusd, div(plus(!deduct ? tax : 0, fee.amount), SMALLEST)) &&
                contents && (
                  <Confirm
                    className={styles.confirmList}
                    list={[
                      ...contents,
                      {
                        // title: (
                        //   <TooltipIcon content={Tooltip.Forms.TxFee}>
                        //     Gas Fee
                        //   </TooltipIcon>
                        // ),
                        // content: (
                        //   <span className={styles.fee}>
                        //     <span className={styles.approx}>&#8776;</span> {txFee}
                        //   </span>
                        // ),
                      },
                    ]}
                  />
                )}
            </div>
          )}

          {gt(uusd, div(plus(!deduct ? tax : 0, fee.amount), SMALLEST)) &&
            (invalid ?? messages)?.map((message, index) => (
              <FormFeedback key={index}>{message}</FormFeedback>
            ))}
          {!gt(uusd, div(plus(!deduct ? tax : 0, fee.amount), SMALLEST)) && (
            <UstNotEnough uusdAmount={txFee} />
          )}

          {afterSubmitChilds && afterSubmitChilds}
          {showCheckbox && !disabled && (
            <div
              className={styles.checkbox}
              onClick={
                allowAutoFarm ? () => setIsAutoFarm(!isAutoFarm) : () => {}
              }
            >
              {/* <Tooltips content={allowAutoFarm ? "" : "This pool is not on V3 yet, check back over the next few weeks."}>
              <div className={styles.box}>
                {isAutoFarm && <img src={CHECKED_ICON} alt={"CHECKED_ICON"} />}
              </div>
              <label>Auto Farm for higher APY</label>
              </Tooltips> */}
            </div>
          )}
        </div>
      </div>
    )

    return tab ? (
      <Tab {...tab}>{form}</Tab>
    ) : (
      <>
        <Card
          hasForm
          headerClass={title?.className ?? ""}
          lg
          className={styles.card}
          poolSwapWidget={poolSwapWidget}
          header={!poolSwapWidget ? title?.name ?? "" : undefined}
          showForm={!poolSwapWidget ? showForm : undefined}
          makeCollapseable={!poolSwapWidget ? makeCollapseable : undefined}
          headerBorder={!poolSwapWidget ? headerBorder : undefined}
          mainSectionClass={!poolSwapWidget ? mainSectionClass : undefined}
          showHeaderTabs={!poolSwapWidget ? showHeaderTabs : undefined}
          webApp={!poolSwapWidget ? webApp : undefined}
          slippage={!poolSwapWidget ? slippage : undefined}
        >
          {form}
        </Card>
        {webApp && (
          <>
            {slippage}
            <div className={styles.divider} />
            {!hideContent &&
              gt(uusd, div(plus(!deduct ? tax : 0, fee.amount), SMALLEST)) &&
              contents && (
                <Confirm
                  webApp
                  list={[
                    ...contents,
                    {
                      title: "Gas Fee",
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
    <Container sm={sm} className={styles.cardContainer}>
      {showLoading && (
        <div className={styles.infinityLoader}>
          <img src="/loading.gif" alt="" />
          <p>Finding best price..</p>
        </div>
      )}
      <form {...attrs} onSubmit={handleSubmit}>
        {render(children)}
      </form>
      {/*{!address && <ConnectListModal {...modal} />}*/}
    </Container>
  )
}

export default ProMsgFormContainer
