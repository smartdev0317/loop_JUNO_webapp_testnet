// 👇️ ts-nocheck disables type checking for entire file
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

// 👇️ ts-ignore ignores any ts errors on the next line
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

import {useEffect, useMemo, useState} from "react"
import classNames from "classnames/bind"
import {div, gt, multiple, lt} from "../../../libs/math"
import {Config} from "../../useSelectAsset"
import Asset from "../../Asset"
import styles from "./Assets.module.scss"
import {lookupAmount, lookupSymbol} from "../../../libs/parse"
import {LOOP, SMALLEST, USDC} from "../../../constants"
import {AssetBalanceKey} from "../../../hooks/contractKeys"
import {useFindTokenDetails} from "../../../data/form/select"
import {CONTRACT} from "../../../hooks/useTradeAssets"
import {useFindBalance} from "../../../data/contract/normalize"
import search from "../../../images/new_search_icon.svg"
import {changedIcons} from "../../../routes"
import {useFindPairPoolPrice} from "../../../data/contract/info"
import {insertIf} from "../../../libs/utils"
import {bound} from "components/Boundary"
interface AssetItem {
    symbol: string
    tokenSymbol: string
    tokenName: string
    token: string
    name: string
    price?: string
    balance?: string
    pair: string
    lp: string
    noPair?: boolean
    logoURL?: string
}

const cx = classNames.bind(styles)

interface Props extends Config {
    selected?: string
    onSelect: (token: string, symbol?: string) => void
    onSelectAsPair: (token1: { token: string, tokenSymbol?: string }, token2?: { token: string, tokenSymbol?: string }, pair: string) => void
    otherToken?: string
    selectedToken?: string
    formatPairToken?: boolean
    formatTokenName?: (symbol: string) => string
    showAsPairs?: boolean
    balanceType?: AssetBalanceKey
    listed: CONTRACT[]
    pairsListed: any[]
    /** Exclude symbol in the list */
    skip?: string[]
    showQuickTokens?: boolean
    showBalance?: boolean
    showSearch?: boolean
    orderBy?: boolean
}

