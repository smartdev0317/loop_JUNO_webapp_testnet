import classnames from "classnames"
import { StdFee } from "@cosmjs/amino"
import { DeliverTxResponse, GasPrice } from "@cosmjs/stargate"
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import { useRecoilValue } from "recoil"

import styles from "./FarmUserStakeV4.module.scss"
import Button from "../Button"
import useNewContractMsg from "../../terra/useNewContractMsg"
import { PostError } from "../../forms/FormContainer"
import { useProtocol } from "../../data/contract/protocol"
import { unsafelyGetDefaultExecuteFee } from "../../utils/fees"
import useAddress from "../../hooks/useAddress"
import { junoRPCURL, nativeDenom } from "../../data/contract/juno_queries"
import { useState } from "react"
import { useWallet, useWalletManager } from "@noahsaso/cosmodal"
import { DEFAULT_FEE_NUM } from "../../constants"

interface Props {
  farmResponseFun: (
    res: DeliverTxResponse | undefined,
    errors: PostError | undefined,
    type?: string,
    transactionStatus?: boolean
  ) => void
}

const UnstakeBtn = ({ farmResponseFun }: Props) => {
  const newContractMsg = useNewContractMsg()
  const { contracts } = useProtocol()
  const defaultExecuteFee = unsafelyGetDefaultExecuteFee()
  const address = useAddress()
  const [loading, setLoading] = useState(false)
  const { connectedWallet } = useWalletManager()

  const msgs = [
    newContractMsg(contracts["staking3Mon"], {
      unstake_and_claim: {},
    }),
  ]

  /* submit */
  const RPC = useRecoilValue(junoRPCURL)

  const submit = async () => {
    try {
      setLoading(true)
      farmResponseFun(undefined, undefined, "compounding", true)
      const fee: StdFee = {
        amount: defaultExecuteFee.amount,
        gas: (Number(defaultExecuteFee.gas) * DEFAULT_FEE_NUM).toString(),
      }

      let result: DeliverTxResponse
      if (typeof window["obiSignAndBroadcast"] === "function") {
        // This is an obi Wallet
        result = await window["obiSignAndBroadcast"](address, [...msgs])
      } else {
        let wasmChainClient = await SigningCosmWasmClient.connectWithSigner(
          RPC,
          connectedWallet.offlineSigner,
          {
            gasPrice: GasPrice.fromString("0.0025" + nativeDenom),
          }
        )
        result = await wasmChainClient.signAndBroadcast(
          address,
          [...msgs],
          "auto"
        )
      }
      farmResponseFun(result, undefined, "compounding", false)
      setLoading(false)
    } catch (error) {
      farmResponseFun(undefined, error, undefined, false)
      setLoading(false)
    }
  }

  return (
    <Button
      className={classnames(styles.stake_unstake_btn, styles.compoundBtn)}
      onClick={submit}
    >
      {loading ? "loading..." : "UNSTAKE"}
    </Button>
  )
}

export default UnstakeBtn
