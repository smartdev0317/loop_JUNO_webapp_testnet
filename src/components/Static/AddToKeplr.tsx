import React from "react"
import {ToastContainer} from "react-toastify"
import {useWallet} from "@noahsaso/cosmodal"

import styles from "./AddToKeplr.module.scss"
import {add_to_keplr2, add_to_keplr1} from "images/keplr"
import {addTokenToKeplr, copyToClipboard} from "helpers"


const AddToKeplr = ({address, title}: { address?: string, title?: string}) => {
  const { walletClient,status } = useWallet()

  return (
      <div className={styles.addToKeplr}  >
          <ToastContainer />
          <img className={styles.addKeplrCopy} title={"Copy to clipboard"} onClick={() => !address.length ? {} : copyToClipboard(address ?? "")} src={add_to_keplr1} alt={""} />
        <img className={styles.addKeplrCopy} title={title} onClick={() => !address.length ? {} : addTokenToKeplr(address ?? "",walletClient,status)} src={add_to_keplr2} alt={""} />
      </div>
  )
}

export default AddToKeplr