const ProAssets = ({
                       showAsPairs,
                       selected,
                       onSelect,
                       onSelectAsPair,
                       otherToken,
                       selectedToken,
                       listed,
                       pairsListed,
                       skip,
                       showQuickTokens,
                       showBalance,
                       showSearch,
                       orderBy,
                       ...props
                   }: Props) => {
    const {balanceType = AssetBalanceKey.BALANCE} = props
    const {dim, formatTokenName, formatPairToken} = props

    const findPairPoolPriceFn = useFindPairPoolPrice()
    const findBalanceFn = useFindBalance()
    const findTokenDetailFn = useFindTokenDetails()

    const [lists, setLists] = useState<AssetItem[]>([])
    const [pairsLists, setPairsLists] = useState<AssetItem[]>([])
    const [value, setValue] = useState("")
    const [quick, setQuick] = useState([])
    const [quickSecondList, setQuickSecondList] = useState([])

    const getItem = async ({
                               denom,
                               tokenSymbol,
                               tokenName,
                               lp,
                               pair,
                               token,
                               secondToken,
                               decimals,
                               isNative: isNativeToken,
                               noPair,
                               logoURI,
                           }: {
        contract_addr: string
        denom?: string
        tokenSymbol: string
        tokenName: string
        pair: string
        lp: string
        token: string
        secondToken?: string
        decimals?: number
        isNative: boolean
        noPair?: boolean
        logoURI?: string
    }) => {
        const otherTokenDetail = findTokenDetailFn(secondToken)

        const balance = {
            [AssetBalanceKey.BALANCE]:
                tokenSymbol && isNativeToken
                    ? lookupAmount(multiple(findBalanceFn(token), SMALLEST)) ?? "0"
                    : lookupAmount(findBalanceFn(token), decimals ?? 6),
            [AssetBalanceKey.LP]: div(findBalanceFn(lp) ?? "0", SMALLEST),
        }[balanceType]
        const symbolToken = formatPairToken
            ? `${lookupSymbol(tokenSymbol)}-${
                otherTokenDetail ? lookupSymbol(otherTokenDetail.tokenSymbol) : ""
            }`
            : lookupSymbol(tokenSymbol)

        const price = findPairPoolPriceFn?.(pair ?? "", token) ?? "0"

        return {
            noPair,
            logoURI,
            symbol: symbolToken,
            tokenSymbol,
            tokenName,
            name: formatPairToken ? "" : tokenName ?? "",
            token: formatPairToken ? lp : token,
            secondToken: secondToken ?? '',
            pair,
            lp,
            price: formatPairToken
                ? "0"
                : denom !== undefined
                    ? denom
                    : otherToken === undefined
                        ? pair
                            ? price
                            : ""
                        : "",
            balance: showAsPairs ? '-' : noPair ? "0" : balance ? balance : "0",
            balanceSymbol: {
                [AssetBalanceKey.BALANCE]: undefined,
                [AssetBalanceKey.LP]: "LP",
            }[balanceType],
        }
    }

    useMemo(() => {
        listed
            .filter((item) => !skip?.includes(item.token))
            .map(getItem)
            .map(async (item) => {
                const li = await item
                const exist = await lists.find((item) => item.token === li.token)

                if (!exist) {
                    setLists((old) => [
                        ...old.filter((item) => item.token !== li.token),
                        li,
                    ])
                }
            })
    }, [listed])


    useMemo(() => {
        pairsListed
            //        .filter((item) => !skip?.includes(item.token))
            .map(getItem)
            .map(async (item) => {
                const li = await item
                const exist = await lists.find((item) => item.tokenName === li.tokenName)

                if (!exist) {
                    setPairsLists((old) => [
                        ...old.filter((item) => item.tokenName !== li.tokenName),
                        li,
                    ])
                }
            })
    }, [pairsListed])
    const loading = false
//  const pageName = window.location.pathname
//  const isPoolPage = pageName === "/pool"


    const finalList = lists.filter(({symbol, name}) =>
        // search result
        [symbol, name].some((text) =>
            text.toLowerCase().includes(value.toLowerCase())
        )
    )

    const finalPairsList = pairsLists.filter(({symbol, name}) =>
        // search result
        [symbol, name].some((text) =>
            text.toLowerCase().includes(value.toLowerCase())
        )
    )

    const sortedList = orderBy
        ? finalList.sort(function (a, b) {
            if (a.symbol < b.symbol) {
                return -1
            }
            if (a.symbol > b.symbol) {
                return 1
            }
            return 0
        })
        : finalList
            .sort(
                (
                    {token: a, balance: aBalance},
                    {token: b, balance: bBalance}
                ) => {
                    const hasA = aBalance && gt(aBalance, "0") ? 1 : 0
                    const hasB = bBalance && gt(bBalance, "0") ? 1 : 0
                    return hasB - hasA
                }
            )
            .sort((a, b) =>
                lt(a.balance ? a.balance : 0, b.balance ? b.balance : 0) ? 1 : -1
            )
    const sortedPairsList = orderBy
        ? finalPairsList.sort(function (a, b) {
            if (a.symbol < b.symbol) {
                return -1
            }
            if (a.symbol > b.symbol) {
                return 1
            }
            return 0
        })
        : finalPairsList
            .sort(
                (
                    {token: a, balance: aBalance},
                    {token: b, balance: bBalance}
                ) => {
                    const hasA = aBalance && gt(aBalance, "0") ? 1 : 0
                    const hasB = bBalance && gt(bBalance, "0") ? 1 : 0
                    return hasB - hasA
                }
            )
            .sort((a, b) =>
                lt(a.balance ? a.balance : 0, b.balance ? b.balance : 0) ? 1 : -1
            )

    useEffect(() => {
        setQuick(
            [USDC.toUpperCase(), "JUNO", LOOP, "ATOM"]
                .map((item) => {
                    return lists?.find(
                        ({tokenSymbol}) =>
                            tokenSymbol?.toUpperCase() === item.toUpperCase()
                    )
                })
                .filter((item) => item)
        )
        setQuickSecondList(
            [LOOP, "JUNO", USDC.toUpperCase(), "ATOM"]
                .map((item) => {
                    return lists?.find(
                        ({tokenSymbol}) =>
                            tokenSymbol?.toUpperCase() === item.toUpperCase()
                    )
                })
                .filter((item) => item)
        )
    }, [lists])
    return (
        <div>
            <div className={styles.component}>
                {showSearch && (
                    <div className="AssetSearching">
                        <input
                            type="text"
                            autoFocus={window.innerWidth > 900}
                            placeholder={"Search"}
                            onChange={(e) => setValue(e.target.value)}
                            autoComplete="off"
                        />
                        <button>
                            <img src={search} alt={""}/>
                        </button>
                    </div>
                )}
                {!showAsPairs && showQuickTokens && (
                    <div className="assetsValue">
                        {!otherToken
                            ? quick.map((item) => {
                                return (
                                    <span onClick={() => onSelect(item.token, item.pair)}>
                      {changedIcons[item?.tokenSymbol.toUpperCase()] && (
                          <img
                              height={"20"}
                              width={"20"}
                              src={
                                  changedIcons[item.tokenSymbol.toUpperCase()] ?? ""
                              }
                          />
                      )}
                                        <b className={styles.quick_title}>
                        {lookupSymbol(item?.symbol)}
                      </b>
                    </span>
                                )
                            })
                            : quickSecondList.map((item) => {
                                return (
                                    <span onClick={() => onSelect(item.token, item.pair)}>
                      {changedIcons[item?.tokenSymbol.toUpperCase()] && (
                          <img
                              height={"20"}
                              width={"20"}
                              src={
                                  changedIcons[item.tokenSymbol.toUpperCase()] ?? ""
                              }
                          />
                      )}
                                        <b className={styles.quick_title}>
                        {lookupSymbol(item?.symbol)}
                      </b>
                    </span>
                                )
                            })}
                        {/*{lists
            .filter(({tokenSymbol}) =>
               !otherToken ? [USDC.toUpperCase(), ...insertIf(isPoolPage,'JUNO'), ...insertIf(isPoolPage,LOOP)].includes(
                tokenSymbol?.toUpperCase()
            ) :  [LOOP,...insertIf(isPoolPage,'JUNO'), USDC.toUpperCase()].includes(
                    tokenSymbol?.toUpperCase()
                )
            )
            .map((item) => {
              return (
                  <span onClick={() => onSelect(item.token, item.pair)}>
                {changedIcons[item?.tokenSymbol.toUpperCase()] && (
                    <img
                        height={"20"}
                        width={"20"}
                        src={changedIcons[item.tokenSymbol.toUpperCase()] ?? ""}
                    />
                )}
                    <b className={styles.quick_title}>{lookupSymbol(item.symbol)}</b>
              </span>
              )
            })}*/}

                        {/* {
            showQuickTokens && lists
                .filter(
                    ({tokenSymbol}) =>
                        ![
                          LOOP.toUpperCase(),
                          UUSD.toUpperCase(),
                          UST.toUpperCase(),
                          JUNOX.toUpperCase(),
                        ].includes(tokenSymbol.toUpperCase()) &&
                        [LOOPR, AUST, ULUNA, BLUNA, ANC, LUNA].includes(tokenSymbol.toUpperCase())
                )
                .map((item) => {
                  return (
                      <span onClick={() => onSelect(item.token, item.pair)}>
                  {changedIcons[item.tokenSymbol.toUpperCase()] && (
                      <img
                          height={"20"}
                          width={"20"}
                          src={changedIcons[item.tokenSymbol.toUpperCase()] ?? ""}
                      />
                  )}
                        <b className={styles.quick_title}>{lookupSymbol(item.symbol)}</b>
                </span>
                  )
                })} */}
                    </div>
                )}

                <ul className={classNames(styles.list, styles.scrollbar, {loading})}>
                    {
                        bound([...insertIf(!showAsPairs, ...sortedList), ...insertIf(showAsPairs, ...sortedPairsList)].map((item, index) => {
                            //@ts-ignore
                            const {token, pair, noPair, tokenSymbol, symbol, secondToken} = item
                            const tokenSymbols = showAsPairs ? tokenSymbol?.split('-') : []
                            const isSelected = token === selected
                            const isDimmed = dim?.(token)
                            return (
                                <li key={`${token}~${index}`}>
                                    <button
                                        type="button"
                                        className={cx(styles.button, styles.assetsBtn, {
                                            selected: isSelected,
                                            dim: isDimmed,
                                        })}
                                        onClick={() => (noPair ? {} : showAsPairs ? onSelectAsPair({
                                            token,
                                            tokenSymbol: tokenSymbols?.[0]
                                        }, {
                                            token: secondToken,
                                            tokenSymbol: tokenSymbols?.[1]
                                        }, pair) : onSelect(token, pair))}
                                    >
                                        <Asset
                                            {...item}
                                            symbol={symbol}
                                            showAsPairs={showAsPairs}
                                            tokenSymbol={tokenSymbol ?? ''}
                                            formatTokenName={formatTokenName}
                                            formatPairToken={formatPairToken}
                                            balanceType={balanceType}
                                            showBalance={showBalance}
                                            noPair={noPair}
                                        />
                                    </button>
                                </li>
                            )
                        }))}
                </ul>
            </div>
        </div>
    )
}

export default ProAssets
