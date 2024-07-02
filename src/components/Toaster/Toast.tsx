// 👇️ ts-nocheck disables type checking for entire file
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

// 👇️ ts-ignore ignores any ts errors on the next line
// eslint-disable-next-line @typescript-eslint/ban-ts-comment

import React, { useEffect } from "react"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { injectStyle } from "react-toastify/dist/inject-style"
import styles from "./Toast.module.scss"
import START_ICON from "../../images/icons/transaction_start_icon.svg"
import SUCCESS_ICON from "../../images/icons/transaction_success_icon.svg"
import REJECT_ICON from "../../images/icons/transaction_reject_icon.svg"
import moment from "moment"

// CALL IT ONCE IN YOUR APP
if (typeof window !== "undefined") {
  injectStyle()
}

const OpenToast = ({
  transactionStatusData,
  resetFunction
}: {
  transactionStatusData: any
  resetFunction: () => void
}) => {

  function notify() {
    toast.dismiss()
    if (transactionStatusData?.transactionStatus) {
      toast(
        <div className={styles.dFlexCol}>
          <div className={styles.dFlex}>
            <span>
              <img src={START_ICON} alt={""} />
            </span>
            <span>Your transaction has started</span>
          </div>
          <div className={styles.dFlex}>
            <span>{moment().format("h:mm a")}</span>
          </div>
        </div>,
        {
          hideProgressBar: true,
          autoClose: 99999999,
          className: "toastStyles",
        }
      )
    } else if (transactionStatusData?.result) {
      toast.dismiss()
      toast(
        <div className={styles.dFlexCol}>
        <div className={styles.dFlex}>
          <span>
            <img src={SUCCESS_ICON} alt={""} />
          </span>
          <span>Your transaction has succeeded</span>
        </div>
        <div className={styles.dFlex}>
          <span>{moment().format("h:mm a")}</span>
        </div>
      </div>
        , {
        hideProgressBar: true,
        className: "toastStyles",
  
      })
      resetFunction()
    } else if (transactionStatusData?.error) {
      toast.dismiss()
      toast(
        <div className={styles.dFlexCol}>
        <div className={styles.dFlex}>
          <span>
            <img src={REJECT_ICON} alt={""} />
          </span>
          <span>
            {
              transactionStatusData?.error?.message  &&
                ("You rejected the transaction")
            }
          </span>
        </div>
        <div className={styles.dFlex}>
          <span>{moment().format("h:mm a")}</span>
        </div>
      </div>,
        {
          hideProgressBar: true,
          className: "toastStyles",
        }
      )
      resetFunction()
    } else {
      return null
    }
  }
  
  useEffect(() => {
    notify()
  }, [transactionStatusData])

  return (
    <div>
      <ToastContainer />
    </div>
  )
}

export default OpenToast
