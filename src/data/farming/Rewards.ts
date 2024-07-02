import {atom, atomFamily, selector, selectorFamily, useRecoilValue} from "recoil"
import {consoleSandbox} from "@sentry/utils"
import {protocolQuery} from "../contract/protocol"
import {walletState} from "../../state/walletAtoms"
import {LOOP_addr, SGNL_addr, SEASY_addr, SMALLEST} from '../../constants'
import {div, minus, plus} from "libs/math"
import {useStore} from "../utils/loadable";
import {DistributableTokensByPool, FarmContractTYpe, queryListOfDistributableTokensByPoolFarm2} from "./FarmV2";
import {unitPriceByKeys, unitPricesStore} from "../API/dashboard";
import {decimal, numbers} from "../../libs/parse";

export const getStakeableInfoListPools = selector({
    key: "getStakeableInfoListPools",
    get: async ({get}) => {
        const {contracts} = get(protocolQuery)

        const {client} = get(walletState)
        if (!client) {
            return []
        }
        try {
            return await client.queryContractSmart(
                contracts["loop_farm_staking"] ?? "",
                {
                    query_stakeable_info: {limit: 30},
                }
            )
        } catch (error) {
            return error
        }
    },
})

const getAdminRewardsInfoListState = atom<{ [key:string]: { expectedHours: string, title: string, reward: string, remainingRewards: string}}>({
    key: "getAdminRewardsInfoListState",
    default: {}
})

export const useAdminRewardsInfoList = () => {
    return useStore(getAdminRewardsInfoList, getAdminRewardsInfoListState)
}

export const getAdminRewardsInfoList = selector<{ [key:string]: { expectedHours: string, title: string, reward: string, remainingRewards: string}}>({
    key: "getAdminRewardsInfoList",
    get: async ({get}) => {
        const list = await get(getStakeableInfoListPools)
        try {
            const parsed = list?.map(({distribution}) => {
                const val = distribution.map(({token, amount}) => {
                    return {
                        token: token,
                        amount
                    }
                })
                return val?.flat()
            })?.flat()
            const tokens = parsed?.reduce((acc, item) => ({
                ...acc,
                [item.token]: plus(acc[item.token], item.amount)
            }), {})
            const rewardsList = Object.entries(tokens)?.map(([key, reward]: any) => {
                const stakeableInfo = get(getStakeAbleInfoByTokens)
                const unitPrices = get(unitPriceByKeys)
                const tokenDetail = unitPrices[key]
                const rewards = get(getDistributeableBalanceOfToken(key))
                const rem = div(minus(rewards, stakeableInfo[key]), SMALLEST)

                return {
                    title: tokenDetail.symbol,
                    token: key,
                    reward,
                    stakableInfo: stakeableInfo[key],
                    remainingRewards: numbers(rem),
                    expectedHours: decimal(
                        div(rem, div(reward, SMALLEST)),
                        0
                    )
                }
            })
            return rewardsList?.reduce((acc, item) => ({...acc, [item.token]: item}), {})
        } catch (error) {
            return error
        }
    }
})

export const getDistributeableBalanceOfToken = selectorFamily({
    key: "getDistributeableBalanceOfToken",
    get:
        (token_addr: any) =>
            async ({get}) => {
                const {contracts} = get(protocolQuery)

                const {client} = get(walletState)
                if (!client) {
                    return {}
                }
                try {
                    const data = await client.queryContractSmart(
                        contracts["loop_farm_staking"] ?? "",
                        {
                            query_get_distributeable_token_balance: {
                                dist_token_addr: token_addr,
                            },
                        }
                    )
                    return data
                } catch (error) {
                    return error
                }
            },
})


export const getStakeAbleTokensInfo = selector({
    key: "getStakeAbleTokensInfo",
    get: async ({get}) => {
        const {contracts} = get(protocolQuery)

        const {address, client} = get(walletState)
        if (!client) {
            return []
        }
        try {
            const data = await client.queryContractSmart(
                contracts["loop_farm_staking"] ?? "",
                {
                    query_stakeable_info: {},
                }
            )
            return data
        } catch (error) {
            return []
        }
    },
})

export const getStakeAbleInfoByTokens = selector({
    key: "getStakeAbleInfoByTokens",
    get: async ({get}) => {
        const list = get(getStakeAbleTokensInfo)
        try {
            let data = {
                [LOOP_addr]: 0,
                [SGNL_addr]: 0,
                [SEASY_addr]: 0,
            }
            const distributions = list.map((item) => item.distribution)
            distributions.flat().map((item) => {
                data[item.token] = plus(data[item.token], item.reserve_amount)
            })
            return data
        } catch (error) {
            return {}
        }
    }
})


export const getTotalRewardInContractStaking = selector({
    key: "getTotalRewardInContractStaking",
    get: async ({get}) => {
        const {contracts} = get(protocolQuery)

        const {address, client} = get(walletState)
        if (!client) {
            return 0
        }
        try {
            const data = await client.queryContractSmart(
                contracts["staking"] ?? "",
                {
                    query_total_reward_in_contract: {},
                }
            )
            return data
        } catch (error) {
            return 0
        }
    },
})

export const getTotalDailyRewardStaking = selector({
    key: "getTotalDailyRewardStaking",
    get: async ({get}) => {
        const {contracts} = get(protocolQuery)

        const {address, client} = get(walletState)
        if (!client) {
            return 0
        }
        try {
            const data = await client.queryContractSmart(
                contracts["staking"] ?? "",
                {
                    query_total_daily_reward: {},
                }
            )
            return data
        } catch (error) {
            return 0
        }
    },
})

export const getTotalRewardStaking = selector({
    key: "getTotalRewardStaking",
    get: async ({get}) => {
        const {contracts} = get(protocolQuery)

        const {address, client} = get(walletState)
        if (!client) {
            return 0
        }
        try {
            const data = await client.queryContractSmart(
                contracts["staking"] ?? "",
                {
                    query_total_reward: {},
                }
            )
            return data
        } catch (error) {
            return 0
        }
    },
})