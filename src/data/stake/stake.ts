import {atom, selector} from "recoil";
import { protocolQuery } from "../contract/protocol";
import { getContractQueryQuery } from "../utils/query";
import {addressState} from "../wallet";
import {getContractsLpQuery, getUserStakedTimeQuery} from "../farming/stakeUnstake";
import {useStore} from "../utils/loadable";
import {priceKeyIndexState} from "../app";
import { walletState } from "../../state/walletAtoms";

export const getLockTimeFrameForUnstakeQuery = selector({
    key: "getLockTimeFrameForUnstakeQuery",
    get: async ({ get }) => {
        get(priceKeyIndexState)
        const { contracts } = get(protocolQuery)

        const { client} = get(walletState)
        if(!client){
            return;
        }
        return await client.queryContractSmart(contracts['loop_farm_staking'] ?? '', { query_lock_time_frame: { }});
    },
})

export const getUserStakedTimeforUnstakeQuery = selector({
    key: "getUserStakedTimeforUnstakeQuery",
    get: async ({ get }) => {
        get(priceKeyIndexState)
        const { contracts } = get(protocolQuery)
        const address = get(addressState)
        const getTerraListedContractQueries = get(getContractQueryQuery)
        if (getTerraListedContractQueries) {
            return await getTerraListedContractQueries<string | undefined>({
                    contract: contracts["loop_staking"],
                    msg: { query_user_staked_time: { wallet: address } }
                },
                "getUserStakedTimeforUnstakeQuery"
            )
        }
    },
})

export const getUserRewardsQuery = selector({
    key: "getUserRewardsQuery",
    get: async ({ get }) => {
        get(priceKeyIndexState)
        const { contracts } = get(protocolQuery)
        const address = get(addressState)
        const getTerraListedContractQueries = get(getContractQueryQuery)
        if (getTerraListedContractQueries) {
            return await getTerraListedContractQueries<string | undefined>({
                    contract: contracts["loop_staking"],
                    msg: { query_user_reward: { wallet: address } }
                },
                "getUserRewardsQuery"
            )
        }
    },
})

export const getDistributionWaitTimeQuery = selector({
    key: "getDistributionWaitTimeQuery",
    get: async ({ get }) => {
        get(priceKeyIndexState)
        const { contracts } = get(protocolQuery)
        const getTerraListedContractQueries = get(getContractQueryQuery)
        if (getTerraListedContractQueries) {
            return await getTerraListedContractQueries<string | undefined>({
                    contract: contracts["loop_staking"],
                    msg: { query_distribution_wait_time:{} }
                },
                "getDistributionWaitTimeQuery"
            )
        }
    },
})

export const getLastDistributionTimeQuery = selector({
    key: "getLastDistributionTimeQuery",
    get: async ({ get }) => {
        get(priceKeyIndexState)
        const { contracts } = get(protocolQuery)
        const getTerraListedContractQueries = get(getContractQueryQuery)
        if (getTerraListedContractQueries) {
            return await getTerraListedContractQueries<string | undefined>({
                    contract: contracts["loop_staking"],
                    msg: { query_last_distribution_time:{} }
                },
                "getLastDistributionTimeQuery"
            )
        }
    },
})