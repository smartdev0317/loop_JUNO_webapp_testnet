import {  selector, atom } from "recoil"
import {useStore} from "../utils/loadable"
import { apiURLQuery } from "../network"
import { fetchAPI } from "../../libs/fetchApi"
import {priceKeyIndexState, tokenInfoKeyIndexState} from "../app"
import { multiple } from "libs/math"
import {startOfMinute,format as formatDate, subWeeks, subMonths} from "date-fns"

export const FACTORY2_LP_FOR_TRADING = [
    'terra10mkke9qfhdjgkaq32sjd3ll9ccscjd03xn9gc9'
]

export const unitPricesStore = selector({
    key: "unitPricesStore",
    get: async ({ get }) => {
        const fetchAPIQ = get(fetchAPIQuery)
        return fetchAPIQ({name: 'tokenInfo'})
    },
})

export const unitPriceByKeys = selector({
    key: "unitPriceByKeys",
    get: async ({ get }) => {
        const unitPrices = get(unitPricesStore)
        return unitPrices?.reduce((acc,item)=>({...acc, [item.token]: item}),{})
    },
})

const unitPriceByKeysState = atom<{[key: string]: any} | undefined>({
    key: "unitPriceByKeysState",
    default: {},
  })
  
  export const useUnitPrices = () => {
    return useStore(unitPriceByKeys, unitPriceByKeysState)
  }

export const tradingListStore = selector({
    key: "tradingListStore",
    get: async ({ get }) => {
        get(priceKeyIndexState)
        const allPairs = get(tradingListAllPairsStore)
        const filterList = allPairs//.filter((item) => !FACTORY2_LP_FOR_TRADING.includes(item.lpToken))
        return filterList && filterList.length > 0 ? filterList : []
    },
})

export const farmingList = selector({
    key: "farminglist",
    get: async ({ get }) => {
        const allPairs = get(tradingListAllPairsStore)
        const filterList = allPairs.filter((item) => item.isInPool)
        return filterList && filterList.length > 0 ? filterList : []
    },
})

export const farmingLPList = selector({
    key: "farmingLPList",
    get: async ({ get }) => {
        const allPairs = get(farmingList)
        const filterList = allPairs.map(({lpToken}) => (lpToken))
        return filterList && filterList.length > 0 ? filterList : []
    },
})

export const tradingListFactory4Store = selector({
    key: "tradingListFactory4Store",
    get: async ({ get }) => {
        const allPairs = get(tradingListAllPairsStore)
        const filterList = allPairs.filter((item) => FACTORY2_LP_FOR_TRADING.includes(item.lpToken))
        return filterList && filterList.length > 0 ? filterList : []
    },
})

export const tradingListAllPairsStore = selector({
    key: "tradingListAllPairsStore",
    get: async ({ get }) => {
        get(priceKeyIndexState)
        const fetchAPIQ = get(fetchAPIQuery)
        return fetchAPIQ({name: 'tradingData'})
    },
})

export const factory2Pairs = selector({
    key: "factory2Pairs",
    get: async ({ get }) => {
        const fetchAPIQ = get(fetchAPIQuery)
        return fetchAPIQ({name: 'factory2Pairs'})
    },
})


export const cardsStore = selector({
    key: "cardsStore",
    get: async ({ get }) => {
        const fetchAPIQ = get(fetchAPIQuery)
        return fetchAPIQ({name: 'dashboardCard'})
    },
})

export const cardsData = selector({
    key: "cardsStore",
    get: async ({ get }) => {
        const fetchAPIQ = get(fetchAPIQuery)
        return fetchAPIQ({name: 'cardsData'})
    },
})

export const stakingStore = selector({
    key: "stakingStore",
    get: async ({ get }) => {
        const fetchAPIQ = get(fetchAPIQuery)
        return fetchAPIQ({name: 'stakingData'})
    },
})

export const junoStakingStore = selector({
    key: "junoStakingStore",
    get: async ({ get }) => {
        const fetchAPIQ = get(fetchAPIQuery)
        return fetchAPIQ({name: 'stakingData'})
    },
})

/* native */
export const fetchAPIQuery = selector({
    key: "fetchAPIQuery",
    get: ({ get }) => {
        const url = get(apiURLQuery)
        return async({ name }: { name: string}) => await fetchAPI(`${url}/v1/juno/` + name)
    },
})

export const aggAPIQuery = selector({
    key: "aggAPIQuery",
    get: ({ get }) => {
        const url = 'https://testbombay.loop.onl/agg_vol/'
        return async({ name }: { name: string}) => await fetchAPI(url+ name)
    },
})

