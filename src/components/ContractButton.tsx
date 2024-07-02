import { ReactElement } from "react"
import classnames from "classnames"

import { PostError } from "../forms/FormContainer"
import { icons } from "../routes"
import Button from "./Button"
import styles from "./ContractButton.module.scss"
import { DeliverTxResponse, GasPrice } from "@cosmjs/stargate"
import { StdFee } from "@cosmjs/amino"
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import { unsafelyGetDefaultExecuteFee } from "../utils/fees"
import useAddress from "../hooks/useAddress"
import {  useWalletManager } from "@noahsaso/cosmodal"
import { useRecoilValue } from "recoil"
import { junoRPCURL, nativeDenom } from "../data/contract/juno_queries"
import { DEFAULT_FEE_NUM } from "../constants"

const ContractButton = ({
  children,
  icon,
  label,
  size = "lg",
  setResponse,
  data,
  className,
  disabled,
}: {
  children?: ReactElement
  disabled?: boolean
  label?: string | ReactElement
  icon?: string
  size?: string
  data: any
  className?: string
  setResponse: (
    record: DeliverTxResponse | undefined,
    error: PostError | undefined
  ) => void
}) => {
  /* submit */
  const defaultExecuteFee = unsafelyGetDefaultExecuteFee()
  const address = useAddress()
  const { connectedWallet } = useWalletManager()
  const RPC = useRecoilValue(junoRPCURL)

  const submit = async () => {
    try {
      const fee: StdFee = {
        amount: defaultExecuteFee.amount,
        gas: (Number(defaultExecuteFee.gas) * DEFAULT_FEE_NUM).toString(),
      }

      let result: DeliverTxResponse
      if (typeof window["obiSignAndBroadcast"] === "function") {
        // This is an obi Wallet
        result = await window["obiSignAndBroadcast"](address, [...data])
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
          [...data],
          "auto"
        )
      }

      setResponse(result, undefined)
    } catch (error) {
      setResponse(undefined, error)
    }
  }
  return (
    <>
      <Button
        size={size}
        className={classnames(className)}
        disabled={disabled}
        onClick={submit}
      >
        {icon && (
          <img
            src={icons[icon]}
            alt={""}
            className={styles.icon}
            height={20}
            width={20}
          />
        )}{" "}
        {label ? label : "Submit"} {children}
      </Button>
    </>
  )
}

export default ContractButton
