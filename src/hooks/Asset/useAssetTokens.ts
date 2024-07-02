import {useGetTokenList} from "../../data/form/select"
import {CONTRACT} from "../useTradeAssets"
import {useContractsList} from "../../data/contract/normalize"
import {SelectType} from "../../forms/Exchange/useSelectSwapAsset"
import {junoSwapTokens} from "../../junoSwapTokens"
import { insertIf } from "../../libs/utils"

export const skipedPairs = [
  'terra1kw95x0l3qw5y7jw3j0h3fy83y56rj68wd8w7rc',
  'terra12aazc56hv7aj2fcvmhuxve0l4pmayhpn794m0p',
  'terra1lgazu0ltsxm3ayellqa2mhnhlvgx3hevkqeqy2',
  'terra1jfp5ew4tsru98wthajsqegtzaxt49ty4z2qws0',
  'terra1whns5nyc8sw328uw3qqnyafxd5yfqsytkdkgqz',
  'terra1jkr0ef9fpghdru38ht70ds6jfldprgttw6xlek',
  'terra1fgc8tmys2kxzyl39k3gtgw9dlxxuhlqux7k38e',
  'terra1l60336rkawujnwk7lgfq5u0s684r99p3y8hx65',
  'terra1a26j00ywq0llvms707hqycwlkl9erwhacr6jve'
]
export const skipPair = [
  'terra154jt8ppucvvakvqa5fyfjdflsu6v83j4ckjfq3'
]
export const skipLp = [
  'terra1p266mp7ahnrnuxnxqxfhf4rejcqe2lmjsy6tuq'
]

// skip pluna-ust cluna-ust prism-ust yluna-ust
export const skipPairs = [
  'terra1np5jr05v08vjk5f665qu5xjxak8dyxnswtujn6',
  'terra13qkgx03lu38p49yefnw7sr7xyy0k0ngamr8p2u',
  'terra1wznq6n5rw2jlyh274l0pmkq6chqfx5qqaduwwn',
  'terra1n6rn6cn8a3rqad8v2mth3u3qwgq9styt84wv4u'
]

const filterPairs = (contract: CONTRACT) => {
  return !skipPairs.includes(contract.pair)
}
 const temporaryJunoSwapTokens=junoSwapTokens
/**
 * get asset tokens for select box
 * @param secondToken
 * @param asPairs
 * @param selectType
 * @param newFactory
 * @param newFactoryV2
 * @param factoryType
 */
const useAssetTokens = (secondToken?: string | undefined, asPairs: boolean | undefined = false, selectType?: SelectType, newFactory: boolean = false, newFactoryV2:boolean = false, factoryType: number = 0 ): CONTRACT[] => {
  const { contents: contracts } = useContractsList()

  const tokenList = useGetTokenList()
  const list = tokenList(asPairs ? 'pair' : 'token')
   const pageName = window.location.pathname
  const hideNotListedPairs = pageName === '/pool'
  const proSwapPage = pageName === '/pro-swap'
  if (!secondToken) {
   
    const items = list.filter((contract: CONTRACT) => {
      return selectType ? !skipedPairs.includes(contract.pair) : true
    })
    const LPs =  items.map((item)=> item.pair)
    const tokens =  items.map((item)=> item.token)
    const notDirectPair = temporaryJunoSwapTokens.filter((item)=> !LPs?.includes(item.pair) && !tokens?.includes(item.token)).map((item) => ({...item, noPair: !proSwapPage, token: item.tokenSymbol, symbol: item.tokenSymbol}))
    return [...items,...insertIf(hideNotListedPairs ? false : !asPairs ,...notDirectPair)]
  } else {
    
    const items =contracts && contracts?.filter((contract: CONTRACT) => {
      return (contract.secondToken === secondToken && (selectType ? !skipedPairs.includes(contract.pair) : true))
    })
    const LPs =  items.map((item)=> item.pair)
    const tokens =  items.map((item)=> item.token)
    const notDirectPair = [...temporaryJunoSwapTokens].filter((item)=> !LPs?.includes(item.pair) && !tokens?.includes(item.token)).map((item) => ({...item, noPair: !proSwapPage, token: item.tokenSymbol, symbol: item.tokenSymbol}))

    //@ts-ignore
    return [...items, ...insertIf(hideNotListedPairs ? false : !asPairs,...notDirectPair)].filter(filterPairs)
  }
}

export default useAssetTokens
