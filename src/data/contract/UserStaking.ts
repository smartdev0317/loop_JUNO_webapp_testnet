import {atom, selector} from "recoil"
import {protocolQuery} from "./protocol"
import {priceKeyIndexState} from "../app"
import {walletState} from "../../state/walletAtoms"
import {dailyRewardStakedQuery, durationsStakedQuery, loopPowerStakedQuery} from "./staking"
import {useStore} from "../utils/loadable"
import {div, plus, multiple} from "../../libs/math"
import {SMALLEST} from "../../constants"


export const userStakingListState = atom({
    key: "userStakingListState",
    default: [],
})

export const useUserStakingList = () => {
    return useStore(userStakingListQuery, userStakingListState)
}

export const stakedByUserStakedState = atom({
    key: "stakedByUserStakedState",
    default: {},
})

export const useStakedByUserStakedQuery = () => {
    return useStore(stakedByUserStakedQuery, stakedByUserStakedState)
}

export const totalStakedByUserStakedState = atom({
    key: "totalStakedByUserStakedState",
    default: '0',
})

export const useTotaslStakedByUserStaking = () => {
    return useStore(totalStakedByUserStaking, totalStakedByUserStakedState)
}

export const queryTotalStakedByDurationStakingState = atom({
    key: "stakedByUserStakedState",
    default: '0',
})

export const useTotalStakedByDurationStaking = () => {
    return useStore(queryTotalStakedByDurationStaking, queryTotalStakedByDurationStakingState)
}

export const userGlobalStakingList = atom({
    key: "userGlobalStakingList",
    default: [],
})

export const useUserGlobalStakingList = () => {
    return useStore(userGloblStakingList, userGlobalStakingList)
}

export const userGloblStakingList = selector({
    key: "userGloblStakingList",
    get: async ({get}) => {
        get(priceKeyIndexState)
        const list = await get(durationsStakedQuery)
        if (!list) {
            return []
        }
        const userLoopPowerList = await get(userLoopPowerStakedQuery)
        const userRewardList = await get(userRewardStakedQuery)
        const stakedByUserStakedList = await get(stakedByUserStakedQuery)
        let data = {}
        await Promise.allSettled(list?.map(async (duration) => {
            const userReward = plus(userRewardList[duration]?.user_reward ?? "0", userRewardList[duration]?.pending_reward ?? "0").toString() ?? "0"
            data[duration] = {
                duration,
                userLoopPower: userLoopPowerList[duration] ?? "0",
                userReward,
                potentialMaxLoopPower: div(plus(userReward, multiple(stakedByUserStakedList[duration], duration)), SMALLEST)
            }
        }))
        return data
    }
})

export const userStakingListQuery = selector({
    key: "userStakingListQuery",
    get: async ({get}) => {
        get(priceKeyIndexState)
        const list = await get(durationsStakedQuery)
        if (!list) {
            return []
        }
        const stakedByUserList = await get(stakedByUserStakedQuery)
        const userRewardList = await get(userRewardStakedQuery)
        const userStakedTimeList = await get(userStakedTimeQuery)
        const userLoopPowerList = await get(userLoopPowerStakedQuery)
        const dailyRewards = get(dailyRewardStakedQuery)
        const loopPowerList = await get(loopPowerStakedQuery)
        const totalLoopPower: string = Object.values(loopPowerList)?.reduce((acc: string, item: { balance: string }) => plus(acc, item.balance), '0') as string
        const perLoopoReward = div(div(dailyRewards, SMALLEST), div(totalLoopPower, SMALLEST))
        let data = {}
        await Promise.allSettled(list?.map(async (duration) => {
            data[duration] = {
                duration,
                stakedByUser: stakedByUserList[duration] ?? "0",
                userReward: plus(userRewardList[duration]?.user_reward ?? "0", userRewardList[duration]?.pending_reward ?? "0").toString() ?? "0",
                userRewardWithoutPending: userRewardList[duration]?.user_reward ?? "0",
                userStakedTime: userStakedTimeList[duration] ?? "0",
                userLoopPower: userLoopPowerList[duration] ?? "0",
                perLoopoReward: perLoopoReward
            }
        }))
        return data
    },
})

