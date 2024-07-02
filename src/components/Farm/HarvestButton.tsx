import classnames from "classnames"
import { useRecoilValue } from "recoil"
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate"

import styles from "./FarmUserStakeV4.module.scss"
import Button from "../Button"
import { FarmContractTYpe } from "../../data/farming/FarmV2"
import useNewContractMsg from "../../terra/useNewContractMsg"
import { PostError } from "../../forms/FormContainer"
import { useProtocol } from "../../data/contract/protocol"
import harvestwhite from "../../images/icons/harvestwhite.svg"
import { DeliverTxResponse, GasPrice, StdFee } from "@cosmjs/stargate"
import useAddress from "../../hooks/useAddress"
import { unsafelyGetDefaultExecuteFee } from "../../utils/fees"

import { junoRPCURL, nativeDenom } from "../../data/contract/juno_queries"
import Modal from "../Modal"
import { insertIf } from "../../libs/utils"
import { useState } from "react"
import Loading from "../Loading"
import { useWallet, useWalletManager } from "@noahsaso/cosmodal"
import { DEFAULT_FEE_NUM } from "../../constants"

interface Props {
  lpToken: string
  farmContractType: FarmContractTYpe
  farmResponseFun: (
    res: DeliverTxResponse | undefined,
    errors: PostError | undefined,
    type?: string,
    transactionStatus?: boolean
  ) => void
  shortTimeString?: boolean | string
  icon?: string
  classname?: string
  compounding: boolean
  distTimeRecord: {
    isValidLastDistTime?: boolean
    indexLastDistTime?: string | undefined
  }
  compoundingTime?: any
}

const HarvestButton = ({
  farmResponseFun,
  shortTimeString,
  farmContractType,
  compoundingTime,
  icon,
  classname,
  lpToken,
  compounding,
  distTimeRecord,
}: Props) => {
  const newContractMsg = useNewContractMsg()
  const { contracts } = useProtocol()
  // const { client }  = useRecoilValue(walletState)
  const defaultExecuteFee = unsafelyGetDefaultExecuteFee()
  const [isOpenStakeModal, setIsOpenStakeModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const address = useAddress()
  const { isValidLastDistTime, indexLastDistTime } = distTimeRecord
  const { connectedWallet } = useWalletManager()

  const msgs = [
    ...insertIf(
      isValidLastDistTime,
      newContractMsg(contracts["loop_farm_staking"], {
        distribute_by_limit: indexLastDistTime
          ? {
              limit: 1,
              start_after: indexLastDistTime,
            }
          : { limit: 1 },
      })
    ),
    newContractMsg(contracts["loop_farm_staking"], {
      claim_reward: {
        pool_address: lpToken ?? "",
      },
    }),
  ]

  const disabled =
    compounding && compoundingTime ? true : shortTimeString ? true : false

  // shortTimeString && compounding ? true : false

  /* submit */
  const RPC = useRecoilValue(junoRPCURL)

  const closeStakeModal = () => {
    setIsOpenStakeModal(!isOpenStakeModal)
  }

  const submit = async () => {
    try {
      setLoading(true)
      farmResponseFun(undefined, undefined, "harvest", true)
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
      setLoading(false)
      farmResponseFun(result, undefined, "harvest", false)
    } catch (error) {
      farmResponseFun(undefined, error, undefined, false)
      setLoading(false)
    }
  }

  const handleSubmit = (isTrade: boolean) => {
    if (compounding && isTrade) {
      setIsOpenStakeModal(false)
      submit()
    } else if (compounding) {
      setIsOpenStakeModal(true)
    } else {
      submit()
    }
  }

  const handleTrade = (e) => {
    e.stopPropagation()
    handleSubmit(true)
  }

  const handleCancel = () => {
    setIsOpenStakeModal(false)
  }

  return (
    <>
      <Modal
        isOpen={isOpenStakeModal}
        title="Harvest"
        onClose={closeStakeModal}
        className={styles.modalDesign}
      >
        <div className={styles.compounding}>
          <p>
            This farm is already Auto Compounding your rewards daily. Harvesting
            all earned rewards now will also disable Daily Auto Compounding.
          </p>
          <p>
            You will then need to enable Auto Compounding again which will
            re-start your countdown timer. You can still withdraw liquidity
            early without rewards or let your rewards continue auto compounding.
            The timer will not reset as you add more liquidity to your position.
          </p>
          <div className={styles.btnSection}>
            <button
              onClick={(e) => handleTrade(e)}
              style={{ padding: "16px", background: "red" }}
            >
              Harvest
            </button>
            <button onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      </Modal>
      <Button
        className={classnames(
          styles.stake_unstake_btn,
          styles.harvestBtn,
          disabled ? styles.harvestDisabled : ""
        )}
        disabled={disabled}
        onClick={disabled ? () => {} : () => handleSubmit(false)}
      >
        <img
          src={disabled ? harvestwhite : icon}
          className={classnames(styles.imgIcon)}
          height="20px"
          width="20px"
        />{" "}
        {loading ? <Loading /> : " Harvest"}
      </Button>
    </>
  )
}

export default HarvestButton
