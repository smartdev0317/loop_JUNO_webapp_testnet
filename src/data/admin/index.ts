import {selector} from "recoil"

import {protocolQuery} from "../contract/protocol"
import {priceKeyIndexState} from "data/app"
import {walletState} from "state/walletAtoms"
import {iterateAllPage} from "../utils/pagination"

export const queryAssignContributorsReward = selector({
    key: "queryAssignContributorsReward",
    get: async ({ get }) => {
        get(priceKeyIndexState)
        const { contracts } = get(protocolQuery)
        const { client } = get(walletState)
        if (!client) {
            return
        }
        try {
            const query = async (offset?: any[]) => {
                const data: any = await client.queryContractSmart(
                    contracts["token_distributor"] ?? "",
                    { users_reward: {
                        limit:30,
                            start_after: offset
                    } }
                )
                return data ?? []
            }
            // @ts-ignore
            return await iterateAllPage(query, (data) => data[data.length -1]?.address, 30)
        } catch (error) {
            console.error('queryAssignContributorsReward '+ error)
            return []
        }
    }
})