export const userLoopPowerStakedQuery = selector({
    key: "userLoopPowerStakedQuery",
    get: async ({get}) => {
        get(priceKeyIndexState)
        const {contracts} = get(protocolQuery)
        const durations = get(durationsStakedQuery)
        const {address, client} = get(walletState)
        if (!client) {
            return
        }
        try {
            let list = {};
            await Promise.allSettled(durations?.map(async (duration) => {
                    const data = await client.queryContractSmart(
                        contracts['staking'] ?? "",
                        {
                            balance_by_duration: {
                                address: address,
                                duration: duration,
                            }
                        })
                    list[duration] = data
                }
            ))
            return list
        } catch (error) {
            console.error('loopPowerStakedQuery ' + error)
            return {}
        }
    }
})

export const userStakedTimeQuery = selector({
    key: "userStakedTimeQuery",
    get: async ({get}) => {
        get(priceKeyIndexState)
        const {contracts} = get(protocolQuery)
        const durations = get(durationsStakedQuery)
        const {address, client} = get(walletState)
        if (!client) {
            return
        }
        try {
            let list = {};
            await Promise.allSettled(durations?.map(async (duration) => {
                    const data = await client.queryContractSmart(
                        contracts['staking'] ?? "",
                        {
                            query_user_staked_time: {
                                wallet: address,
                                duration: duration,
                            }
                        })
                    list[duration] = data
                }
            ))
            return list
        } catch (error) {
            console.error('userStakedTimeQuery ' + error)
            return {}
        }
    }
})

export const userRewardStakedQuery = selector({
    key: "userRewardStakedQuery",
    get: async ({get}) => {
        get(priceKeyIndexState)
        const {contracts} = get(protocolQuery)
        const durations = get(durationsStakedQuery)
        const {address, client} = get(walletState)
        if (!client) {
            return
        }
        try {
            let list = {};
            await Promise.allSettled(durations?.map(async (duration) => {
                    const data = await client.queryContractSmart(
                        contracts['staking'] ?? "",
                        {
                            query_user_reward: {
                                wallet: address,
                                duration: duration,
                            }
                        })
                    list[duration] = data
                }
            ))
            return list
        } catch (error) {
            console.error('userRewardStakedQuery ' + error)
            return {}
        }
    }
})

export const totalStakedByUserStaking = selector({
    key: "totalStakedByUserStaking",
    get: async ({get}) => {
        const list = get(stakedByUserStakedQuery)
        const data = Object?.keys(list).map((item) => list[item])
        return data?.reduce((acc, item) => plus(acc, item), '0')
    }
})

export const stakedByUserStakedQuery = selector({
    key: "stakedByUserStakedQuery",
    get: async ({get}) => {
        get(priceKeyIndexState)
        const {contracts} = get(protocolQuery)
        const durations = get(durationsStakedQuery)
        const {address, client} = get(walletState)
        if (!client) {
            return
        }
        try {
            let list = {};
            await Promise.allSettled(durations?.map(async (duration) => {
                    const data = await client.queryContractSmart(
                        contracts['staking'] ?? "",
                        {
                            query_staked_by_user: {
                                wallet: address,
                                duration: duration,
                            }
                        })
                    list[duration] = data
                }
            ))
            return list
        } catch (error) {
            console.error('stakedByUserStakedQuery ' + error)
            return {}
        }
    }
})

export const queryTotalStakedByDurationStaking = selector({
    key: "queryTotalStakedByDurationStaking",
    get: async ({get}) => {
        get(priceKeyIndexState)
        const {contracts} = get(protocolQuery)
        const durations = get(durationsStakedQuery)
        const {client} = get(walletState)
        if (!client) {
            return
        }
        try {
            let list = {};
            await Promise.allSettled(durations?.map(async (duration) => {
                    const data = await client.queryContractSmart(
                        contracts['staking'] ?? "",
                        {
                            query_total_staked_by_duration: {
                                duration: duration,
                            }
                        })
                    list[duration] = data
                }
            ))
            const data = await durations?.map((duration) => (list?.[duration]))
            return data.reduce((acc, item) => plus(acc, item), '0')
        } catch (error) {
            console.error('queryTotalStakedByDurationStaking ' + error)
            return '0'
        }
    }
})