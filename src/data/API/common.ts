
import {atom, atomFamily, selector, selectorFamily, useRecoilValueLoadable, useSetRecoilState} from "recoil"
import { LOOP } from "../../constants"
import { fetchAPIQuery } from "./dashboard"
import {refetchProChart} from "../../state/walletAtoms";
import {useStore, useStoreLoadable} from "../utils/loadable";

export const unitPricesStore = selector({
    key: "unitPricesStore1",
    get: async ({ get }) => {
        const fetchAPIQ = get(fetchAPIQuery)
        return fetchAPIQ({name: 'tokenInfo'})
    }
})

export const loopUnitPrice = selector({
    key: "loopUnitPrice",
    get: async ({ get }) => {
        const prices = get(tokensInfoStore)
        return prices.find((item)=> item?.symbol.toUpperCase() === LOOP)?.unitPrice ?? "0"
    },
})

const LOOPUnitPriceState = atom<any>({
    key: "LOOPUnitPriceState",
    default: '0',
})

export const useLOOPUnitPrice = () => {
    return useStore(loopUnitPrice, LOOPUnitPriceState)
}

export const pairsFactory1 = selector({
    key: "pairsFactory1",
    get: async ({ get }) => {
        const fetchAPIQ = get(fetchAPIQuery)
        return fetchAPIQ({name: 'factoryDetails'})
    },
})

export const pairsFactory2 = selector({
    key: "pairsFactory2",
    get: async ({ get }) => {
        const fetchAPIQ = get(fetchAPIQuery)
        return fetchAPIQ({name: 'factoryDetails'})
    },
})

export const tokensInfoStore = selector({
    key: "tokensInfoStore",
    get: async ({ get }) => {
        const fetchAPIQ = get(fetchAPIQuery)
        return fetchAPIQ({name: 'tokenInfo'})
    },
})

export const findUnitPriceByUSDC = selector({
    key: "findUnitPriceByUSDC",
    get: async ({ get }) => {
        const prices = get(tokensInfoStore)
        return (token: string) => prices.find((item)=> item?.symbol?.toUpperCase() === token || item?.token === token)?.unitPrice ?? "0"
    },
})

export const proDirectChartHistory = selectorFamily({
    key: "proDirectChartHistory",
    get: ({time, token1, token2, pair, interval = 60}: {time: any, token1?: string, token2?: string, pair?: string, interval?: number}) =>  async ({ get }) => {
        if(!time || !token1 || !token2){
            return []
        }
        if(pair){
            return []
        }
        get(refetchProChart)
        const fetchAPIQ = get(fetchAPIQuery)
        const list =  await fetchAPIQ({name: `nonDirectGraphData?startTime=${time}&token1=${token1}&token2=${token2}&interval=${interval}`})
        return list?.joinToken?.content.map((item) => ({timestamp: item.time, price: item.close })) ?? []
    }
})

const proDirectChartHistoryState = atomFamily<any,any>({
    key: "proDirectChartHistoryState",
    default: [],
})

export const useProDirectChart = (props: {time: any, token1?: string, token2?: string, pair?: string, interval?: number}) => {
    return useStore(proDirectChartHistory({...props}), proDirectChartHistoryState({...props}))
}

export const priceHistoryAPI = selectorFamily({
    key: "priceHistoryAPI",
    get: ({ token1, token2, interval =60, pair }:any) => async ({ get }) => {
        if(!token1 || !token2){
            return {};
        }
        const fetchAPIQ = get(fetchAPIQuery)

        const list1 = fetchAPIQ({name: `getPriceHistory?token1=${token1}&token2=${token2}&interval=60`})
        return list1;
        // if(list1 && Object.keys(list1).length > 0)
        // {
        //     return list1
        // }
        // return fetchAPIQ({name: `junoChartsData?token1=${token1}&token2=${token2}`})
    },
})

const priceHistoryAPIState = atomFamily<any,any>({
    key: "priceHistoryAPIState",
    default: {},
})

export const usePriceHistoryAPI = (props: {token1?: string, token2?: string, interval?: number, pair?: string}) => {
    return useStore(priceHistoryAPI({...props}), priceHistoryAPIState({...props}))
}