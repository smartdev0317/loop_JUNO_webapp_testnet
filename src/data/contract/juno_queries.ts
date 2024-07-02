import { atom, atomFamily, selector, selectorFamily } from "recoil"
import {contractsList, contractsQuery, junoTokensList, wyndTokensList} from "./contract"
import { walletState } from "../../state/walletAtoms"
import { fetchTokenBalance } from "../../hooks/newHooks/useTokenBalance"
import { findTokensInfoQuery } from "./info"
import { useStore, useStoreLoadable } from "../utils/loadable"
import { div, multiple, pow } from "../../libs/math"

import CHAIN from "../../chain_info.mainnet.json"
import { SMALLEST } from "../../constants"
import { priceKeyIndexState } from "../app"
import pairContracts from "../../tokens.json"
import { stakeableList } from "../farming/stakeUnstake"
import { protocolQuery } from "./protocol"
import { FarmContractTYpe } from "../farming/FarmV2"
export const CHAIN_INFO = CHAIN

/**
 * Native balance of Network
 * e.g ujunox(testnet), ujuno(mainnet)
 */
export const nativeDenom = {
  "uni-3": "ujunox",
  "juno-1": "ujuno",
}[CHAIN_INFO.chainId]

export const junoRPCURL = selector({
  key: "junoRPCURL",
  get: ({ get }) => {
    return CHAIN_INFO?.rpc
  },
})

const balancesListState = atom<any>({
  key: "balancesListState",
  default: {},
})

export const useBalancesList = () => {
  return useStore(getTokenBalances, balancesListState)
}

const balancesJunoListState = atom<any>({
  key: "balancesListState",
  default: {},
})

export const useJunoBalancesList = () => {
  return useStoreLoadable(getTokenJunoBalances, balancesJunoListState)
}

export interface TokenInfoJuno {
  denom?: string
  token_address?: string
  native?: boolean
  decimals: string | number
  balance: string | number
}

export const getLpTokenBalanceJQuery = selector({
  key: "getLpTokenBalanceJQuery",
  get: async ({ get }) => {
    get(priceKeyIndexState)
    const { address, client } = get(walletState)
    const contracts = get(contractsList)
    if (!client) {
      return
    }

    if (contracts) {
      let obj = {}
      await Promise.all<any>(
        contracts?.map(async (query) => {
          const data = await client.queryContractSmart(query.lp ?? "", {
            balance: { address: address },
          })
          obj[query.lp] = data?.balance
          return { balance: data?.balance, token: query.lp }
        })
      )
      return obj
    }
  },
})

export const junoDepositedQuery = selector({
  key: "junoDepositedQuery",
  get: async ({ get }) => {
    get(priceKeyIndexState)
    const { contracts } = get(protocolQuery)
    const { address, client } = get(walletState)
    if (!client) {
      return
    }
    try {
      const data = await client.queryContractSmart(
        contracts["loop_farm_staking"] ?? "",
        { query_staked_by_user: { wallet: address } }
      )
      return data
    } catch (error) {
      return error
    }
  },
})

export const junoUserRewardQuery = selector({
  key: "junoUserRewardQuery",
  get: async ({ get }) => {
    get(priceKeyIndexState)
    const { contracts } = get(protocolQuery)
    const { address, client } = get(walletState)
    if (!client) {
      return
    }
    try {
      const data = await client.queryContractSmart(
        contracts["loop_farm_staking"] ?? "",
        { query_user_reward: { wallet: address } }
      )
      return data
    } catch (error) {
      return error
    }
  },
})

export const junoCollaboratorRewardQuery = selector({
  key: "junoCollaboratorRewardQuery",
  get: async ({ get }) => {
    get(priceKeyIndexState)
    const { contracts } = get(protocolQuery)
    const { address, client } = get(walletState)
    if (!client) {
      return
    }
    try {
      const data = await client.queryContractSmart(
        contracts["token_distributor"] ?? "",
        { user_reward: { recipient: address } }
      )
      return data
    } catch (error) {
      return error
    }
  }
})

export const junoUserStakedTimeQuery = selectorFamily({
  key: "junoUserStakedTimeQuery",
  get: 
  (lp: any) =>
  async ({ get }) => {
    get(priceKeyIndexState)
    const { contracts } = get(protocolQuery)

    const { address, client } = get(walletState)
    if (!client) {
      return
    }
    try {
      const data = await client.queryContractSmart(
        contracts["loop_farm_staking"] ?? "",
        { query_user_staked_time: { wallet: address ,pool:lp} }
      )
      return data
    } catch (error) {
      return error
    }
  },
})

