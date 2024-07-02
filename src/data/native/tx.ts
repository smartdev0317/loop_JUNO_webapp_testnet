// import { request } from "graphql-request"
import axios from "axios"
import { selector } from "recoil"
import { mantleURLQuery } from "../network"
import { TX_INFOS } from "./gqldocs"
import { TxInfos } from "../../types/tx"
import { walletState } from "../../state/walletAtoms"

export const getTxInfosQuery = selector({
  key: "getTxInfos",
  get: ({ get }) => {
    // request by hash
    // const url = get(mantleURLQuery)

    return async (hash: string) => {
      const data = await axios.get(
        `https://middlewareapi.loop.markets/v1/juno/txInfo?txHash=${hash}`,
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": `${window.location.origin}/`,
            "Access-Control-Allow-Headers":
              "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers,X-Access-Token,XKey,Authorization",
          },
        }
      )
      return data

      // request<TxInfos>(url + "?TxInfos", TX_INFOS, { hash })
      // return data.TxInfos[0]
    }
  },
})
