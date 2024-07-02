import { ReactElement } from "react"
import useFee from "../graphql/useFee"
import { PostError } from "../forms/FormContainer"
import { icons } from "../routes"
import Button from "./Button"
import styles from "./ContractButton.module.scss"
import classnames from "classnames"
import useAddress from "../hooks/useAddress"
import { useLCDClient } from "../graphql/useLCDClient"
import { DeliverTxResponse } from "@cosmjs/stargate"

const AssignFarmContractButton = ({
  children,
  icon,
  label,
  size = "lg",
  setResponse,
  data,
  className,
  disabled,
  activeFarm,
}: {
  children?: ReactElement
  disabled?: boolean
  label?: string | ReactElement
  icon?: string
  size?: string
  data: any
  className?: string
  activeFarm?: string
  setResponse: (
    record: DeliverTxResponse | undefined,
    error: PostError | undefined
  ) => void
}) => {
  /* submit */

  // const msg = new MsgExecuteContract(
  //   mk.accAddress, //wallet address
  //   item.farmingAddress,
  //   data
  // );

  // const fee = new StdFee(6955756, { uusd: 3055756 });
  // const run_Tx = await wallet.createAndSignTx({
  //   msgs: [msg],
  //   fee,
  // });
  // let execute_tx_result = await terra.tx.broadcast(run_Tx);
  // console.log(execute_tx_result);

  const msgs = data

  const fee = useFee()
 
  const submit = async () => {

    try {
      const { gasPrice } = fee
      
      const txOptions: {
        msgs: any[]
        gasPrices: string
        purgeQueue: boolean
        memo: string | undefined
        fee?: any
      } = {
        msgs,
        memo: undefined,
        gasPrices: `${gasPrice}uusd`,
        // fee: new Fee(gas, { uusd: plus(amount, !deduct ? tax : undefined) }),
        // fee: new Fee(gas, { uusd: plus(feeAmount, undefined) }),
        purgeQueue: true,
      }

      // const signMsg = await terra.tx.create([{ address: address }], txOptions)

      // txOptions.fee = signMsg.auth_info.fee

      // const response = await post(txOptions)

      // setResponse(response, undefined)
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

export default AssignFarmContractButton
