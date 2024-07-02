import { useEffect, useRef, useState } from "react"
import { useLocation } from "react-router-dom"
import { isNil } from "ramda"

import useNewContractMsg from "../../../terra/useNewContractMsg"
import {
  aUST_TOKEN,
  COMMISSION,
  LOOP,
  MAX_SPREAD,
  SMALLEST,
  UUSD,
} from "../../../constants"
import Tooltip from "../../../lang/Tooltip.json"
import {
  div,
  gt,
  gte,
  isFinite,
  lt,
  lte,
  minus,
  multiple,
  number,
  plus,
  pow,
} from "../../../libs/math"
import { useFetchTokens } from "../../../hooks"
import {
  adjustAmount,
  decimal,
  format,
  isNative,
  lookup,
  lookupSymbol,
  toAmount,
} from "../../../libs/parse"
import useForm from "../../../libs/useForm"
import {
  placeholder,
  renderBalance,
  step,
  toBase64,
  validate as v,
  validateSlippage,
} from "../../../libs/formHelpers"
import useLocalStorage from "../../../libs/useLocalStorage"
import calc from "../../../helpers/calc"
import {
  BalanceKey,
  PriceKey,
} from "../../../hooks/contractKeys"
import SWAP_ICON from "../../../images/icons/swap_icon.png"
import FormGroup from "../../../components/FormGroup"
import Count from "../../../components/Count"
import { TooltipIcon } from "../../../components/Tooltip"
import { EXCHANGE_TOKEN, Type } from "../../../pages/Exchange"
import useLatest from "../../../forms/useLatest"
import useSelectSwapAsset, {
  Config,
} from "../../../forms/Exchange/useSelectSwapAsset"
import useSwapReceipt from "../../../forms/receipts/useSwapReceipt"
import useSwapSimulate from "../../../forms/useSwapSimulate"
import CustomMsgFormContainer, { PostError } from "./CustomMsgFormContainer"
import useFee from "../../../graphql/useFee"
import useTax from "../../../graphql/useTax"
import SetManualSlippageTolerance from "../../../forms/SetManualSlippageTolerance"
import PriceImpaceCount from "../../../components/PriceImpactCount"
import { useFindTokenDetails } from "../../../data/form/select"
import swapIcon from "../../../images/swaping.png"
import { useFindBalance } from "../../../data/contract/normalize"
import { useTokenMethods } from "../../../data/contract/info"
import styles from "../../../components/PoolConfirmModal.module.scss"
import Button from "../../../components/Button"
import { bound } from "../../../components/Boundary"
import Modal from "../../../components/Modal"
import UstAustHighPriceImpactModal, {
  HighPriceImpactModal,
} from "../../../components/Static/UstAustHighPriceImpaceModal"
import { useProtocol } from "../../../data/contract/protocol"
import { TitleHeader } from "../../../types/Types"
import FormGroupV2 from "../../../components/V2Dashboard/FormGroupV2"
import { DeliverTxResponse } from "@cosmjs/stargate"

enum Key {
  token1 = "token1",
  token2 = "token2",
  value1 = "value1",
  value2 = "value2",
  pair = "pair",
}

