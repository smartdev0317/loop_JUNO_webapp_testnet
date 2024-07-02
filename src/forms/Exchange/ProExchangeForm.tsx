// 👇️ ts-nocheck disables type checking for entire file
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

// 👇️ ts-ignore ignores any ts errors on the next line
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignoreimport { useEffect, useRef, useState } from "react"

import { useLocation } from "react-router-dom"
import { isNil } from "ramda"
import classNames from "classnames"
import { useEffect, useState, useRef } from "react"

import useNewContractMsg from "../../terra/useNewContractMsg"
import { aUST_TOKEN, COMMISSION, MAX_SPREAD, SMALLEST } from "../../constants"
import {
  div,
  gt,
  gte,
  isFinite,
  lte,
  minus,
  multiple,
  number,
  plus,
  pow,
} from "../../libs/math"
import { useFetchTokens } from "../../hooks"
import {
  adjustAmount,
  decimal,
  isNative,
  lookup,
  lookupSymbol,
  toAmount,
} from "../../libs/parse"
import useForm from "../../libs/useForm"
import {
  renderBalance,
  step,
  validate as v,
  validateSlippage,
} from "../../libs/formHelpers"
import useLocalStorage from "libs/useLocalStorage"
import calc from "../../helpers/calc"
import { BalanceKey, PriceKey } from "hooks/contractKeys"
import SWAP_ICON from "images/icons/swap_icon.png"
import {
  FormGroup,
  WebAppFormGroup,
  Count,
  TooltipIcon,
  PriceImpaceCount,
  Button,
  Modal,
  FormGroupV2,
  WebAppFormGroupV2,
  LoadingPlaceholder,
} from "components"
import { bound } from "components/Boundary"
import UstAustHighPriceImpactModal, {
  HighPriceImpactModal,
} from "components/Static/UstAustHighPriceImpaceModal"
import styles from "components/PoolConfirmModal.module.scss"
import { EXCHANGE_TOKEN, Type } from "pages/Exchange"
import useLatest from "../useLatest"
import { Config } from "./useSelectSwapAsset"
import useSwapReceipt from "../receipts/useSwapReceipt"
import { PostError } from "../CustomMsgFormContainer"
import useFee from "graphql/useFee"
import useTax from "graphql/useTax"
import SetManualSlippageTolerance from "../SetManualSlippageTolerance"
import WebAppSetManualSlippageTolerance from "../WebAppSetManualSlippageTolerance"
import { useFindTokenDetails } from "data/form/select"
import swapIcon from "images/swaping.png"
import webappSwapIcon from "images/webapp_swap.svg"
import { useFindBalance } from "data/contract/normalize"
import { useTokenMethods } from "data/contract/info"
import { useUnitPrices } from "data/API/dashboard"
import { useProtocol } from "data/contract/protocol"
import { TitleHeader } from "types/Types"
import { DeliverTxResponse } from "@cosmjs/stargate"
import { useAggregator } from "../Aggregator/Aggregator"
import { useDexSimulation } from "../Aggregator/dexsSimulation"
import poolList from "../Aggregator/poolList.json"
import { insertIf } from "libs/utils"
import ProMsgFormContainer from "../ProMsgFormContainer"
import useSelectProSwapAsset from "./ProSwap/useSelectProSwapAsset"
import useAddress from "hooks/useAddress"
import { wyndPools, WYND_SWAP_ADDR } from "./wyndSwapPool"

enum Key {
  token1 = "token1",
  token2 = "token2",
  value1 = "value1",
  value2 = "value2",
  pair = "pair",
}

var simulation = {
  load: null,
  simulated: { amount: 0, spread: 0, commision: 0, price: 0 },
  error: false,
  loading: true,
  route: null,
}

export function getPool(addressFrom, addressTo, routerName) {
  return poolList[routerName].filter(
    (item) =>
      JSON.stringify(item.pool_assets).includes(JSON.stringify(addressFrom)) &&
      JSON.stringify(item.pool_assets).includes(JSON.stringify(addressTo))
  )
}

