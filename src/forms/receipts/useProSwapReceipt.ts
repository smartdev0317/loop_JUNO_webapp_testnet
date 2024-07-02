import { div } from "../../libs/math"
import { decimal, lookupSymbol } from "../../libs/parse"
import { Type } from "../../pages/Exchange"
import {
  findValue,
  getJunoTokenPrice,
  getJunoTokenSymbol,
} from "./receiptProSwapHelpers"
import { useRecoilValue } from "recoil"
import { useTokenMethods } from "../../data/contract/info"
import { tokensInfoStore } from "../../data/API/common"
import { SMALLEST } from "../../constants"
import poolList from "../Aggregator/poolList.json"
import tokensList from "../Aggregator/mainnet-tokens.json"
import { useFindTokenDetails } from "../../data/form/select"
import AddToKeplr from "../../components/Static/AddToKeplr"

export default (type: Type, simulatedPrice?: string) => (logs: any) => {
  const { check8decOper } = useTokenMethods()
  const val = findValue(logs)

  let firstMsg = 0
  let lastMsg = logs.length - 1

  if (val("action", firstMsg) === "increase_allowance") {
    firstMsg = 1
  }

  let loopLpAddresses = poolList.juno.map((pool) => pool.swap_address)
  let firstIsJunoLp = false
  for (let i = 0; i < loopLpAddresses.length; i++) {
    if (
      JSON.stringify(
        logs[firstMsg]?.events.find((e) => e.type === "wasm") ?? ""
      ).includes(loopLpAddresses[i])
    ) {
      firstIsJunoLp = true
    }
  }
  let lastIsJunoLp = false
  for (let i = 0; i < loopLpAddresses.length; i++) {
    if (
      JSON.stringify(
        logs[lastMsg]?.events.find((e) => e.type === "wasm") ?? ""
      ).includes(loopLpAddresses[i])
    ) {
      lastIsJunoLp = true
    }
  }
  let offer
  let offerAsset
  let rtn
  let rtnAsset
  let spread
  let commission

  if (!firstIsJunoLp) {
    offer = val("offer_amount", firstMsg)
    offerAsset = val("offer_asset", firstMsg)
    if (firstMsg === lastMsg) {
      spread = val("spread_amount", 0)
      commission = val("commission_amount", 0)
    }
  } else {
    offer = val("native_sold", firstMsg)
    offerAsset =
      firstMsg === 0
        ? logs[firstMsg]?.events
            .find((e) => e.type === "coin_spent")
            .attributes[1]?.value.replace(offer, "")
        : val("_contract_address", 0)
  }

  if (!lastIsJunoLp) {
    rtn = val("return_amount", lastMsg)
    rtnAsset = val("ask_asset", lastMsg)
  } else {
    rtn = val("token_bought", lastMsg)
    rtnAsset =
      val("action", lastMsg) === "transfer"
        ? logs[lastMsg]?.events.find((e) => e.type === "execute").attributes[
            logs[lastMsg]?.events.find((e) => e.type === "execute").attributes
              .length - 1
          ]?.value
        : logs[lastMsg]?.events
            .find((e) => e.type === "coin_spent")
            .attributes[
              logs[lastMsg]?.events.find((e) => e.type === "coin_spent")
                .attributes.length - 1
            ]?.value.replace(rtn, "")
  }
  const findTokenDetailFn = useFindTokenDetails(true)
  const offerAssetDetail = findTokenDetailFn(offerAsset)
  const rtnAssetDetail = findTokenDetailFn(rtnAsset)

  let tokensInfo = useRecoilValue(tokensInfoStore)

  tokensInfo = tokensInfo.concat(
    tokensList.map((item) => {
      return {
        token: item.tokenAddress,
        name: item.name,
        symbol: item.symbol,
        decimals: +item.decimals,
      }
    })
  )

  const boughtTokenSymbol = getJunoTokenSymbol(rtnAsset, tokensInfo)
  const offerTokenSymbol = getJunoTokenSymbol(offerAsset, tokensInfo)
  const price = (
    (offer / rtn) *
    10 ** (rtnAssetDetail?.decimals - offerAssetDetail?.decimals)
  ).toString()
  const boughtTokenUnitPrice = getJunoTokenPrice(rtnAsset, tokensInfo)

  /* contents */
  const priceContents = {
    [Type.SWAP]: {
      title: `Price per ${lookupSymbol(boughtTokenSymbol)}`,
      content: `${
        +price > 0.1 ? decimal(price, 2) : decimal(price, 6)
      } ${lookupSymbol(offerTokenSymbol)}`,
      boughtTokenUnitPrice: boughtTokenUnitPrice,
    },
    [Type.SELL]: {
      title: `Price per ${lookupSymbol(offerTokenSymbol)}`,
      content: `${decimal(price, 2)} ${lookupSymbol(boughtTokenSymbol)}`,
      boughtTokenUnitPrice: boughtTokenUnitPrice,
    },
  }[type]

  const rtnContents = {
    title: { [Type.SWAP]: "Bought", [Type.SELL]: "Earned" }[type],
    content: `${(
      rtn /
      10 ** rtnAssetDetail?.decimals
    ).toString()} ${lookupSymbol(boughtTokenSymbol)}`,
    children: [
      { title: "Spread", content: spread },
      { title: "Commission", content: commission },
    ],
  }
  const offerContents = {
    title: { [Type.SWAP]: "Paid", [Type.SELL]: "Sold" }[type],
    content: `${(
      offer /
      10 ** offerAssetDetail?.decimals
    ).toString()} ${lookupSymbol(offerTokenSymbol)}`,
    offerAmount: check8decOper(offerAsset)
      ? div(offer, "100000000")
      : div(offer, SMALLEST),
    offerSymbol: offerTokenSymbol,
  }

  return {
    [Type.SWAP]: [priceContents, rtnContents, offerContents],
    [Type.SELL]: [priceContents, offerContents, rtnContents],
  }[type]
}