export const junoUserStakedTimeInStakingQuery = selector({
  key: "junoUserStakedTimeInStakingQuery",
  get: async ({ get }) => {
    get(priceKeyIndexState)
    const { address, client } = get(walletState)
    if (!client) {
      return
    }
    try {
      const data = await client.queryContractSmart(
         "juno1e5fcmwnha53hcamgr8p7kt6rfzhnej9prwmplnse4q9868wg3j0qfr3psm",
        { query_user_staked_time: { wallet: address} }
      )
      return data
    } catch (error) {
      return error
    }
  },
})


export const junoLoopPowerQuery = selector({
  key: "junoLoopPowerQuery",
  get: async ({ get }) => {
    get(priceKeyIndexState)
    const { contracts } = get(protocolQuery)
    const { address, client } = get(walletState)
    if (!client) {
      return
    }
    try {
      const data = await client.queryContractSmart(
        pairContracts["loop_farm_staking"] ?? "",
        { query_user_power: { wallet: address } }
      )
      return data
    } catch (error) {
      return error
    }
  },
})

export const UserRewardsInPoolQuery = selectorFamily({
  key: "UserRewardsInPoolQuery",
  get: 
  (lp: any) =>
  async ({ get }) => {
    get(priceKeyIndexState)
    const { address, client } = get(walletState)
    if (!client) {
      return
    }
    try {
      const data = await client.queryContractSmart(
        pairContracts["loop_farm_staking"] ?? "",
        { query_user_reward_in_pool: { wallet: address,pool : lp } }
      )
      return data
    } catch (error) {
      return error
    }
  },
})

export const getFarmTotalStakedJQuery = selector({
  key: "getFarmTotalStakedJQuery",
  get: async ({ get }) => {
    get(priceKeyIndexState)
    const { client } = get(walletState)
    const contracts = get(contractsList)
    if (!client) {
      return
    }

    if (contracts) {
      let obj = {}
      await Promise.all<any>(
        contracts?.map(async (query) => {
          const data = await client.queryContractSmart(query.lp ?? "", {
            balance: { address: pairContracts["loop_farm_staking"] },
          })
          obj[query.lp] = data?.balance
          return { balance: data?.balance, token: query.lp }
        })
      )
      return obj
    }
  },
})

export const getFarmStakedJQuery = selector({
  key: "getFarmStakedJQuery",
  get: async ({ get }) => {
    get(priceKeyIndexState)
    const list = get(contractsQuery)
    const { address, client } = get(walletState)
    if (!client) {
      return
    }

    if (list) {
      let obj = {}
      await Promise.all<any>(
        list?.map(async (query) => {
          const data = await client.queryContractSmart(
            pairContracts["loop_farm_staking"] ?? "",
            {
              query_staked_by_user: { wallet: address, staked_token: query.lp },
            }
          )
          obj[query.lp] = data
          return { balance: data, token: query.lp }
        })
      )
      return obj
    }
  },
})

export const getFarmMyRewardsJQuery = selector({
  key: "getFarmMyRewardsJQuery",
  get: async ({ get }) => {
    const list: any = get(stakeableList)
    const { address, client } = get(walletState)
    if (!client) {
      return
    }
    if (list) {
      let obj = {}
      await Promise.all<any>(
        list?.map(async (query) => {
          const data = await client.queryContractSmart(
            pairContracts["loop_farm_staking"] ?? "",
            { query_user_reward_in_pool: { wallet: address, pool: query } }
          )
          obj[query] = data
          return { balance: data, token: query }
        })
      )
      return obj
    }
  },
})

export const getTokenLpBalancesQuery = selector({
  key: "getTokenLpBalancesQuery",
  get: async ({ get }) => {
    const contracts = get(contractsQuery)
    const { address, client } = get(walletState)

    return await Promise.all(
      contracts
        ? contracts?.map(async (item) => {
            if (client) {
              const balance = await fetchTokenBalance({
                client,
                address,
                token: {} ?? {},
              })

              return { lp: item.lp, balance: balance }
            } else {
              return {}
            }
          })
        : []
    )
  },
})

