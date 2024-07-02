import {useEffect, useState} from "react"
import {subDays} from "date-fns"
import {useQuery} from "@apollo/client"
import {
    ASSETPRICE,
    ASSETPRICEAT,
    ASSETPRICEHISTORY,
    ASSETPRICEJunoHISTORY,
    JUNOPRICE,
    JUNOPRICEAT
} from "../statistics/gqldocs"
import {div, gt, lt, number} from "../libs/math"
import {getBlockDifference} from "../services/BlockDiffServices"
import useStatsClient from "../statistics/useStatsClient"
import {calcChange} from "../statistics/useYesterday"
import {PriceChartProps, History} from "./PriceChart"
import poolList from "../forms/Aggregator/poolList.json"

export interface ChartProps extends PriceChartProps {
    range: {interval: number, from: number, label: string, fmt: string},
    now: Date
}

export function getPool(addressFrom, addressTo, routerName) {
    return poolList[routerName].filter(item =>
        JSON.stringify(item.pool_assets).includes(JSON.stringify(addressFrom)) &&
        JSON.stringify(item.pool_assets).includes(JSON.stringify(addressTo)));
}

export const replaceAt = (string,index, replacement) => {
    return string.substring(0, index) + replacement + string.substring(index + replacement.length);
}

export const useNonDirectPairChart = ({pairType = '', token1, token2, range, now}: ChartProps) => {
    const [history1DataAPI, setHistory1DateAPI] = useState<History[]>([])
    const [history2DataAPI, setHistory2DateAPI] = useState<History[]>([])
    const [history1, setHistory1] = useState<History[]>([])
    const [history2, setHistory2] = useState<History[]>([])
    const [oneType, setOneType] = useState('')
    const [twoType, setTwoType] = useState('')
//    const [last1PriceData, setLast1PriceData] = useState<string>()
//    const [last2PriceData, setLast2PriceData] = useState<string>()

    const client = useStatsClient()

    const historyParams = {
        token: token1?.token,
        ...range,
        from: number(replaceAt(range?.from?.toString(),8,'0')),
        to: number(replaceAt(now.getTime()?.toString(),8,'0')),
        second_token: 'ujuno'
    }

    const history2Params = {
        token: token2?.token,
        ...range,
        from: number(replaceAt(range?.from?.toString(),8,'0')),
        to: number(replaceAt(now.getTime()?.toString(),8,'0')),
        second_token: 'ujuno'
    }

    useEffect(()=>{
           let loopPools = getPool(token1?.token, 'ujuno', "loop")
           let junoPools = getPool(token1?.token, 'ujuno', "juno")
           if (loopPools.length > 0) {
               setOneType('loop')
           } else if(junoPools.length > 0){
               setOneType('juno')
           }
    },[token1, token2, pairType])

    useEffect(()=>{
        let loopPools = getPool(token2?.token, 'ujuno', "loop")
        let junoPools = getPool(token2?.token, 'ujuno', "juno")
        if (loopPools.length > 0) {
            setTwoType('loop')
        } else if(junoPools.length > 0){
            setTwoType('juno')
        }
    },[token1, token2, pairType])


    const { refetch: refetch1JunoHistory } = useQuery<any>(
        oneType == 'juno' ? ASSETPRICEJunoHISTORY : ASSETPRICEHISTORY,
        {
            client,
            variables: historyParams,
            skip: pairType?.length > 0,
            onCompleted: (data) => {
                if (data) {
                    const result = oneType == 'juno' ? data?.getJunoHistory ?? [] : data?.getHistory ?? []

                    try {
                        result.length >0 && setHistory1DateAPI(result)
//                        result.length >0 && setLast1PriceData(result[result?.length - 1 ?? -1]?.price)
                    } catch (e) {
//                        setLast1PriceData(undefined)
                    }
                }
            },
        }
    )
    const { refetch: refetch2JunoHistory } = useQuery<any>(
        twoType == 'juno' ? ASSETPRICEJunoHISTORY : ASSETPRICEHISTORY,
        {
            client,
            variables: history2Params,
            skip: pairType?.length > 0,
            onCompleted: (data) => {
                if (data) {
                    const result = twoType == 'juno' ? data?.getJunoHistory ?? [] : data?.getHistory ?? []
                    try {
                        result.length >0 && setHistory2DateAPI(result)
                    } catch (e) {
//                        setLast2PriceData(undefined)
                    }
                }
            },
        }
    )

    useEffect(() => {
        if(pairType?.length <= 0 && history1DataAPI?.length <= 0) {
            refetch1JunoHistory()
            refetch2JunoHistory()
        }
    }, [token1, token2, range, pairType])

    useEffect(() => {

            const interval = setInterval(() => {
                if (pairType?.length <= 0) {
                refetch1JunoHistory()
                refetch2JunoHistory()
                }
        }, 2000)
        return () => {
            clearInterval(interval)
        }
    }, [])

    useEffect(() => {
        if(pairType.length <= 0) {
            if (history1DataAPI?.length > 0 && history2DataAPI?.length > 0) {
                let h1 = history1DataAPI ?? [];
                let h2 = history2DataAPI ?? [];
                if ((history1DataAPI?.length < history2DataAPI?.length)) {
                    h2 = history2DataAPI?.slice(0, history1DataAPI?.length)
                }
                if (history2DataAPI?.length < history1DataAPI?.length) {
                    h1 = history1DataAPI?.slice(0, history2DataAPI?.length)
                }
                setHistory1(h1)
                setHistory2(h2)
            }
        }
    }, [history1DataAPI, history2DataAPI])

    const last1Price = history1[history1?.length - 1 ?? -1]?.price
    const last2Price = history2[history2?.length - 1 ?? -1]?.price

    return {
        lastPrice: div(last1Price, last2Price),
        history: history1.map((item, index) => ({...item, price: div(item?.price, history2?.[index]?.price)}))
    }
}
export const usePriceCharts = ({pairType = '', token1, token2, pair, range, pro, now, pool}:ChartProps) => {
    const [historyDataAPI, setHistoryDateAPI] = useState<History[]>([])
    const [blocksDifference, setBlocksDifference] = useState<number>(0)
    const [priceData, serPriceData] = useState<string>()
    const [lastPriceData, setLastPriceData] = useState<string>()
    const [priceAtData, serPriceAtData] = useState<string>()
    const client = useStatsClient()
    const historyParams = {
        token: token1.token,
        ...range,
        from: number(replaceAt(range?.from?.toString(),8,'0')),
        to: number(replaceAt(now.getTime()?.toString(),8,'0')),
        second_token: token2?.token,
    }
    const priceParams = { token: token1.token, second_token: token2?.token }
    const priceAtParams = {
        token: token1.token,
        second_token: token2?.token ?? "",
        timestamp: subDays(now, 1).getTime(),
    }

    const getBlockData = async () => {
        try {
            const res = await getBlockDifference()
            setBlocksDifference(res?.blocksDifference)
        } catch (e) {
            console.log("error", e)
        }
    }
    const { refetch: refetchHistory } = useQuery<{ getHistory: History[] }>(
        ASSETPRICEHISTORY,
        {
            client,
            variables: historyParams,
            skip: pairType != 'loop' || !token1.token || !token2?.token,
            onCompleted: (data) => {
                if (data) {
                    try {
                        // if(range.interval !== 60) {
                        const result = data?.getHistory
                            ?.filter((item) =>
                            [
                                "juno1qsrercqegvs4ye0yqg93knv73ye5dc3prqwd6jcdcuj8ggp6w0us66deup",
                                "ibc/EAC38D55372F38F1AFD68DF7FE9EF762DCF69F26520643CF3F9D292A738D8034",
                            ].includes(token1.token) &&
                            [
                                "juno1qsrercqegvs4ye0yqg93knv73ye5dc3prqwd6jcdcuj8ggp6w0us66deup",
                                "ibc/EAC38D55372F38F1AFD68DF7FE9EF762DCF69F26520643CF3F9D292A738D8034",
                            ].includes(token2.token)
                                ? gt(item.price, "0.001") && lt(item.price, "0.15")
                                : true
                        )
                        result.length >0 && setHistoryDateAPI(result)
                        result.length >0 && setLastPriceData(result[result?.length - 1 ?? -1]?.price)
                        // }
                    } catch (e) {
                        setLastPriceData(undefined)
                    }
                }
            },
        }
    )
    const { refetch: refetchJunoHistory } = useQuery<{ getJunoHistory: History[] }>(
        ASSETPRICEJunoHISTORY,
        {
            client,
            variables: historyParams,
            skip: pairType != 'juno' && !token1.token || !token2?.token,
            onCompleted: (data) => {
                if (data) {
                    const result = data?.getJunoHistory ?? []
                    try {
                        result.length >0 && setHistoryDateAPI(result)
                        result.length >0 && setLastPriceData(result[result?.length - 1 ?? -1]?.price)

                    } catch (e) {
                        setLastPriceData(undefined)
                    }
                }
            },
        }
    )

    // get price
    const { refetch: refetchPrice } = useQuery<{ getPrice: string }>(ASSETPRICE, {
        client,
        variables: priceParams,
        skip: pairType != 'loop' || !token1.token || !token2?.token,
        onCompleted: (data) => {
            data &&
            [
                "juno1qsrercqegvs4ye0yqg93knv73ye5dc3prqwd6jcdcuj8ggp6w0us66deup",
                "ibc/EAC38D55372F38F1AFD68DF7FE9EF762DCF69F26520643CF3F9D292A738D8034",
            ].includes(token1.token) &&
            [
                "juno1qsrercqegvs4ye0yqg93knv73ye5dc3prqwd6jcdcuj8ggp6w0us66deup",
                "ibc/EAC38D55372F38F1AFD68DF7FE9EF762DCF69F26520643CF3F9D292A738D8034",
            ].includes(token2.token)
                ? serPriceData(
                    gt(data.getPrice, "0.001") && lt(data?.getPrice, "0.15")
                        ? data?.getPrice
                        : "0.043"
                )
                : serPriceData(data?.getPrice)
        },
    })

    const { refetch: refetchJunoPrice } = useQuery<{ getJunoPrice: string }>(JUNOPRICE, {
        client,
        variables: priceParams,
        skip: pairType !== 'juno' || !token1.token || !token2?.token,
        onCompleted: (data) => {
            serPriceData(data?.getJunoPrice)
        },
    })

    // get priceAt
    const { refetch: refetchPriceAt } = useQuery<{ getPriceAt: string }>(
        ASSETPRICEAT,
        {
            client,
            variables: priceAtParams,
            skip: pairType !== 'loop' || !token1.token || !token2?.token,
            onCompleted: (data) => {
                data &&
                [
                    "juno1qsrercqegvs4ye0yqg93knv73ye5dc3prqwd6jcdcuj8ggp6w0us66deup",
                    "ibc/EAC38D55372F38F1AFD68DF7FE9EF762DCF69F26520643CF3F9D292A738D8034",
                ].includes(token1.token) &&
                [
                    "juno1qsrercqegvs4ye0yqg93knv73ye5dc3prqwd6jcdcuj8ggp6w0us66deup",
                    "ibc/EAC38D55372F38F1AFD68DF7FE9EF762DCF69F26520643CF3F9D292A738D8034",
                ].includes(token2.token)
                    ? serPriceAtData(
                        gt(data.getPriceAt, "0.001") && lt(data?.getPriceAt, "0.15")
                            ? data?.getPriceAt
                            : "0.043"
                    )
                    : serPriceAtData(data?.getPriceAt)
                // data && serPriceAtData(data.getPriceAt)
            },
        }
    )

    // get priceAt
    const { refetch: refetchJunoPriceAt } = useQuery<{ getJunoPriceAt: string }>(
        JUNOPRICEAT,
        {
            client,
            variables: priceAtParams,
            skip: pairType !== 'juno' || !token1.token || !token2?.token,
            onCompleted: (data) => {
                serPriceAtData(data?.getJunoPriceAt)
            },
        }
    )

    useEffect(() => {
        if(pairType === 'juno' && historyDataAPI?.length <= 0) {
            refetchJunoHistory()
            refetchJunoPrice()
            refetchJunoPriceAt()
        }
    }, [token1, token2, range, pairType])

    useEffect(() => {
        if(pairType == 'loop' && historyDataAPI?.length <= 0) {
            refetchHistory()
            refetchPrice()
            refetchPriceAt()
        }
    }, [token1, token2, range, pairType])

    useEffect(() => {
        const interval = setInterval(() => {
            if (pairType === 'loop') {

                refetchHistory()
                refetchPrice()
                refetchPriceAt()
            }
            getBlockData()
        }, 2000)
        return () => {
            clearInterval(interval)
        }
    }, [])

    useEffect(() => {
        const interval = setInterval(() => {
            if (pairType == 'juno') {
                refetchJunoHistory()
                refetchJunoPrice()
                refetchJunoPriceAt()
            }
        }, 2000)
        return () => {
            clearInterval(interval)
        }
    }, [])

    /* render */
    const change = calcChange({
        today: priceData ?? "0",
        yesterday: priceAtData ?? "0",
    })

    return {
        blocksDifference,
        history: historyDataAPI,
        price: lastPriceData,
        priceAt: priceAtData,
        change: change
    }
}