export const statsStore = selector({
    key: "statsStore",
    get: async ({ get }) => {
        get(priceKeyIndexState)
        const fetchAPIQ = get(fetchAPIQuery)
        return fetchAPIQ({name: 'statsData'})
    },
})

export const tokensInfo = selector({
    key: "tokensInfo",
    get: async ({ get }) => {
        get(priceKeyIndexState)
        const fetchAPIQ = get(fetchAPIQuery)
        return fetchAPIQ({name: 'tokenInfo'})
    },
})

export const tokensInfoForLoop = selector({
    key: "tokensInfoForLoop",
    get: async ({ get }) => {
        get(priceKeyIndexState)
        get(tokenInfoKeyIndexState)
        const fetchAPIQ = get(fetchAPIQuery)
        return fetchAPIQ({name: 'tokenInfo'})
    },
})

export const recordAggTx = selector({
    key: "recordAggTx",
    get: async ({ get }) => {
        get(priceKeyIndexState)
        get(tokenInfoKeyIndexState)
        const aggAPIQ = get(aggAPIQuery)
        const info = await get(tokensInfo)
        return (input: { amount: string, token: string,txhash:string }, swaps: string='1') => {
            const perTokenPrice = info.find((item)=> item.token === input.token)?.unitPrice
            const volume = multiple(input.amount, perTokenPrice ?? '1')
            return aggAPIQ({name: `recordSwapButton?swaps=${swaps}&volume=${volume}&txhash=${input.txhash}`})
        }
    }
})
export const dailyAggregatorVolTx = selector({
    key: "dailyAggregatorVolTx",
    get: async ({ get }) => {
        get(priceKeyIndexState)
        get(tokenInfoKeyIndexState)
        const aggAPIQ = get(aggAPIQuery)
        const from = formatDate(new Date(), "yyyy-MM-dd")
        return aggAPIQ({name: `getVolumeSwapsDayRange?fromDay=${from}&toDay=${from}`})
    }
})

export const weeklyAggregatorVolTx = selector({
    key: "weeklyAggregatorVolTx",
    get: async ({ get }) => {
        get(priceKeyIndexState)
        get(tokenInfoKeyIndexState)
        const aggAPIQ = get(aggAPIQuery)
        const now = startOfMinute(new Date())
        const from = formatDate(new Date(subWeeks(now, 1).getTime()), "yyyy-MM-dd")
        return aggAPIQ({name: `getVolumeSwapsSinceDate?fromDay=${from}`})
    }
})

export const monthlyAggregatorVolTx = selector({
    key: "monthlyAggregatorVolTx",
    get: async ({ get }) => {
        get(priceKeyIndexState)
        get(tokenInfoKeyIndexState)
        const aggAPIQ = get(aggAPIQuery)
        const now = startOfMinute(new Date())
        const from = formatDate(new Date(subMonths(now, 3).getTime()), "yyyy-MM-dd")
        const to = formatDate(new Date(now), "yyyy-MM-dd")
        return aggAPIQ({name: `getVolumeSwapsSinceDateList?fromDay=${from}&toDay=${to}`})
    }
})

export const totalVolumeAggregator = selector({
    key: "totalVolumeAggregator",
    get: async ({ get }) => {
        get(priceKeyIndexState)
        get(tokenInfoKeyIndexState)
        const aggAPIQ = get(aggAPIQuery)
        return aggAPIQ({name: `totalVolume`})
    }
})

export const aggregatorVolTx = selector({
    key: "aggregatorVolTx",
    get: async ({ get }) => {
        get(priceKeyIndexState)
        get(tokenInfoKeyIndexState)
        const daily = get(dailyAggregatorVolTx)
        const weekly = get(weeklyAggregatorVolTx)
        const monthly = get(monthlyAggregatorVolTx)
        const totalVolume = get(totalVolumeAggregator)

        return {
            daily: daily?.[0] ?? {},
            weekly: weekly?.[0] ?? {},
            monthlyList: monthly ?? [],
            totalVolume: totalVolume?.[0]?.total
        }
    }
})

export const aggregatorVolTxState = atom({
    key: "aggregatorVolTxState",
    default: {
        weekly: { totalSwaps: '0', totalVolume: '0' },
        daily: { totalSwaps: '0', totalVolume: '0' },
        monthlyList: [],
        totalVolume: "0"
    },
})

export const useAggregatorVolTx = () => {
    return useStore(aggregatorVolTx, aggregatorVolTxState)
}

