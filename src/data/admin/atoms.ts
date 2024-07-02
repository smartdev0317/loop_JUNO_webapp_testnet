import {atom} from "recoil"
import {useStore} from "../utils/loadable"
import { queryAssignContributorsReward } from "./index"

export const queryAssignContributorsRewardState = atom({
    key: "queryAssignContributorsRewardState",
    default: [],
})

export const useQueryAssignContributorsReward = () => {
    return useStore(queryAssignContributorsReward, queryAssignContributorsRewardState)
}