import { GAUGE_ADDRESS } from "../../constants"
import { priceKeyIndexState } from "data/app"
import { useStore } from "data/utils/loadable"
import { atom, selector } from "recoil"
import { walletState } from "state/walletAtoms"
import { protocolQuery } from "./protocol"
import { div, lte, minus, multiple, number, plus } from "libs/math"
import { useEffect, useMemo, useState } from "react"
import { intervalToDuration } from "date-fns"
import { decimal } from "../../libs/parse"

export const getProposalDetailGuage = selector({
  key: "getProposalDetailGuage",
  get: async ({ get }) => {
    get(priceKeyIndexState)
    const { client } = get(walletState)
    if (!client) {
      return
    }
    try {
      const data: any = await client.queryContractSmart(GAUGE_ADDRESS ?? "", {
        proposal: {
          proposal_id: 1,
        },
      })
      return data ?? {}
    } catch (error) {
      console.log("error", error)
      return error
    }
  },
})

const getProposalsGuageState = atom<any>({
  key: "getProposalsGuageState",
  default: {},
})

export const useGetProposalDetails = () => {
  return useStore(getProposalDetailGuage, getProposalsGuageState)
}

export const useGetNextEpochTime = () => {
  const { contents, isLoading } = useGetProposalDetails()
  const [currentTime] = useState(decimal(div(Date.now(), 1000), 0))
  const [timeStr, setTimeStr] = useState("-")
  const atTime = decimal(
    div(contents?.proposal?.expiration?.at_time, 1000000000),
    0
  )

  useMemo(() => getTime(), [contents, currentTime])

  function getTime() {
    if (!isLoading && Object.keys(contents).length > 0) {
      const remainingTime = minus(atTime, currentTime)
      const time = intervalToDuration({
        start: 0,
        end: number(multiple(remainingTime, 1000)),
      })
      const timeArray = Object.keys(time).filter((item) =>
        ["days", "hours", "minutes"].includes(item)
      )
      setTimeStr(
        timeArray
          .map(
            (item) =>
              `${
                lte(time[item], 9) ? `0${time[item]}` : `${time[item]}`
              } ${item}`
          )
          .join(" ")
      )
    }
  }

  return {
    timeStr,
    isLoading,
    remainingTime: minus(atTime, currentTime),
  }
}

export const queryUserHoldAmount = selector({
  key: "queryUserHoldAmount",
  get: async ({ get }) => {
    get(priceKeyIndexState)
    const { client, address } = get(walletState)
    if (!client) {
      return
    }
    try {
      return await client.queryContractSmart(GAUGE_ADDRESS ?? "", {
        hold_amount: {
          address: address,
        },
      })
    } catch (error) {
      console.error("queryUserHoldAmount " + error)
      return {}
    }
  },
})

const getQueryUserHoldAmount = atom<any>({
  key: "getQueryUserHoldAmount",
  default: {},
})

export const useQueryUserHoldAmount = () => {
  return useStore(queryUserHoldAmount, getQueryUserHoldAmount)
}

const getQueryUserPowerState = atom<any>({
  key: "getQueryUserPowerState",
  default: {},
})

export const useGetQueryTotalUserPower = () => {
  return useStore(queryUserPowerGuage, getQueryUserPowerState)
}

export const queryUserPowerGuage = selector({
  key: "queryUserPower",
  get: async ({ get }) => {
    get(priceKeyIndexState)
    const { client, address } = get(walletState)
    const { contracts } = get(protocolQuery)
    if (!client) {
      return
    }
    try {
      return await client.queryContractSmart(contracts["staking"] ?? "", {
        balance: {
          address: address,
        },
      })
    } catch (error) {
      console.error("queryUserPower " + error)
      return {}
    }
  },
})

const getTotalStakedState = atom<any>({
  key: "getTotalStakedState",
  default: {},
})

