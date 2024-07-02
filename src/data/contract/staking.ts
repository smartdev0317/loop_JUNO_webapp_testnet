import {atom, atomFamily, selector, selectorFamily} from "recoil"

import {protocolQuery} from "./protocol"
import {priceKeyIndexState} from "data/app"
import {walletState} from "state/walletAtoms"
import power_3 from "images/icons/30x_power.svg"
import {div, gt, minus, multiple, number, plus, pow} from "libs/math"
import {LOOP_addr, SMALLEST} from "../../constants"
import {LoopPriceQuery} from "./normalize"
import {useStore} from "../utils/loadable"
import { getContractQueryQuery } from "../utils/query"
import {stakedByUserStakedQuery, userLoopPowerStakedQuery} from "./UserStaking"
import {getTokenBalances} from "./juno_queries"
import {decimal} from "libs/parse"

export const stakeConfigQuery = selector({
    key: "stakeConfigQuery",
    get: async ({ get }) => {
        get(priceKeyIndexState)
        const { contracts } = get(protocolQuery)
        const { client } = get(walletState)
        if (!client) {
            return
        }
        try {
            return await client.queryContractSmart(
                contracts['staking'] ?? "",
                { query_config: {} })
        } catch (error) {
            console.error('stakeConfigQuery '+ error)
            return []
        }
    },
})
export const durationsStakedQuery = selector({
    key: "durationsStakedQuery",
    get: async ({ get }) => {
        get(priceKeyIndexState)
        try {
            const data =  get(stakeConfigQuery)
            return data?.duration_values_vector.filter((item)=> [1,3,6,12].includes(item)) ?? []
        } catch (error) {
            console.error('durationsStakedQuery '+ error)
            return []
        }
    },
})


export const stakingListQueryState = atom({
    key: "stakingListQueryState",
    default: [],
})

export const useStakingList = () => {
    return useStore(stakingListQuery, stakingListQueryState)
}

export const stakingListQuery = selector({
    key: "stakingListQuery",
    get: async ({ get }) => {
        get(priceKeyIndexState)
        const stakeConfig = await get(stakeConfigQuery)
        const list = await get(durationsStakedQuery)
        if(!list){
            return []
        }
        const loopPowerList = await get(loopPowerStakedQuery)
        const totalLockedList = await get(totalLockedStakedQuery)
        const apyStakedList = await get(apyStaked)
        const dailyRewards = get(dailyRewardStakedQuery)
        const stakedByUserList = await get(stakedByUserStakedQuery)
        const userLoopPowerList = await get(userLoopPowerStakedQuery)

        return Promise.all(list?.map(async (duration)=>{
            const {
                potentialRewardsPerYearInUST,
                potentialRewardsPerYear,
                potentialLoopPower,
                perLoopoReward,
                compoundingRewardPerYearInLoop,
                compoundingRewardPerYearInDolar
            } = await get(potentialRewardsFunc({apy:apyStakedList[duration]?.stakingAPY,dailyRewards,duration, userLoopPower: userLoopPowerList[duration] ?? '0' }))

            return {
                ...stakeConfig,
                duration,
                title: `${duration} Month${gt(duration, 1) ? 's' : ''}`,
                totalLocked: totalLockedList[duration] ?? '0',
                loopPower: loopPowerList[duration]?.balance ?? '0',
                potentialLoopPower,
                stakedByUser: stakedByUserList[duration] ?? "0",
                powerIcon: power_3,
                deposited: "0",
                apy: apyStakedList[duration]?.stakingAPY,
                apr:apyStakedList[duration]?.stakingApr,
                dailyRewards,
                potentialRewardsPerYear,
                potentialRewardsPerYearInUST,
                compoundingRewardPerYearInLoop,
                compoundingRewardPerYearInDolar,
                perLoopoReward
            }
        }))
    },
})

const potentialRewardsFuncState = atomFamily<any, any>({
    key: "calculateAPYParamsState",
    default: '0',
})

export const usePotentialRewardsFunc = (props: any) => {
    return useStore(potentialRewardsFunc({...props}), calculateAPYParamsState({...props}))
}

