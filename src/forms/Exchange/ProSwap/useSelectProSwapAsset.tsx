import {useEffect, useState} from "react"
import {
    PriceKey,
    BalanceKey,
    AssetBalanceKey,
} from "../../../hooks/contractKeys"
import poolList from '../../Aggregator/poolList.json'
//import Assets from "../Assets"
import {useTokenMethods} from "../../../data/contract/info"
import rawTokensList from "../../Aggregator/mainnet-tokens.json"
import {CONTRACT} from "../../../hooks/useTradeAssets"
import ProAssets from "./ProAssets"
import SelectProAsset from "./SelectProAssetButton"
//import styles from "./SelectProAsset.module.scss"
import {Modal} from "components"

export interface Config {
    /** Current value */
    token: string
    /** Current symbol */
    symbol?: string
    /** first token value */
    otherToken?: string
    /** Function to call when a value is selected */
    onSelect: (asset: string, pair: string | undefined) => void
    onSelectAsPair: (token1: { token: string, tokenSymbol?: string }, token2: { token: string, tokenSymbol?: string }, pair: string) => void
    /** Key of price to show from data */
    priceKey?: PriceKey
    /** Key of balance to show from data */
    balanceKey?: BalanceKey
    /** Include UST in the list */
    useUST?: boolean
    /** Exclude symbol in the list */
    skip?: string[]
    /** Modify token name */
    formatTokenName?: (symbol: string) => string
    formatPairToken?: boolean
    /** Condition to be dimmed */
    dim?: (token: string) => boolean
    shouldClose?: boolean
    showAsPairs?: boolean
    smScreen?: boolean
    balanceType?: AssetBalanceKey
    showQuickTokens?: boolean
    showBalance?: boolean
    showSearch?: boolean
    type?: SelectType
    vertical?: boolean
    newFactory?: boolean
    orderBy?: boolean
    color?: any
    disabled?: boolean
    newFactoryV2?: boolean
    tokenIndex: number
    factoryType?: number
    modalTitle?: string
}

export enum SelectType {
    "SWAP" = "SWAP",
    "POOL" = "POOL",
}

export default (config: Config) => {
    const {
        token,
        symbol,
        onSelect,
        onSelectAsPair,
        otherToken,
        shouldClose,
        showAsPairs,
        smScreen,
        skip,
        type,
        newFactory,
        vertical = false,
        showQuickTokens = true,
        showBalance = true,
        showSearch = true,
        orderBy = false,
        newFactoryV2 = false,
        color,
        balanceType = AssetBalanceKey.BALANCE,
        disabled = false,
        factoryType = 0,
        tokenIndex,
        modalTitle
    } = config
    const {getSymbol} = useTokenMethods()
    const [isOpen, setIsOpen] = useState(false)
    const toggle = () => {
        isOpen ? handleSelect(token, symbol ?? "") : setIsOpen(!isOpen)
    }
    const [tokenSymbol, setTokenSymbol] = useState("")
    const [selectedToken, setSelectedToken] = useState("")
    const [isChanged, setIsChanged] = useState(false)
    // const listed = useAssetTokens(otherToken, showAsPairs, type, newFactory, newFactoryV2, factoryType)

    const tokenList: CONTRACT[] = rawTokensList.map((item) => {
        return {
            token: item.tokenAddress,
            pair: "",
            lp: "",
            denom: item.denom,
            isNative: item.native,
            contract_addr: item.tokenAddress,
            tokenSymbol: item.symbol,
            tokenName: item.name,
            decimals: +item.decimals ?? 6,
            secondToken: "",
        }
    })

    const listedPlus = [...tokenList]

    function getPool(addressFrom, addressTo, routerName) {
        return poolList[routerName].filter(item =>
            JSON.stringify(item.pool_assets).includes(JSON.stringify(addressFrom)) &&
            JSON.stringify(item.pool_assets).includes(JSON.stringify(addressTo)));
    }

    const tokenListAsPairs: any[] = !showAsPairs ? [] : rawTokensList.map((item, index) => {
        return rawTokensList.map((li, ind) => {
            let pair = ''
            let loopPools = getPool(item.tokenAddress, li.tokenAddress, "loop")
            let junoPools = getPool(item.tokenAddress, li.tokenAddress, "juno")
            let wyndPools = getPool(item.tokenAddress, li.tokenAddress, "wynd")
            if (loopPools.length > 0) {
                pair = loopPools[0].swap_address
            } else if (junoPools.length > 0) {
                pair = junoPools[0].swap_address
            }
            else if (wyndPools.length>0){
                pair=wyndPools[0].swap_address
            }

            return index === ind ? {} : {
                token: item.tokenAddress,
                pair: pair,
                lp: "",
                denom: item.denom,
                isNative: item.native,
                contract_addr: item.tokenAddress,
                tokenSymbol: `${item.symbol}-${li.symbol}`,
                tokenName: `${item.name}-${li.name}`,
                decimals: +item.decimals ?? 6,
                secondToken: li.tokenAddress
            }
        })
    })

    const listedPlusPairs = [...tokenListAsPairs.flat()]?.filter((item) => item.token)

    useEffect(() => {
        !isChanged &&
        setTokenSymbol(
            symbol
                ? symbol
                : listedPlus.filter((item) => item.token === token)[0]?.tokenSymbol
        )
        !isChanged && setSelectedToken(token)
    }, [symbol, token, getSymbol, isChanged])

    function resetIsChanged() {
        setIsChanged(false)
        setIsOpen(false)
    }

    /* select asset */
    const handleSelect = (token: string, pair?: string) => {
        onSelect(token, pair ?? undefined)
        setIsOpen(false)
        // setTokenSymbol(symbol ? symbol : getSymbol(symbol))
        setSelectedToken(token)
        setIsChanged(true)
        // If it is not reset it will not set again.
        resetIsChanged()
    }

    const select = {
        ...config,
        isOpen,
        color,
        symbol: shouldClose ? "" : symbol,
        onClick: toggle,
    }
    useEffect(() => {
        if (
            (shouldClose !== undefined || (token && token.length < 0)) &&
            otherToken !== undefined &&
            shouldClose
        ) {
            setIsOpen(false)
        }
    }, [shouldClose, token, otherToken])
    return {
        tokenSymbol,
        resetIsChanged,
        isOpen,
        button: (
            <SelectProAsset
                disabled={disabled}
                vertical={vertical}
                smScreen={smScreen}
                {...select}
            />
        ),
        assets: isOpen ? (
            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title={modalTitle}
                className="tokenModal"
                titleClass="tokenModalTitleClass"
                bodyClassName="tokenModalBodyClass"
                closeOnClickOutside={true}
                children={
                    <ProAssets
                        {...config}
                        listed={listedPlus}
                        pairsListed={listedPlusPairs}
                        otherToken={otherToken}
                        selected={
                            shouldClose !== undefined && shouldClose ? "" : token ?? ""
                        }
                        onSelect={handleSelect}
                        onSelectAsPair={onSelectAsPair}
                        showAsPairs={showAsPairs}
                        selectedToken={
                            shouldClose !== undefined && shouldClose ? "" : selectedToken
                        }
                        balanceType={balanceType}
                        showBalance={showBalance}
                        skip={skip}
                        showQuickTokens={showQuickTokens}
                        showSearch={showSearch}
                        orderBy={orderBy}
                    />
                }
            />
        ) : undefined,
    }
}