export const useGetTotalStaked = () => {
  return useStore(guageTotalLockedStakedQuery, getTotalStakedState)
}

export const guageStakeConfigQuery = selector({
  key: "guageStakeConfigQuery",
  get: async ({ get }) => {
    get(priceKeyIndexState)
    const { client } = get(walletState)
    const { contracts } = get(protocolQuery)
    if (!client) {
      return
    }
    try {
      return await client.queryContractSmart(contracts["staking"] ?? "", {
        query_config: {},
      })
    } catch (error) {
      console.error("stakeConfigQuery " + error)
      return []
    }
  },
})

export const guageDurationsStakedQuery = selector({
  key: "durationsStakedQuery",
  get: async ({ get }) => {
    get(priceKeyIndexState)
    try {
      const data = get(guageStakeConfigQuery)
      return (
        data?.duration_values_vector.filter((item) =>
          [1, 3, 6, 12].includes(item)
        ) ?? []
      )
    } catch (error) {
      console.error("durationsStakedQuery " + error)
      return []
    }
  },
})

export const guageTotalLockedStakedQuery = selector({
  key: "guageTotalLockedStakedQuery",
  get: async ({ get }) => {
    get(priceKeyIndexState)
    const durations = get(guageDurationsStakedQuery)
    const { client } = get(walletState)
    const { contracts } = get(protocolQuery)
    if (!client) {
      return
    }
    try {
      let list = {}
      await Promise.all(
        durations?.map(async (duration) => {
          const data = await client.queryContractSmart(
            contracts["staking"] ?? "",
            {
              total_balance: {
                duration: duration,
              },
            }
          )
          list[duration] = data
        })
      )
      const totalCount: any =
        list &&
        Object.values(list).reduce((a: any, b: any) => plus(a, b.balance), 0)
      return totalCount
    } catch (error) {
      console.error("totalLockedStakedQuery " + error)
      return {}
    }
  },
})

const getLopoTokenInfo = atom<any>({
  key: "getLopoTokenInfo",
  default: {},
})

export const useLopoTokenInfo = () => {
  return useStore(lopoTokenInfo, getLopoTokenInfo)
}

export const lopoTokenInfo = selector({
  key: "lopoTokenInfo",
  get: async ({ get }) => {
    get(priceKeyIndexState)
    const { client } = get(walletState)
    const { contracts } = get(protocolQuery)
    if (!client) {
      return
    }
    try {
      return await client.queryContractSmart(contracts["staking"] ?? "", {
        token_info: {},
      })
    } catch (error) {
      console.error("lopoTokenInfo " + error)
      return {}
    }
  },
})

export const getVoteGuage = selector({
  key: "getVoteGuage",
  get: async ({ get }) => {
    get(priceKeyIndexState)
    const { client, address } = get(walletState)
    if (!client) {
      return
    }
    try {
      const data: any = await client.queryContractSmart(GAUGE_ADDRESS ?? "", {
        get_vote: {
          proposal_id: 1,
          voter: address,
        },
      })
      return data ?? {}
    } catch (error) {
      console.log("error", error)
      return error
    }
  },
})

const getVoteGuageState = atom<any>({
  key: "getVoteGuageState",
  default: {},
})

export const useGetVoteGuage = () => {
  return useStore(getVoteGuage, getVoteGuageState)
}

const getUserVoteList = atom<any>({
  key: "getUserVoteList",
  default: {},
})

export const useUserVoteList = () => {
  return useStore(userVoteList, getUserVoteList)
}

export const userVoteList = selector({
  key: "userVoteList",
  get: async ({ get }) => {
    get(priceKeyIndexState)
    const { client, address } = get(walletState)
    if (!client) {
      return
    }
    try {
      return await client.queryContractSmart(GAUGE_ADDRESS ?? "", {
        get_vote: {
          proposal_id: 1,
          voter: address,
        },
      })
    } catch (error) {
      console.error("userVoteList " + error)
      return {}
    }
  },
})