const ExchangeForm = ({
  type,
  tab,
  title,
  smScreen,
  setTokens,
  responseFun,
  setSimulatedPriceFunc,
  isNewDesign = false,
  poolSwapWidget = false,
}: {
  type: Type
  tab: Tab
  title?: TitleHeader
  smScreen?: boolean
  isNewDesign?: boolean
  poolSwapWidget?: boolean
  setTokens?: (token1: EXCHANGE_TOKEN, token2?: EXCHANGE_TOKEN) => void
  responseFun?: (
    res: DeliverTxResponse | undefined,
    errorRes?: PostError | undefined
  ) => void
  setSimulatedPriceFunc?: (res?: string) => void
}) => {
  const priceKey = PriceKey.PAIR
  const balanceKey = BalanceKey.TOKEN

  /* context */
  const { state } = useLocation<{ token: string }>()
  const { toToken } = useProtocol()
  const { getSymbol } = useTokenMethods()
  const [totalTax, setTotalTax] = useState("0")

  // usePolling()
  let reverse = false

  const { ifNative, getTokenSymbol } = useFetchTokens(undefined, state)
  const [sumbit, setSumbit] = useState(false)
  const findBalanceFn = useFindBalance()
  const { check8decOper, check8decTokens } = useTokenMethods()

  /* form:slippage */
  const slippageState = useLocalStorage("slippage", "5")
  const [slippageValue] = slippageState
  const slippageError = validateSlippage(slippageValue)
  const slippage =
    isFinite(slippageValue) && !slippageError
      ? div(slippageValue, 100)
      : MAX_SPREAD

  const findTokenDetailFn = useFindTokenDetails()

  /* form:validate */
  const validate = ({ value1, value2, token1, token2, pair }: Values<Key>) => {
    const max1 = findBalanceFn(token1)
    const token1Detail = findTokenDetailFn(token1)
    return {
      [Key.value1]: v.amount(value1, {
        symbol: token1Detail?.tokenSymbol ?? token1,
        min: "0.1",
        max: token1
          ? isNative(token1)
            ? multiple(max1, SMALLEST)
            : max1
          : undefined,
      }),
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
    [Key.token1]: "juno1mrshruqvgctq5wah5plpe5wd97pq32f6ysc97tzxyd89gj8uxa7qcdwmnm",
    [Key.token2]: "juno1u03pj4yukgup87qg46kzz0gl3v58ndug0jgeu8g7y8r5p3uj5mhsute77d" ?? "",
    [Key.pair]: "juno1f2ujzukm3x6yuw8phm09jkdet0rejtqp5260weh30c0aml7z0lsq26k8s9" ?? "",
  }

  const form = useForm<Key>(initial, validate)
  const { values, setValues, getFields, attrs, invalid, setValue } = form
  const { value1, value2, token1, token2, pair } = values
  const amount1 = toAmount(value1)
  const amount2 = toAmount(value2)
  const token1Detail = findTokenDetailFn(token1)
  const token2Detail = findTokenDetailFn(token2)
  const symbol1 = token1Detail ? lookupSymbol(token1Detail.tokenSymbol) : ""
  const symbol2 = token2Detail ? lookupSymbol(token2Detail.tokenSymbol) : ""
  const uusd = { [Type.SWAP]: amount1, [Type.SELL]: amount2 }[type]
  const bothAreWh = check8decTokens(token1, token2)
    const currPair = pair

  /* form:focus input on select asset */
  const valueRef = useRef<HTMLInputElement>()
  const value2Ref = useRef<HTMLInputElement>()
  const onSelect = (name: Key) => (token: string, pair: string | undefined) => {
    const oldToken1 = token !== token1
    const next: Partial<Record<Key, Partial<Values<Key>>>> = {
      [Key.token1]: {
        token2: name === Key.token1 ? token === token1 ? token2 :"" : token2,
        pair: name === Key.token1 ? token === token1 ? currPair : undefined : pair ?? "",
      },
      [Key.token2]: {
        token1: token1,
        pair: name === Key.token1 ? token === token1 ? currPair : undefined : token === token2 ? currPair : pair ?? "",
      },
    }
    setValues({ ...values, ...next[name], [name]: token })
    setShouldClose(name === Key.token1 && oldToken1)
  }

  /* simulation */
  reverse = form.changed === Key.value2

  const simulationParams = !reverse
    ? { amount: gt(amount1, 0) ? amount1 : "0", token: token1 }
    : { amount: gt(amount2, 0) ? amount2 : "0", token: token2 }

  const simulation = useSwapSimulate({
    ...simulationParams,
    pair,
    reverse: false,
    type,
    index: 1
  })

  const {
    simulated,
    loading: simulating,
    error
  } = simulation

  //single price simulation
  const perSimulationParams = !reverse
    ? { amount: SMALLEST.toString(), token: token1 }
    : { amount: SMALLEST.toString(), token: token2 }

  const perSimulation = useSwapSimulate({
    ...perSimulationParams,
    pair,
    reverse: false,
    type,
    index: 2
  })

  const { simulated: perSimulated, loading } = perSimulation

  const priceImpact = usePriceImpact(perSimulated, simulated, value1, value2)

  // useEffect(() => {
  //   refetchSimulation()
  //   refetchPerSimulation()
  // }, [amount1, amount2, value1, value2])

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
    tokenIndex: 1
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
    // type: SelectType.SWAP
  }

  const [shouldClose, setShouldClose] = useState(false)

  let select1 = useSelectSwapAsset({ priceKey, balanceKey, ...config1 })
  let select2 = useSelectSwapAsset({
    priceKey,
    balanceKey,
    ...config2,
    shouldClose,
  })

  useEffect(() => {
    token1 &&
      token2 &&
      pair &&
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
        setValue: form.setValue,
        name: Key.value1,
        decimal: token1Detail?.decimals ?? 6,
      },
      unit: select1.button,
      max: gt(findBalanceFn(token1) ?? "", "0")
        ? () => {
            const amount = div(findBalanceFn(token1), SMALLEST)
            const ustBalance = findBalanceFn(token1)
            setValue(
              Key.value1,
              symbol1.toUpperCase() === "JUNO"
                ? decimal(
                    minus(
                      gte(ustBalance, "0.1") ? ustBalance : "0",
                      gte(ustBalance, "0.1") ? "0.1" : "0"
                    ),
                    token1Detail?.decimals ?? 6
                  )
                : decimal(
                    check8decOper(token1)
                      ? adjustAmount(true, true, amount)
                      : amount,
                    token1Detail?.decimals ?? 6
                  )
            )
          }
        : undefined,
      maxValue: gt(findBalanceFn(token1) ?? "", "0")
        ? () => {
            const amount = div(findBalanceFn(token1), SMALLEST)
            const ustBalance = findBalanceFn(token1)
            return symbol1.toUpperCase() === "JUNO"
              ? decimal(
                  minus(
                    gte(ustBalance, "0.1") ? ustBalance : "0",
                    gte(ustBalance, "0.1") ? "0.1" : "0"
                  ),
                  token1Detail?.decimals ?? 6
                )
              : decimal(
                  check8decOper(token1)
                    ? adjustAmount(true, true, amount)
                    : amount,
                  token1Detail?.decimals ?? 6
                )
          }
        : undefined,
      assets: select1.assets,
      help: renderBalance(
        token1
          ? isNative(token1)
            ? multiple(
                findBalanceFn(token1),
                pow("10", token1Detail?.decimals ?? 6)
              )
            : findBalanceFn(token1)
          : "",
        symbol1
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
        value: shouldClose ? "" : div(amount2, SMALLEST) ?? "",
        readOnly: false,
        decimal: token2Detail?.decimals ?? 6,
      },
      unit: select2.button,
      assets: select2.assets,
      max: undefined,
      help: renderBalance(
        shouldClose
          ? "0"
          : isNative(token2)
          ? multiple(
              findBalanceFn(token2),
              pow("10", token2Detail?.decimals ?? 6)
            )
          : findBalanceFn(token2),
        symbol2
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
        offer_amount: amount1,
        belief_price: belief,
        max_spread: String(slippage),
        commission: String(COMMISSION),
      })
    : "0"

  const contents = [value1, token1, token2].some((item) => !item)
    ? undefined
    : [
        {
          title: (
            <TooltipIcon content={Tooltip.Trade.Price}>
              Expected Price
            </TooltipIcon>
          ),
          content: (
            <Count format={format} symbol={getSymbol(token1)}>
              {div(value1 ?? "0", value2 ?? 0)}
            </Count>
          ),
        },
        {
          title: (
            <TooltipIcon content={"Price Impact"}>Price Impact</TooltipIcon>
          ),
          content: <PriceImpaceCount price={priceImpact} />,
        },
        {
          title: (
            <TooltipIcon content={Tooltip.Trade.MinimumReceived}>
              Minimum Received
            </TooltipIcon>
          ),
          content: (
            <Count symbol={symbol2}>
              {adjustAmount(bothAreWh, !check8decOper(token1), minimumReceived)}
            </Count>
          ),
        },
        {
          title: (
            <TooltipIcon content={Tooltip.Trade.MinimumReceived}>
              New Balance
            </TooltipIcon>
          ),
          content: 0,
        },
      ]

  /* submit */
  const newContractMsg = useNewContractMsg()

  const swaps = {
    belief_price: belief,
    max_spread: String(slippage),
  }

  const forNonNative = newContractMsg(token1, {
    send: {
      amount: check8decOper(token1) ? multiple(amount1, 100) : amount1,
      contract: pair,
      msg: toBase64({ swap: { ...swaps } }),
    },
  })

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

  const toNative: any = (token: string) => {
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
  }

  const insertCoins: any = {
    amount: sendAmount,
    denom: isNative(token1) ? token1 : UUSD,
  }

  const swapContract = isNative(token1)
    ? newContractMsg(
        pair,
        { swap: { offer_asset: toNative(token1), ...swaps } },
        insertCoins
      )
    : forNonNative

  const data = {
    [Type.SWAP]: [swapContract],
    [Type.SELL]: [
      newContractMsg(token1, {
        send: { amount: amount1, contract: pair, msg: toBase64({ swaps }) },
      }),
    ],
  }[type]

  const messages = !simulating
    ? error
      ? ["Simulation failed"]
      : undefined
    : undefined
    
  const disabled = invalid || simulating || !!messages?.length || !pair || (simulating || loading)

  /* result */
  const parseTx = useSwapReceipt(type, simulated?.price)
  const msgInfo = {
    max: token1
      ? ifNative(token1)
        ? multiple(findBalanceFn(token1), SMALLEST)
        : findBalanceFn(token1)
      : "0",
    value: value1,
    symbol: getTokenSymbol(token1),
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

  const slippageContent = (
    <div className={styles.slippage}>
      <SetManualSlippageTolerance state={slippageState} error={slippageError} />
    </div>
  )

  const swapData = () => {
    if (token1 && token2) {
      const next: Partial<Record<Key, Partial<Values<Key>>>> = {
        [Key.token2]: { token1: token2, token2: token1, value1: "" },
      }
      setValues({ ...values, ...next[Key.token2], value1: "" })
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
    responseFun?.(response, errorResponse)
  }

  const [isAnchorModalOpen, setAnchorModalOpen] = useState(false)
  const toggleConfirmModal = () => setAnchorModalOpen(!isAnchorModalOpen)

  const name = {
    name: "SWAP",
  }

  return (
    <CustomMsgFormContainer
      {...container}
      {...tax}
      title={name}
      label={"SWAP"}
      slippage={slippageContent}
      responseFun={responseFunc}
      poolSwapWidget={poolSwapWidget}
      icon={SWAP_ICON}
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
      showSubmitBtn={!gt(priceImpact, "10")}
      formSubmited={sumbit}
    >
      {isNewDesign ? (
        <FormGroupV2 {...fields[Key.value1]} />
      ) : (
        <FormGroup {...fields[Key.value1]} />
      )}
      <span className={"swapIconContainer"}>
        <img
          src={swapIcon}
          className="swapIcon"
          alt={""}
          onClick={simulating ? () => {} : swapData}
        />
      </span>
      <span style={{ marginTop: "40px" }}>
        <div>
          {isNewDesign ? (
            <FormGroupV2 {...fields[Key.value2]} />
          ) : (
            <FormGroup {...fields[Key.value2]} />
          )}
        </div>
      </span>
      <Modal isOpen={isAnchorModalOpen} onClose={toggleConfirmModal} title={""}>
        {["uusd", aUST_TOKEN].includes(token1) &&
        ["uusd", aUST_TOKEN].includes(token2) ? (
          <UstAustHighPriceImpactModal />
        ) : (
          <HighPriceImpactModal submitForm={() => setSumbit(true)} toggleConfirmModal={toggleConfirmModal} />
        )}
      </Modal>
    </CustomMsgFormContainer>
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