const ExchangeForm = ({
  type,
  tab,
  title,
  smScreen,
  setTokens,
  responseFun,
  setSimulatedPriceFunc,
  showForm = true,
  poolTokenSelected,
  formUpdated,
  splittedSwap,
  onChangePair,
  isNewDesign = false,
  makeCollapseable = false,
  showResult = true,
  poolSwapWidget = false,
  HeaderForm,
  webApp,
}: {
  webApp?: boolean
  HeaderForm?: any
  poolTokenSelected?: any
  showForm?: boolean
  type: Type
  tab: Tab
  title?: TitleHeader
  smScreen?: boolean
  isNewDesign?: boolean
  makeCollapseable?: boolean
  showResult?: boolean
  formUpdated?: (status: boolean) => void
  splittedSwap?: (status: boolean) => void
  setTokens?: (token1: EXCHANGE_TOKEN, token2?: EXCHANGE_TOKEN) => void
  responseFun?: (
    res: DeliverTxResponse | undefined,
    errorRes?: PostError | undefined,
    tx?: { token: string; amount: string }
  ) => void
  setSimulatedPriceFunc?: (res?: string) => void
  onChangePair?: Function | null
  poolSwapWidget?: boolean
}) => {
  const priceKey = PriceKey.PAIR
  const balanceKey = BalanceKey.TOKEN

  /* context */
  const { state } = useLocation<{ token: string }>()
  const { toToken } = useProtocol()
  const { getSymbol } = useTokenMethods()
  const [totalTax, setTotalTax] = useState("0")
  const address = useAddress()

  // usePolling()
  let reverse = false

  const { getTokenSymbol } = useFetchTokens(undefined, state)

  const findBalanceFn = useFindBalance()
  const { check8decOper, check8decTokens } = useTokenMethods()
  const { contents: unitPriceList } = useUnitPrices()

  /* form:slippage */
  const slippageState = useLocalStorage("slippage", "2")
  const [slippageValue] = slippageState
  const slippageError = validateSlippage(slippageValue)
  const slippage =
    isFinite(slippageValue) && !slippageError
      ? div(slippageValue, 100)
      : MAX_SPREAD

  const findTokenDetailFn = useFindTokenDetails(true)

  /* form:validate */
  const validate = ({ value1, value2, token1, token2, pair }: Values<Key>) => {
    const max1 = findBalanceFn(token1)
    const token1Del = findTokenDetailFn(token1)

    return {
      [Key.value1]: v.amount(
        isNative(token1)
          ? value1
          : multiple(value1, pow("10", token1Del?.decimals ?? "6") ?? SMALLEST),
        {
          symbol: "",
          min: "0.1",
          max: token1
            ? isNative(token1)
              ? multiple(max1, pow("10", token1Del?.decimals ?? SMALLEST))
              : max1
            : undefined,
        },
        undefined,
        token1Del?.decimals?.toString() ?? SMALLEST.toString()
      ),
      [Key.value2]: v.required(value2),
      [Key.token1]: v.required(token1),
      [Key.token2]: v.required(token2),
      [Key.pair]: v.required(pair),
    }
  }

  // const { whitelist, getToken } = useProtocol()
  // LOOP-UST pair
  // const { pair: loopUstPair } = whitelist[getToken(LOOP)] ?? {}

  /* form:hook */
  const initial = {
    [Key.value1]: "",
    [Key.value2]: "",
    [Key.token1]:
      "ibc/EAC38D55372F38F1AFD68DF7FE9EF762DCF69F26520643CF3F9D292A738D8034",
    [Key.token2]:
      "juno1qsrercqegvs4ye0yqg93knv73ye5dc3prqwd6jcdcuj8ggp6w0us66deup" ?? "",
    [Key.pair]:
      "juno1utkr0ep06rkxgsesq6uryug93daklyd6wneesmtvxjkz0xjlte9qdj2s8q" ?? "",
  }

  const form = useForm<Key>(initial, validate)
  const { values, setValues, getFields, attrs, invalid, setValue } = form

  const { value1, value2, token1, token2, pair } = values
  const token1Detail = findTokenDetailFn(token1)
  const token2Detail = findTokenDetailFn(token2)
  const tokenPrice1Usdc = unitPriceList[token1]?.unitPrice
  const tokenPrice2Usdc = unitPriceList[token2]?.unitPrice
  const amount1 = token1Detail?.decimals
    ? toAmount(value1, token1Detail?.decimals)
    : toAmount(value1)
  const amount2 = token2Detail?.decimals
    ? toAmount(value2, token2Detail?.decimals)
    : toAmount(value2)
  const symbol1 = token1Detail ? lookupSymbol(token1Detail.tokenSymbol) : ""
  const symbol2 = token2Detail ? lookupSymbol(token2Detail.tokenSymbol) : ""
  const uusd = { [Type.SWAP]: amount1, [Type.SELL]: amount2 }[type]
  const bothAreWh = check8decTokens(token1, token2)
  useEffect(() => {
    value1 &&
      gt((value1 + "")?.split(".")?.[1]?.length, "6") &&
      setValue(Key.value1, decimal(value1, 6))
  }, [value1])

  useEffect(() => {
    value2 &&
      gt((value2 + "")?.split(".")?.[1]?.length, "6") &&
      setValue(Key.value2, decimal(value2, 6))
  }, [value2])

  /* form:focus input on select asset */
  const valueRef = useRef<HTMLInputElement>()
  const value2Ref = useRef<HTMLInputElement>()


  const onSelect = (name: Key) => (token: string, pair: string | undefined) => {
    // const next: Partial<Record<Key, Partial<Values<Key>>>> = {
    //   [Key.token1]: {
    //     token2: name === Key.token1 ? "" : token2,
    //     pair: name === Key.token1 ? undefined : pair ?? "",
    //   },
    //   [Key.token2]: {
    //     token1: token1,
    //     pair: name === Key.token1 ? undefined : pair ?? "",
    //   },
    // }
    setValues({ ...values /*, ...next[name]*/, [name]: token })
    if (onChangePair) {
      if (pair) {
        onChangePair(pair)
      } else {
        let loopPools = getPool(
          token,
          name === Key.token1 ? token2 : token1,
          "loop"
        )
        let junoPools = getPool(
          token,
          name === Key.token1 ? token2 : token1,
          "juno"
        )
        let wyndPools = getPool(
          token,
          name === Key.token1 ? token2 : token1,
          "wynd"
        )
        if (loopPools.length > 0) {
          onChangePair(loopPools[0].swap_address, "loop")
        } else if (junoPools.length > 0) {
          onChangePair(junoPools[0].swap_address, "juno")
          // onChangePair('')
        } else if (wyndPools.length > 0) {
          onChangePair(wyndPools[0].swap_address, "wynd")
        } else {
          onChangePair("")
        }
      }
    }
    // setShouldClose(name === Key.token1)
  }

  /*const onClick = (name: Key) => (token: string, pair: string | undefined) => {

      if (onChangePair && pair) onChangePair(pair)
      const next: Partial<Record<Key, Partial<Values<Key>>>> = {
        [Key.token1]: {
          token2: name === Key.token1 ? "" : token2,
          pair: name === Key.token1 ? undefined : pair ?? "",
        },
        [Key.token2]: {
          token1: token1,
          pair: name === Key.token1 ? undefined : pair ?? "",
        },
      }
      setValues({ ...values, ...next[name], [name]: token })
      setShouldClose(name === Key.token1)
    }*/

  /* simulation */
  reverse = form.changed === Key.value2

  const simulationParams = !reverse
    ? { amount: gt(amount1, 0) ? amount1 : "0", token: token1 }
    : { amount: gt(amount2, 0) ? amount2 : "0", token: token2 }

  simulation = useAggregator(
    token1,
    token2,
    simulationParams.amount,
    50,
    reverse
  )

  const dexSimulation0 = useDexSimulation({
    amount: simulationParams.amount,
    token: simulationParams.token,
    tokenTo: !reverse ? token2 : token1,
    reverse: reverse,
    type,
    dex: 0,
  })
  const { simulated: dexSimulated0 } = dexSimulation0

  // const dexSimulation1 = dexsSimulation({
  //   amount: simulationParams.amount,
  //   token: simulationParams.token,
  //   tokenTo: !reverse ? token2 : token1,
  //   reverse: reverse,
  //   type,
  //   dex: 1
  // })
  // const { simulated: dexSimulated1, load: loadingDex1 } = dexSimulation1

  const { simulated, loading: simulating, error, route } = simulation

  const showRoute = route ? route : null

  const adjustedTerra = adjustAmount(
    bothAreWh,
    !check8decTokens(token2),
    dexSimulated0?.amount
  )

  useEffect(() => {
    if (route?.length > 0) {
      route[0]?.portionOfTotal < 1
        ? splittedSwap?.(true)
        : splittedSwap?.(false)
    }
  }, [route])

  const adjustedAggregator = adjustAmount(
    bothAreWh,
    !check8decTokens(token2),
    simulation?.simulated?.amount
  )

  const adjustedStartAmount = adjustAmount(
    bothAreWh,
    !check8decTokens(token1),
    simulationParams?.amount
  )

  const decimalTerra =
    decimal(
      adjustedTerra,
      reverse ? token1Detail?.decimals ?? 6 : token2Detail?.decimals ?? 6
    ) /
    10 ** (reverse ? token1Detail?.decimals ?? 6 : token2Detail?.decimals ?? 6)
  const decimalAggregator =
    decimal(
      adjustedAggregator,
      reverse ? token1Detail?.decimals ?? 6 : token2Detail?.decimals ?? 6
    ) /
    10 ** (reverse ? token1Detail?.decimals ?? 6 : token2Detail?.decimals ?? 6)
  const decimalStartAmount =
    decimal(
      adjustedStartAmount,
      reverse ? token2Detail?.decimals ?? 6 : token1Detail?.decimals ?? 6
    ) /
    10 ** (reverse ? token2Detail?.decimals ?? 6 : token1Detail?.decimals ?? 6)

  const showDexsPrices = {}
  dexSimulated0?.amount > 0
    ? (showDexsPrices.terra = +decimalTerra)
    : (showDexsPrices.terra = null)
  simulation?.simulated?.amount > 0
    ? (showDexsPrices.aggregator = +decimalAggregator)
    : (showDexsPrices.aggregator = null)
  simulation?.simulated?.amount > 0
    ? (showDexsPrices.startAmount = +decimalStartAmount)
    : (showDexsPrices.decimalStartAmount = null)

  //get PoolAddress for wynd and other dexes
  const getSelectedPoolAddress = (poolAddress) => {
    if (wyndPools.includes(poolAddress)) {
      return WYND_SWAP_ADDR
    } else {
      return poolAddress
    }
  }

  //single price simulation
  const perSimulationParams = !reverse
    ? { amount: SMALLEST.toString(), token: token1 }
    : { amount: SMALLEST.toString(), token: token2 }

  // const perSimulation = useSwapSimulate({
  //   ...perSimulationParams,
  //   pair,
  //   reverse: false,
  //   type,
  // })
  const perSimulation = useAggregator(
    token1,
    token2,
    perSimulationParams.amount,
    1,
    reverse
  )

  const { simulated: perSimulated } = perSimulation

  const priceImpact = usePriceImpact(perSimulated, simulated, value1, value2)

  const [time, setTime] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 5000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  /* on simulate */
  useEffect(() => {
    const key = reverse ? Key.value1 : Key.value2
    const symbol = reverse ? symbol1 : symbol2
    const next = simulated
      ? lookup(
          key === Key.value2
            ? isNative(token2)
              ? simulated?.amount ?? "0"
              : simulated.amount
            : isNative(token1)
            ? simulated.amount ?? "0"
            : simulated.amount,
          symbol
        )
      : error && ""
    // const next = simulated ? lookup(simulated.amount, symbol) : error && ""
    // Safe to use as deps

    const value = adjustAmount(bothAreWh, !check8decTokens(token1), next)
    !isNil(next) &&
      setValues((values) => ({
        ...values,
        [key]: decimal(
          value,
          reverse ? token1Detail?.decimals ?? 6 : token2Detail?.decimals ?? 6
        ),
      }))

    setSimulatedPriceFunc?.(value ?? "0")
  }, [simulated, reverse])

  /* latest price */
  const { isClosed } = useLatest()

  /* render:form */
  const config1: Config = {
    token: token1,
    symbol: symbol1,
    onSelect: onSelect(Key.token1),
    useUST: false,
    dim: (token) => isClosed(getSymbol(token)),
    smScreen,
    tokenIndex: 1,
    modalTitle: "From",
    skip: ["juno19rqljkh95gh40s7qdx40ksx3zq5tm4qsmsrdz9smw668x9zdr3lqtg33mf","juno1hnftys64ectjfynm6qjk9my8jd3f6l9dq9utcd3dy8ehwrsx9q4q7n9uxt"],
    // type: SelectType.SWAP
  }

  const config2: Config = {
    token: token2,
    symbol: symbol2,
    otherToken: config1.token,
    onSelect: onSelect(Key.token2),
    useUST: true,
    dim: (token) => isClosed(getSymbol(token)),
    smScreen,
    tokenIndex: 2,
    modalTitle: "To",
    skip: ["juno19rqljkh95gh40s7qdx40ksx3zq5tm4qsmsrdz9smw668x9zdr3lqtg33mf","juno1hnftys64ectjfynm6qjk9my8jd3f6l9dq9utcd3dy8ehwrsx9q4q7n9uxt"],
    // type: SelectType.SWAP
  }

  const [shouldClose, setShouldClose] = useState(false)

  let select1 = useSelectProSwapAsset({ priceKey, balanceKey, ...config1 })
  let select2 = useSelectProSwapAsset({
    priceKey,
    balanceKey,
    ...config2,
    shouldClose,
  })

  useEffect(() => {
    token1 &&
      token2 &&
      setTokens?.(
        { token: token1, symbol: token1Detail?.tokenSymbol },
        { token: token2, symbol: token2Detail?.tokenSymbol }
      )
  }, [token1, token2])

  let fields = getFields({
    [Key.value1]: {
      label: "From",
      input: {
        type: "number",
        step: step(symbol1, token1Detail?.decimals ?? 6),
        placeholder: "0",
        autoFocus: false,
        ref: valueRef,
        setValue: setValue,
        name: Key.value1,
        decimal: token1Detail?.decimals ?? 6,
        uusdBalance: (symbol1 !== 'USDC' && gt(amount1,'0')) ? multiple(tokenPrice1Usdc, div(amount1, SMALLEST)) : ''
      },
      tokenDetail: token1Detail,
      zIndex: 40,
      unit: select1.button,
      max: gt(findBalanceFn(token1) ?? "", "0")
        ? () => {
            const bal = token1
              ? isNative(token1)
                ? findBalanceFn(token1)
                : div(
                    findBalanceFn(token1),
                    pow("10", token1Detail?.decimals ?? 6)
                  )
              : ""

            setValue(
              Key.value1,
              symbol1.toUpperCase() === "JUNO"
                ? decimal(
                    minus(
                      gte(bal, "0.1") ? bal : "0",
                      gte(bal, "0.1") ? "0.1" : "0"
                    ),
                    token1Detail?.decimals ?? 6
                  )
                : decimal(bal, token1Detail?.decimals ?? 6)
            )

            // setValue(Key.value1, decimal(symbol1.toUpperCase() === 'JUNO' ? decimal(minus(gte(bal, "0.1") ? bal : "0", gte(bal, "0.1") ? "0.1" : "0"),token1Detail?.decimals ?? 6): decimal(bal, token1Detail?.decimals ?? 6))
          }
        : undefined,
      maxValue: gt(findBalanceFn(token1) ?? "", "0")
        ? () => {
            const bal = token1
              ? isNative(token1)
                ? findBalanceFn(token1)
                : div(
                    findBalanceFn(token1),
                    pow("10", token1Detail?.decimals ?? 6)
                  )
              : ""
            return (
              Key.value1,
              symbol1.toUpperCase() === "JUNO"
                ? decimal(bal ?? "0", token1Detail?.decimals ?? 6)
                : decimal(bal, token1Detail?.decimals ?? 6)
            )

            // return Key.value1, symbol1.toUpperCase() === 'JUNO' ? decimal(minus(gte(bal, "0.1") ? bal : "0", gte(bal, "0.1") ? "0.1" : "0"), token1Detail?.decimals ?? 6) : decimal(bal, token1Detail?.decimals ?? 6)
          }
        : undefined,
      assets: select1.assets,
      help: renderBalance(
        token1
          ? isNative(token1)
            ? findBalanceFn(token1)
            : div(findBalanceFn(token1), pow("10", token1Detail?.decimals ?? 6))
          : ""
      ),
      focused: select1.isOpen,
      showBalance: false,
    },

    [Key.value2]: {
      label: "To",
      input: {
        type: "number",
        step: step(symbol2, token2Detail?.decimals ?? 6),
        placeholder: "0",
        ref: value2Ref,
        readOnly: false,
        decimal: token2Detail?.decimals ?? 6,
        uusdBalance: (symbol2 !== 'USDC' && gt(amount2,'0')) ? multiple(tokenPrice2Usdc, div(amount2, SMALLEST)) : ''
      },
      tokenDetail: token2Detail,
      zIndex: 30,
      unit: select2.button,
      assets: select2.assets,
      max: undefined,
      help: renderBalance(
        shouldClose
          ? "0"
          : isNative(token2)
          ? findBalanceFn(token2)
          : div(findBalanceFn(token2), pow("10", token2Detail?.decimals ?? 6))
      ),
      focused: select2.isOpen,
      showBalance: true,
    },
  })

  /* confirm */
  const belief = {
    [Type.SWAP]: decimal(simulated?.price, 18),
    [Type.SELL]: decimal(div(1, simulated?.price), 18),
  }[type]

  const minimumReceived = simulated
    ? calc.minimumReceived({
        offer_amount: !reverse ? amount1 : simulated?.amount.toString(),
        belief_price: belief,
        max_spread: String(slippage),
        commission: String(COMMISSION),
      })
    : "0"

  useEffect(() => {
    formUpdated?.(![value1, token1, token2].some((item) => !item))
  }, [value1, token1, token2])

  const contents =
    [value1, token1, token2].some((item) => !item) ||
    !(simulation?.simulated?.amount > 0)
      ? undefined
      : [
          {
            title: (
              <TooltipIcon
                content={"Expected average price for each token"}
                className={styles.titleClassName}
              >
                Expected Price
              </TooltipIcon>
            ),
            content: bound(
              !isNaN(number(div(value1 ?? "0", value2 ?? 0))) &&
                isFinite(div(value1 ?? "0", value2 ?? 0)) && (
                  <>
                    {decimal(div(value1 ?? "0", value2 ?? 0), 6)}{" "}
                    {symbol1 ?? ""}
                  </>
                ),
              <LoadingPlaceholder
                size={"sm"}
                className={styles.loading}
                color={"lightGrey"}
              />
            ),
          },
          {
            title: (
              <TooltipIcon
                content={
                  "The change in the token price after you execute this trade"
                }
                className={styles.titleClassName}
              >
                Price Impact
              </TooltipIcon>
            ),
            content: <PriceImpaceCount price={priceImpact} />,
          },
          {
            title: (
              <TooltipIcon
                className={styles.titleClassName}
                content={
                  "The guaranteed minimum you will receive as per your slippage settings. You can adjust slippage at the top right of this box"
                }
              >
                Minimum Received
              </TooltipIcon>
            ),
            content: (
              <Count symbol={symbol2}>
                {adjustAmount(
                  bothAreWh,
                  !check8decOper(token1),
                  minimumReceived
                )}
              </Count>
            ),
          },
        ]

  /* submit */
  const newContractMsg = useNewContractMsg()

  // const swaps = {
  //   belief_price: belief,
  //   max_spread: String(slippage),
  // }

  // const forNonNative = newContractMsg(token1, {
  //   send: {
  //     amount: check8decOper(token1)
  //       ? multiple(amount1, 100)
  //       : amount1,
  //     contract: pair,
  //     msg: "eyJzd2FwIjp7fX0=",
  //   },
  // })

  const [sendAmount, setSendAmount] = useState("0")

  useEffect(() => {
    setSendAmount(
      gt(plus(div(amount1, SMALLEST), 2), findBalanceFn(token1))
        ? // && ifTokenNative?.denom === UUSD // note: wallet change it by self
          // ? minus(div(amount1, SMALLEST), 2) // note: wallet change it by self
          amount1
        : amount1
    )
  }, [token1, amount1])

  const asset = toToken({ token: token1, amount: amount1 })

  /*const toNative: any = (token: string) => {
      return isNative(token)
          ? {
            amount: sendAmount,
            info: {
              native_token: {
                denom: token,
              },
            },
          }
          : asset
    }*/

  // const insertCoins: any = {
  //   amount: sendAmount,
  //   denom: isNative(token1) ? token1 : UUSD,
  // }

  // const swapContract = isNative(token1)
  //   ? newContractMsg(
  //     pair,
  //     { swap: { offer_asset: toNative(token1), ...swaps } },
  //     insertCoins
  //   )
  //   : forNonNative

  const toNative1: any = (token: string, amount: string) => {
    return isNative(token)
      ? {
          amount: decimal(amount, 0),
          info: {
            native_token: {
              denom: token,
            },
          },
        }
      : toToken({ token: token, amount: decimal(amount, 0) })
  }

  const tokenNumber: any = (token: string, pool: string) => {
    let poolFind = poolList.juno.find((item) => item.swap_address === pool)
    let index = poolFind
      ? JSON.stringify(poolFind?.pool_assets[0]).includes(token)
        ? 0
        : 1
      : null
    return "Token" + (index + 1).toString()
  }

  const loopMsg: any = (token: string, amount: string, rate: number) => {
    return {
      swap: {
        offer_asset: toNative1(token, amount),
        belief_price: decimal(div(1, rate ?? 1), 18),
        max_spread: String(slippage),
      },
    }
  }

  const loopNonNativeMsg: any = (amount: string, pool: string) => {
    return {
      send: {
        amount: decimal(amount, 0),
        contract: pool,
        msg: "eyJzd2FwIjp7fX0=",
      },
    }
  }

  const junoMsg: any = (
    token: string,
    amount: string,
    pool: string,
    rate: number
  ) => {
    return {
      swap: {
        input_token: tokenNumber(token, pool),
        input_amount: decimal(amount, 0),
        min_output: Math.trunc(
          multiple(amount, multiple(rate, 1 - +slippage))
        ).toString(),
      },
    }
  }

  const wyndNativeMsg: any = (
    token: string,
    amount: string,
    pool: string,
    rate: number,
    token2: string
  ) => {
    return {
      execute_swap_operations: {
        max_spread: "0.01",
        operations: [
          {
            wyndex_swap: {
              offer_asset_info: {
                [isNative(token) ? 'native': 'token']: token,
              },
              ask_asset_info: {
                [isNative(token2) ? 'native': 'token']: token2,
              },
            },
          },
        ],
      },
    }
  }

  const wyndNonNativeMsg = (
    token: string,
    amount: string,
    pool: string,
    rate: number,
    token2: string
  ) => {
    const encodedMsg = Buffer.from(
      JSON.stringify({
        execute_swap_operations: {
          operations: [
            {
              wyndex_swap: {
                ask_asset_info: { [isNative(token2) ? 'native': 'token']: token2 },
                offer_asset_info: {
                  [isNative(token) ? 'native': 'token']: token,
                },
              },
            },
          ],
          max_spread: "0.01",
        },
      })
    ).toString("base64")
    return {
      send: {
        amount: decimal(amount, 0),
        contract: getSelectedPoolAddress(pool),
        msg: encodedMsg,
      },
    }
  }

  const makeMsg: any = (
    token: string,
    amount: string,
    pool: string,
    rate: number,
    dex: number,
    token2: string
  ) => {
    let msg: object
    if (dex === 1) {
      if (isNative(token)) {
        msg = loopMsg(token, amount, rate)
      } else {
        msg = loopNonNativeMsg(amount, pool)
      }
    } else if (dex == 2) {
      if (isNative(token)) {
        msg = wyndNativeMsg(token, amount, pool, rate, token2)
      } else {
        msg = wyndNonNativeMsg(token, amount, pool, rate, token2)
      }
    } else {
      msg = junoMsg(token, amount, pool, rate)
    }
    return msg
  }

  const insertCoins1: any = (token: string, amount: string) => {
    return {
      amount: decimal(amount, 0),
      denom: token,
    }
  }

  const [swapTransactions, setSwapTransactions] = useState([])
  useEffect(() => {
    if (route) {
      console.log("routeTTT", route)
      let transactions = []
      for (let i = 0; i < route.length; i++) {
        transactions.push(
          ...insertIf(
            !isNative(token1) && route[i].path1?.dex === 0,
            newContractMsg(route[i]?.steps >= 1 && token1, {
              increase_allowance: {
                amount:
                  decimal(route[i].path1?.startPrice?.toString(), 0) ?? "0",
                spender: route[i].path1?.poolAddress ?? "",
              },
            })
          ),
          ...insertIf(
            route[i]?.steps >= 1,
            newContractMsg(
              !(
                !isNative(token1 ?? "") && ![0].includes(route[i].path1?.dex)
              )
                ? getSelectedPoolAddress(route[i].path1?.poolAddress) ?? ""
                : token1 ?? "",
              makeMsg(
                token1 ?? "",
                route[i].path1?.startPrice?.toString() ?? "0",
                route[i].path1?.poolAddress ?? "",
                route[i].path1?.rate,
                route[i].path1?.dex,
                route[i].path1?.to ?? ""
              ),
              isNative(token1)
                ? insertCoins1(
                    token1 ?? "",
                    route[i].path1?.startPrice?.toString() ?? "0"
                  )
                : null
            )
          ),
          ...insertIf(
            route[i]?.steps >= 2 &&
              !isNative(route[i].path2?.from ?? "") &&
              route[i].path1?.dex === 0,
            newContractMsg(route[i].path2?.from, {
              increase_allowance: {
                amount:
                  decimal(route[i].path2?.startPrice?.toString(), 0) ?? "0",
                spender: route[i].path2?.poolAddress ?? "",
              },
            })
          ),
          ...insertIf(
            route[i]?.steps >= 2,
            newContractMsg(
              !(
                !isNative(route[i].path2?.from ?? "") &&
                ![0].includes(route[i].path1?.dex)
              )
                ? getSelectedPoolAddress(route[i].path2?.poolAddress) ?? ""
                : route[i].path2?.from ?? "",
              makeMsg(
                route[i].path2?.from ?? "",
                route[i].path2?.startPrice?.toString() ?? "0",
                route[i].path2?.poolAddress ?? "",
                route[i].path2?.rate,
                route[i].path2?.dex,
                route[i].path2?.to ?? ""
              ),
              isNative(route[i].path2?.from ?? "")
                ? insertCoins1(
                    route[i].path2?.from ?? "",
                    route[i].path2?.startPrice ?? "0"
                  )
                : null
            )
          ),
          ...insertIf(
            route[i]?.steps >= 3 &&
              !isNative(route[i].path3?.from ?? "") &&
              route[i].path1?.dex === 0,
            newContractMsg(route[i].path3?.from, {
              increase_allowance: {
                amount:
                  decimal(route[i].path3?.startPrice?.toString(), 0) ?? "0",
                spender: route[i].path3?.poolAddress ?? "",
              },
            })
          ),
          ...insertIf(
            route[i]?.steps >= 3,
            newContractMsg(
              !(
                !isNative(route[i].path3?.from ?? "") &&
                ![0].includes(route[i].path1?.dex)
              )
                ? getSelectedPoolAddress(route[i].path3?.poolAddress) ?? ""
                : route[i].path3?.from ?? "",
              makeMsg(
                route[i].path3?.from ?? "",
                route[i].path3?.startPrice?.toString() ?? "0",
                route[i].path3?.poolAddress ?? "",
                route[i].path3?.rate,
                route[i].path3?.dex,
                route[i].path3?.to ?? ""
              ),
              isNative(route[i].path3?.from ?? "")
                ? insertCoins1(
                    route[i].path3?.from ?? "",
                    route[i].path3?.startPrice ?? "0"
                  )
                : null
            )
          )
        )
      }
      setSwapTransactions(transactions)
    }
  }, [route])

  const data = {
    [Type.SWAP]: swapTransactions,
    [Type.SELL]: [
      newContractMsg(token1, {
        send: { amount: amount1, contract: pair, msg: "eyJzd2FwIjp7fX0=" },
      }),
    ],
  }[type]

  const messages = !simulating
    ? error
      ? ["Simulation failed"]
      : undefined
    : undefined
  const disabled = invalid || simulating || !!messages?.length || !pair

  /* result */
  const parseTx = useSwapReceipt(type, simulated?.price)
  const msgInfo = {
    max: token1
      ? isNative(token1)
        ? multiple(findBalanceFn(token1), SMALLEST)
        : findBalanceFn(token1)
      : "0",
    value: value1,
    symbol: symbol1 ? symbol1 : getTokenSymbol(token1),
    decimals: token1Detail?.decimals,
  }

  const container = {
    label: (
      <>
        <span>{title}</span>
      </>
    ),
    // tab,
    attrs,
    contents,
    data,
    disabled,
    messages,
    parseTx,
    msgInfo,
  }
  const tax = { pretax: uusd, deduct: type === Type.SELL }

  /* tax */
  const fee = useFee(data?.length)
  const { calcTax } = useTax()
  const calculateTax = tax.pretax ? calcTax(tax.pretax) : "0"

  useEffect(() => {
    setTotalTax(plus(div(calculateTax, SMALLEST), div(fee.amount, SMALLEST)))
  }, [calculateTax])

  const slippageContent = webApp ? (
    <WebAppSetManualSlippageTolerance
      state={slippageState}
      error={slippageError}
    />
  ) : (
    <div className={poolSwapWidget ? styles.slippage : ""}>
      <SetManualSlippageTolerance state={slippageState} error={slippageError} />
    </div>
  )

  const swapData = () => {
    if (token1 && token2) {
      const next: Partial<Record<Key, Partial<Values<Key>>>> = {
        [Key.token2]: { token1: token2, token2: token1, value1: "" },
      }
      setValues({ ...values, ...next[Key.token2], value1: "" })
      token1 &&
        token2 &&
        setTokens?.(
          { token: token2, symbol: token2Detail?.tokenSymbol },
          { token: token1, symbol: token1Detail?.tokenSymbol }
        )
    }
  }
  const responseFunc = (
    response: DeliverTxResponse | undefined,
    errorResponse?: PostError
  ) => {
    setValue(Key.value1, "")
    token1 &&
      token2 &&
      pair &&
      setTokens?.(
        { token: token1, symbol: token1Detail?.tokenSymbol },
        { token: token2, symbol: token2Detail?.tokenSymbol }
      )
    responseFun?.(response, errorResponse, { token: token1, amount: value1,txhash:response?.transactionHash })
  }

  const [isAnchorModalOpen, setAnchorModalOpen] = useState(false)
  const toggleConfirmModal = () => setAnchorModalOpen(!isAnchorModalOpen)

  const name = {
    name: "Swap",
    className: styles.titleClass,
  }
  const btn =
    Math.round(
      100 * 100 * (showDexsPrices.aggregator / showDexsPrices?.terra - 1)
    ) / 100

  return (
    <ProMsgFormContainer
      {...container}
      {...tax}
      showForm={showForm}
      HeaderForm={HeaderForm}
      webApp={webApp}
      poolSwapWidget={poolSwapWidget}
      title={webApp ? false : name}
      label={
        <div className={styles.normalText}>
          Swap{" "}
          <small className={styles.small}>
            {"  "} {isFinite(btn) && gt(btn, 0) ? `save ${btn}%` : ""}
          </small>
        </div>
      }
      slippage={slippageContent}
      responseFun={responseFunc}
      showResult={showResult}
      icon={SWAP_ICON}
      makeCollapseable={makeCollapseable}
      afterSubmitChilds={
        gt(priceImpact, "10") &&
        bound(
          <Button
            size={"lg"}
            className={styles.swapSubmit}
            type={"button"}
            onClick={toggleConfirmModal}
          >
            SWAP
          </Button>,
          ""
        )
      }
      mainSectionClass={
        isNewDesign
          ? classNames(
              styles.mainCard,
              !makeCollapseable ? styles.mainCollapseCard : ""
            )
          : !address
          ? styles.mainSection
          : ""
      }
      showSubmitBtn={!gt(priceImpact, "10")}
      route={showRoute}
      dexsPrice={showDexsPrices}
      showLoading={simulating}
      isNewDesign={isNewDesign}
      askAmount={{ token: symbol2, amount: amount2 }}
    >
      {!makeCollapseable && (
        <>
          {webApp ? (
            isNewDesign ? (
              <WebAppFormGroupV2 {...fields[Key.value1]} />
            ) : (
              <WebAppFormGroup {...fields[Key.value1]} />
            )
          ) : isNewDesign ? (
            <FormGroupV2 {...fields[Key.value1]} />
          ) : (
            <FormGroup {...fields[Key.value1]} />
          )}
          <span
            className={
              webApp ? "webapp_swapIconContainer" : "swapIconContainer"
            }
          >
            <img
              src={webApp ? webappSwapIcon : swapIcon}
              className="swapIcon"
              alt={"reverse"}
              onClick={simulating ? () => {} : swapData}
            />
          </span>
          <span style={{ marginTop: "40px" }}>
            {webApp ? (
              isNewDesign ? (
                <WebAppFormGroupV2 {...fields[Key.value2]} />
              ) : (
                <WebAppFormGroup {...fields[Key.value2]} />
              )
            ) : isNewDesign ? (
              <FormGroupV2 {...fields[Key.value2]} />
            ) : (
              <FormGroup {...fields[Key.value2]} />
            )}
          </span>
        </>
      )}

      <Modal isOpen={isAnchorModalOpen} onClose={toggleConfirmModal} title={""}>
        {["uusd", aUST_TOKEN].includes(token1) &&
        ["uusd", aUST_TOKEN].includes(token2) ? (
          <UstAustHighPriceImpactModal />
        ) : (
          <HighPriceImpactModal toggleConfirmModal={toggleConfirmModal} />
        )}
      </Modal>
    </ProMsgFormContainer>
  )
}

export default ExchangeForm

export const usePriceImpact = (perSimulated, simulated, value1, value2) => {
  const [calPrice, setCalPrice] = useState("0")
  const [calPerPrice, setCalPerPrice] = useState("0")

  useEffect(() => {
    setCalPrice(
      simulated?.price && !isNaN(number(simulated?.price))
        ? simulated?.price
        : "0"
    )
    setCalPerPrice(
      perSimulated?.price && !isNaN(number(perSimulated?.price))
        ? perSimulated?.price
        : "0"
    )
  }, [perSimulated, simulated, value1, value2])

  const total = multiple(minus(1, div(calPerPrice, calPrice)), 100)
  return total && !isNaN(number(total)) ? decimal(total, 2) : "0"
}
