import classnames from "classnames"
import { StdFee } from "@cosmjs/amino"
import { DeliverTxResponse, GasPrice } from "@cosmjs/stargate"
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import { useRecoilValue } from "recoil"

import styles from "./FarmUserStakeV4.module.scss"
import Button from "../Button"
import { FarmContractTYpe } from "../../data/farming/FarmV2"
import useNewContractMsg from "../../terra/useNewContractMsg"
import { PostError } from "../../forms/FormContainer"
import { useProtocol } from "../../data/contract/protocol"
import { useGetUserAutoCompoundSubriptionFarm4 } from "../../data/contract/migrate"
import autoCompoundIcon from "../../images/icons/auto_compoundblue.svg"
import autoCompoundGreenIcon from "../../images/icons/auto_compoundgreen.svg"
import Tooltip from "../Tooltip"
import { unsafelyGetDefaultExecuteFee } from "../../utils/fees"
import useAddress from "../../hooks/useAddress"
import { junoRPCURL, nativeDenom } from "../../data/contract/juno_queries"
import Loading from "../Loading"
import { useState } from "react"
import {  useWalletManager } from "@noahsaso/cosmodal"
import { DEFAULT_FEE_NUM } from "../../constants"

interface Props {
  lp: string
  farmContractType: FarmContractTYpe
  farmResponseFun: (
    res: DeliverTxResponse | undefined,
    errors: PostError | undefined,
    type?: string,
    transactionStatus?: boolean
  ) => void
}

const AutoCompoundBtn = ({ farmResponseFun, lp, farmContractType }: Props) => {
  const newContractMsg = useNewContractMsg()
  const { contracts } = useProtocol()
  const defaultExecuteFee = unsafelyGetDefaultExecuteFee()
  const address = useAddress()
  const { contents: findAutoCompundStatus } =
    useGetUserAutoCompoundSubriptionFarm4(farmContractType)
  const disabled = findAutoCompundStatus[lp] ?? false
  const [loading, setLoading] = useState(false)
  const { connectedWallet } = useWalletManager()

  const msgs = [
    newContractMsg(contracts["loop_farm_staking"], {
      opt_for_auto_compound: {
        pool_address: lp ?? "",
        opt_in: true,
      },
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
    <Tooltip
      delay={[1000, 0]}
      className={styles.tooltipCompound}
      content={
        !disabled ? (
          <>
            <h4>Enable Farm Boost to earn more Rewards!</h4>
            <p>
              - Earn more Rewards based on your initial deposit PLUS your
              unharvested rewards!
            </p>
            <p>
              - Your min farm period will increase to 3 months. However it will
              not reset as you add to your position.
            </p>
            <p>- You can withdraw early, without rewards.</p>
            <p>- Harvesting rewards will reset the timer.</p>
            <p>- You may get some tax benefits with this arrangement.</p>
          </>
        ) : (
          <>
            <p>- Auto Farm Boost is Enabled!</p>
            <p>
              - You are now earning boosted Rewards based on your initial
              deposit plus your unharvested rewards!
            </p>
            <p>- Your timer will not reset as you add to your position.</p>
            <p>- You can withdraw before the timer ends, without rewards.</p>
            <p>- Harvesting rewards will reset the timer.</p>
            <p>- You may get some tax benefits with this arrangement.</p>
          </>
        )
      }
    >
      <Button
        className={classnames(
          styles.stake_unstake_btn,
          styles.compoundBtn,
          disabled ? styles.compoundDisable : ""
        )}
        disabled={disabled}
        onClick={disabled ? () => {} : submit}
      >
        <img
          src={disabled ? autoCompoundGreenIcon : autoCompoundIcon}
          className={classnames(styles.imgIcon)}
          height="20px"
          width="20px"
        />{" "}
        {loading ? (
          <Loading />
        ) : disabled ? (
          "Farm is Boosting!"
        ) : (
          "Farm Boost"
        )}
      </Button>
    </Tooltip>
  )
}

export default AutoCompoundBtn
