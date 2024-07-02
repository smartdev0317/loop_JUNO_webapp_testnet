import { div, multiple } from "../../libs/math"
import {
  adjustAmount,
  decimal,
  formatAsset,
  isNative,
} from "../../libs/parse"
import { Type } from "../../pages/Exchange"
import { findValue, getJunoTokenSymbol } from "./receiptHelpers"
import { useRecoilValue } from "recoil"
import { useTokenMethods } from "../../data/contract/info"
import { findLpTokenInfo } from "../../data/contract/normalize"
import { useProtocol } from "../../data/contract/protocol"
import { tokensInfoStore } from "../../data/API/common"
import { SMALLEST, USDC_addr } from "../../constants"
import { insertIf } from "../../libs/utils"

export default (type: Type, simulatedPrice?: string, pro: boolean = false) => (logs: any) => {
  const getTokenSymbol = useRecoilValue(findLpTokenInfo)
  const { ibcList } = useProtocol()
  // const { getSymbol } = useTokenMethods()
  const { check8decOper } = useTokenMethods()
  // const [loading, setLoading] = useState(true)
  // const [boughtToken, setBoughtToken] = useState<any>("")

  const val = findValue(logs)
  // const attribute = logs[0]?.events.find((e) => e.type === "wasm")?.attributes

  const offer = val("offer_amount", 0)
  const offerAsset = val("offer_asset", 0)
  const rtn = val("return_amount", 0)
  const rtnAsset = val("ask_asset", 0)
  const spread = div(val("spread_amount", 0), SMALLEST)
  const commission = div(val("commission_amount", 0), SMALLEST)

  const tokensInfo = useRecoilValue(tokensInfoStore)

  const boughtTokenSymboltest = getJunoTokenSymbol(rtnAsset, tokensInfo)
  const boughtTokenSymbol =
    boughtTokenSymboltest === "ujuno" ? "JUNO" : boughtTokenSymboltest
  const offerTokenSymboltest = getJunoTokenSymbol(offerAsset, tokensInfo)
  const offerTokenSymbol =
    offerTokenSymboltest === "ujuno" ? "JUNO" : offerTokenSymboltest

  // const rtnSymbol = lookupSymbol(boughtTokenInfo?.symbol)
  // const offerSymbol = getTokenSymbol(offerAsset)?.symbol ?? ""

  const offerTokenUnitPrice = tokensInfo.find(
    (item) => item.token === offerAsset
  )?.unitPrice

  const boughtTokenUnitPrice = tokensInfo.find(
    (item) => item.token === rtnAsset
  )?.unitPrice


  const price = div(offer, rtn)

  // const slippage = minus(div(price, simulatedPrice), 1)

  /* contents */
  const priceContents = {
    [Type.SWAP]: pro  ? {} : {
      title: `Price per ${boughtTokenSymbol}`,
      content: `${decimal(price, 4)} ${offerTokenSymbol}`,
      // `${format(check8decOper(offerAsset) ? adjustAmount(true, true, price) :  price)}`,
      children: [
        ...insertIf(rtnAsset !== USDC_addr && offerAsset !== USDC_addr, {
          title: `Price per ${boughtTokenSymbol} in Dollars`,
          content: `$${decimal(multiple(price, offerTokenUnitPrice), 3)}`,
        }),
        { title: "Slippage", content: "-" },
      ],
      boughtTokenUnitPrice:boughtTokenUnitPrice || 1
    },
    [Type.SELL]: pro  ? {} : {
      title: `Price per ${offerTokenSymbol}`,
      content: `${decimal(price, 2)} ${boughtTokenSymbol}`,
      children: [{ title: "Slippage", content: "-" }],
    }
  }[type]

  const rtnContents = pro ? {} : {
    title: { [Type.SWAP]: "Bought", [Type.SELL]: "Earned" }[type],
    content: `${div(rtn, SMALLEST)} ${boughtTokenSymbol}`,
    children: [
      { title: "Spread", content: spread },
      { title: "Commission", content: commission },
    ],
  }

  const offerIBC = ibcList[offerAsset] ? ibcList[offerAsset].symbol : ""

  const offerContents = pro ? {} : {
    title: { [Type.SWAP]: "Paid", [Type.SELL]: "Sold" }[type],
    content: formatAsset(
      check8decOper(offerAsset) ? adjustAmount(true, true, offer) : offer,
      isNative(offerAsset) ? offerIBC ?? offerAsset : offerIBC ?? ""
    ),
    offerAmount: check8decOper(offerAsset)
      ? div(offer, "100000000")
      : div(offer, SMALLEST),
    offerSymbol: isNative(offerAsset)
      ? offerAsset
      : offerIBC
      ? offerIBC
      : getTokenSymbol(offerAsset)?.symbol ?? "",
  }

  return {
    [Type.SWAP]: [priceContents, rtnContents, offerContents],
    [Type.SELL]: [priceContents, offerContents, rtnContents],
  }[type]
}