export const removeDuplicates = (arr: any[], key: string) => {
  const sort = [];
  arr?.map((item) =>{
    if(sort.find((itemIn) => itemIn[key] === item[key]) === undefined){
      sort.push(item)
    }
  })
  return sort
}
export const getTokenBalancesQuery = selector({
  key: "getTokenBalancesQuery",
  get: async ({ get }) => {
    get(priceKeyIndexState)
    const contracts = get(contractsQuery)
    const junoList = get(junoTokensList)
    const wyndList=get(wyndTokensList)
    const { address, client } = get(walletState)
    const list = removeDuplicates([...contracts, ...junoList,...wyndList],'contract_addr')
    return await Promise.all(
        list.length > 0
        ? list?.map(async (item) => {
            const findNonNative = get(findTokensInfoQuery)
            const nNative = await findNonNative?.(item.token)

            const tokenInfo = item.isNative
              ? {
                  denom: item.denom,
                  token_address: null,
                  native: true,
                  decimals: 6,
                }
              : {
                  denom: null,
                  token_address: item.token,
                  native: false,
                  decimals: item.decimals ?? nNative?.decimals,
                }

            if (client) {
              const balance = await fetchTokenBalance({
                client,
                address,
                token: tokenInfo ?? {},
              })
              return {
                ...tokenInfo,
                balance: item.isNative
                  ? item.denom.toUpperCase().startsWith("IBC")
                    ? div(balance, SMALLEST)
                    : balance
                  : balance,
              }
            } else {
              return {}
            }
          })
        : []
    )
  },
})

export const getTokenBalances = selector({
  key: "getTokenBalances",
  get: async ({ get }) => {
    get(priceKeyIndexState)
    const contracts = get(getTokenBalancesQuery)
    return contracts?.reduce((acc, item: TokenInfoJuno) => ({...acc, [item.native ? item.denom : item.token_address]: multiple(
          item.balance,
          pow(10, item.decimals)
      )}), {})
  },
})

export const getTokenJunoBalances = selector({
  key: "getTokenJunoBalances",
  get: async ({ get }) => {
    const contracts = get(getTokenBalancesQuery)
    const obj = {}
    contracts?.map((item: TokenInfoJuno) => {
      if (item.balance) {
        obj[item.native ? item.denom : item.token_address] = multiple(
            item.balance,
            pow(10, item.decimals)
        )
      }
    })
    return obj
  },
})

interface QueryJuno {
  address?: string | any
  variables?: Object | any
}
export const contractQuery = selectorFamily({
  key: "contractQuery",
  get:
    (param: any) =>
    async ({ get }) => {
      const { client } = get(walletState)
      const { address, variables } = param

      if (client && address && variables) {
        try {
          const data = await client.queryContractSmart(
            !address || address.length <= 0 ? "" : address,
            variables
          )
          return { data }
        } catch (e) {
          return {
            data: {
              return_amount: "0",
              offer_amount: "0",
              spread_amount: "0",
              commission_amount: "0",
            },
            error: e,
          }
        }
      }
    },
})
// const getJunoLastDistributionInPoolFarm4State = atom<any>({
//   key: "getJunoLastDistributionInPoolFarm4State",
//   default: {},
// })

// export const useJunoGetLastDistributionInPoolFarm4 = () => {
//   return useStore(
//     getJunoLastDistributionInPoolFarm4,
//     getJunoLastDistributionInPoolFarm4State
//   )
// }

export const getJunoLastDistributionInPoolFarm4 = selectorFamily({
  key: "getJunoLastDistributionInPoolFarm4",
  get:
    (lp: any) =>
    async ({ get }) => {
      get(priceKeyIndexState)
      const { address, client } = get(walletState)
      const contracts = get(contractsList)
      if (!client) {
        return
      }

      if (contracts) {
        try {
          const data = await client.queryContractSmart(
            pairContracts["loop_farm_staking"] ?? "",
            { query_last_distribution_time: { pool_address: lp } }
          )
          return data
        } catch (error) {
          return error
        }
      }
    },
})

// export const contractQuery = selectorFamily({
//   key: "contractQuery",
//   get: (parm:QueryJuno) => async ({ get }) => {
//     const getGraphQuery = get(getLoopGraphQueriesQuery)
//     const document = assetPriceHistory({...parm})

//     return await getGraphQuery(document, "getTradePriceHistory")
//     }
// })