export const potentialRewardsFunc = selectorFamily({
    key: "potentialRewardsFunc",
    get: ({duration, userLoopPower,apy}:any) => async ({ get }) => {
        get(priceKeyIndexState)
        const dailyRewards = get(dailyRewardStakedQuery)
        const loopPowerList = await get(loopPowerStakedQuery)
        const getTokenBalance = await get(getTokenBalances)
        const loopUnitPrice = await get(LoopPriceQuery)
        try{
            const loopBalance = div(getTokenBalance[LOOP_addr], SMALLEST)
            const totalLoopPower: string = Object.values(loopPowerList)?.reduce((acc:string,item:{balance: string})=> plus(acc, item.balance), '0') as string
            const perLoopoReward = div(div(dailyRewards,SMALLEST), div(totalLoopPower, SMALLEST))
            const potentialLoopPower = multiple(loopBalance ?? '0', duration ?? 1)
            const potentialRewardsPerYear = multiple(multiple(perLoopoReward, potentialLoopPower ?? '0'), '365')
            const potentialRewardsPerYearInUST = multiple(potentialRewardsPerYear, loopUnitPrice ?? '1')
            const xInLoop = div(gt(apy, "5000") ? "5000" : apy, "100")
            const yInLoop = multiple(potentialRewardsPerYear, xInLoop)
            const compoundingRewardPerYearInLoop = plus(potentialRewardsPerYear, yInLoop)
            const xInDollar = div(gt(apy, "5000") ? "5000" : apy, "100")
            const yInDollar = multiple(potentialRewardsPerYearInUST, xInDollar)
            const compoundingRewardPerYearInDolar = plus(potentialRewardsPerYearInUST, yInDollar)

            return {
                perLoopoReward,
                potentialLoopPower,
                potentialRewardsPerYear,
                potentialRewardsPerYearInUST,
                compoundingRewardPerYearInLoop,
                compoundingRewardPerYearInDolar
            }
        }catch (e){
            return {
                perLoopoReward: '0',
                potentialLoopPower :'0',
                potentialRewardsPerYear: '0',
                potentialRewardsPerYearInUST: '0'
            }
        }
    }
})

export const calculateAPYParams = selectorFamily({
    key: "calculateAPYParams",
    get: ({totalLocked, loopUnitPrice, duration}:any) => async ({ get }) => {
        get(priceKeyIndexState)
        const calculateAPY = get(calculateAPYFunc)
        return calculateAPY.apy({totalLocked, loopUnitPrice, duration})
    }
})

const calculateAPYParamsState = atomFamily<any, any>({
    key: "calculateAPYParamsState",
    default: '0',
})

export const useCalculateAPYParams = (props: any) => {
    return useStore(calculateAPYParams({...props}), calculateAPYParamsState({...props}))
}

export const calculateAPYFunc = selector({
    key: "calculateAPYFunc",
    get: async ({ get }) => {
        const stakeConfig = get(stakeConfigQuery)
        const dailyRewards = get(dailyRewardStakedQuery)
        const loopPowerList = await get(loopPowerStakedQuery)
        if(!stakeConfig){
            return {
                apy: (...params) :any => {}
            }
        }
        function apy({totalLocked, loopUnitPrice, duration}): any {
            const totalLoopPower: string = Object.values(loopPowerList)?.reduce((acc:string,item:{balance: string})=> plus(acc, item.balance), '0') as string
            const perLoopoReward = div(div(dailyRewards,SMALLEST), div(totalLoopPower, SMALLEST))
            const tokensDistributedPerDay = multiple(perLoopoReward, loopPowerList[duration]?.balance)
            const total_staked = totalLocked
            const lockTime = multiple(stakeConfig?.lock_time_frame, duration)
            const lastDisTime = multiple(stakeConfig?.last_distributed, duration)
            const waitTime = multiple(stakeConfig?.wait_time_for_distribution_in_seconds, duration)
            const dailyRewardsInUSDC = multiple(div(tokensDistributedPerDay, SMALLEST), loopUnitPrice)
            const tvlInUSDC = multiple(div(total_staked, SMALLEST), loopUnitPrice)
            const stakingAPR = decimal(multiple( div(dailyRewardsInUSDC, tvlInUSDC), '365'), 6)
            const stakingAPY = decimal(minus(pow(plus(div(stakingAPR, '365'), '1'), '365'), '1'), 6)
            return {
                duration,
                stakingApr: isNaN(number(stakingAPR)) ? "0" : multiple(stakingAPR, '100'),
                stakingAPY: isNaN(number(stakingAPY)) ? "0" : multiple(stakingAPY, '100'),
                total_staked: total_staked,
                tokensDistributedPerDay: tokensDistributedPerDay,
                lockTime: lockTime,
                lastDisTime: lastDisTime,
                waitTime: waitTime,
            }
        }
        return {
            apy
        }
    }
})
export const apyStaked = selector({
    key: "apyStaked",
    get: async ({ get }) => {
        get(priceKeyIndexState)
        const { client } = get(walletState)
        if (!client) {
            return
        }
        const durations = get(durationsStakedQuery)
        const dailyRewards = get(dailyRewardStakedQuery)
        const totalLockedList = await get(totalLockedStakedQuery)
        const loopUnitPrice = await get(LoopPriceQuery)
        const calculateAPY = get(calculateAPYFunc)

        try {
            const data = await durations?.map((duration) => calculateAPY.apy(
                {
                    dailyRewards,
                    totalLocked: totalLockedList[duration],
                    loopUnitPrice,duration
                }))
            return data.reduce((acc, item) => ({...acc, [item.duration]: item}),{})
        } catch (error) {
            console.error('apyStaked '+ error)
            return 0
        }
    },
})

export const dailyRewardStakedQuery = selector({
    key: "dailyRewardStakedQuery",
    get: async ({ get }) => {
        get(priceKeyIndexState)
        const { contracts } = get(protocolQuery)
        const { client } = get(walletState)
        if (!client) {
            return
        }
        try {
            return await client.queryContractSmart(
                contracts['staking'] ?? "",
                { query_total_daily_reward: {} })
        } catch (error) {
            console.error('dailyRewardStakedQuery '+ error)
            return 0
        }
    },
})

export const loopPowerStakedQuery = selector({
    key: "loopPowerStakedQuery",
    get: async ({ get }) => {
        get(priceKeyIndexState)
        const { contracts } = get(protocolQuery)
        const durations  = get(durationsStakedQuery)
        const { client } = get(walletState)
        if (!client) {
            return
        }
        try {
            let list = {};
            await Promise.all(durations?.map(async (duration) => {
                    const data = await client.queryContractSmart(
                        contracts['staking'] ?? "",
                        {
                            total_balance: {
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


export const totalLockedStakedQuery = selector({
    key: "totalLockedStakedQuery",
    get: async ({ get }) => {
        get(priceKeyIndexState)
        const { contracts } = get(protocolQuery)
        const durations  = get(durationsStakedQuery)
        const { client } = get(walletState)
        if (!client) {
            return
        }
        try {
            let list = {};
            await Promise.all(durations?.map(async (duration) => {
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
            return list
        } catch (error) {
            console.error('totalLockedStakedQuery ' + error)
            return {}
        }
    }
})
/*
export const userStakedTimeStakedQuery = selector({
    key: "userStakedTimeStakedQuery",
    get: async ({ get }) => {
        get(priceKeyIndexState)
        const { contracts } = get(protocolQuery)
        const { address, client } = get(walletState)
        if (!client) {
            return
        }
        try {
            const month3 = await client.queryContractSmart(
                contracts[STAKING.Month3] ?? "",
                { query_user_staked_time: { wallet: address} })
            const month6 = await client.queryContractSmart(
                contracts[STAKING.Month6] ?? "",
                { query_user_staked_time: { wallet: address} })

            return {
                [STAKING.Month3]: month3,
                [STAKING.Month6]: month6,
            }
        } catch (error) {
            console.error('userStakedTimeStakedQuery '+ error)
            return error
        }
    },
})*/
/*
export const userDepositedQuery = selector({
    key: "userDepositedQuery",
    get: async ({ get }) => {
        get(priceKeyIndexState)
        const { contracts } = get(protocolQuery)
        const { address, client } = get(walletState)
        if (!client) {
            return
        }
        try {
            const month3 = await client.queryContractSmart(
                contracts[STAKING.Month3] ?? "",
                { query_staked_by_user: { wallet: address } })
            const month6 = await client.queryContractSmart(
                contracts[STAKING.Month6] ?? "",
                { query_staked_by_user: { wallet: address } })

            return {
                [STAKING.Month3]: month3,
                [STAKING.Month6]: month6
            }
        } catch (error) {
            console.error('userDepositedQuery '+ error)
            return error
        }
    },
})*/
/*
export const stakedByUserStakeQuery = selector({
    key: "stakedByUserStakeQuery",
    get: async ({ get }) => {
        get(priceKeyIndexState)
        const { contracts } = get(protocolQuery)
        const { address, client } = get(walletState)
        if (!client) {
            return
        }
        try {
            const month3 = await client.queryContractSmart(
                contracts[STAKING.Month3] ?? "",
                { query_staked_by_user: { wallet: address } })
            const month6 = await client.queryContractSmart(
                contracts[STAKING.Month6] ?? "",
                { query_staked_by_user: { wallet: address } })

            return {
                [STAKING.Month3]: month3,
                [STAKING.Month6]: month6
            }
        } catch (error) {
            console.error('stakedByUserStakeQuery '+ error)
            return error
        }
    },
})*/

export const getTotalStakedForStakingQuery = selector({
  key: "getTotalStakedForStakingQuery",
  get: async ({ get }) => {
      get(priceKeyIndexState)
    const { contracts } = get(protocolQuery)
    const getContractQuery = get(getContractQueryQuery)
    return await getContractQuery<string | undefined>(
        {
          contract: contracts["loop_staking"],
          msg: { query_total_staked:{} },
        },
        "getTotalStakedForStakingQuery"
    )
  },
})

// total accumulated reward
export const totalRewardForStakingQuery = selector({
    key: "totalRewardForStakingQuery",
    get: async ({ get }) => {
        get(priceKeyIndexState)
        const { contracts } = get(protocolQuery)
        const getContractQuery = get(getContractQueryQuery)
        return await getContractQuery<string | undefined>(
            {
                contract: contracts["loop_staking"],
                msg: { query_total_reward: {} },
            },
            "totalRewardForStakingQuery"
        )
    },
})
