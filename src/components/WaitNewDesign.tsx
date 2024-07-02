import { FC, ReactNode, useEffect } from "react"

import classNames from "classnames/bind"
import Card from "./Card"
import Icon from "./Icon"
import Loading, { SandLoading } from "./Loading"
import Button from "./Button"
import LinkButton, { LinkProps } from "./LinkButton"
import styles from "./WaitNewDesign.module.scss"
import Grid from "./Grid"
import { gt } from "../libs/math"
import ExtLinkButton from "./ExtLinkButton"
import useStep from "../hooks/Farm/useStep"
import { useHistory } from "react-router-dom"
import NEW_SUCCESS_ICON from "../images/new_success_icon.svg"
import NEW_CLOSE_ICON from "../images/new_close_icon.svg"


import { lte } from "ramda"

const cx = classNames.bind(styles)

export enum STATUS {
  SUCCESS = "success",
  LOADING = "loading",
  FAILURE = "failure",
}

interface Props {
  status: STATUS
  hash?: ReactNode
  link?: LinkProps
  button?: ButtonProps
  resetIt?: ButtonProps
  receipt?:any
}

const WaitNewDesign: FC<Props> = ({
  status,
  hash,
  link,
  button,
  children,
  resetIt,
  receipt,
}) => {
  const pageName = window.location.pathname

  const title = {
    [STATUS.SUCCESS]: "Pool Liquidity - Success",
    [STATUS.LOADING]:
      pageName === "/farm-wizard"
        ? "Submitting request"
        : "Wait for receipt...",
    [STATUS.FAILURE]: "Failed",
  }[status]

  const iconName = {
    [STATUS.SUCCESS]: NEW_SUCCESS_ICON,
    [STATUS.LOADING]: null,
    [STATUS.FAILURE]: null,
  }[status]

  const icon = iconName ? (
    <img src={iconName} alt={""} />
  ) : (
    <Loading
      className={pageName === "/farm-wizard" ? styles.loadingv2 : ""}
      size={40}
    />
  )

  const errorsCast = (msg: any) => {
    try {
      /*if(msg.match("unauthorized permission requested")){
        return "Slippage tolerance is insufficient to complete swap during current trading conditions. Please increase slippage and try again."
      }*/
      if (msg.toLowerCase().match("max spread assertion")) {
        return "Slippage tolerance is insufficient to complete swap during current trading conditions. Please increase slippage and try again."
      }
      return msg
    } catch (err) {
      return msg
    }
  }

  const { step, searchQ, searchObj } = useStep(status)
  const history = useHistory()

  const redirect = () => {
    const params = Object.keys(searchObj)
      .map((index) => `${index}=${searchObj[index]}`)
      .join("&")
    history.push({ search: params })
  }

  useEffect(() => {
    if (
      pageName === "/farm-wizard" &&
      status === STATUS.SUCCESS &&
      lte(step, "3")
    ) {
      redirect()
    }
  }, [status])

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Card
        padded={true}
        icon={icon}
        title={title}
        lg
        headerClass={
          pageName === "/farm-wizard" ? styles.headerV2 : styles.newHeader
        }
        className={
          pageName === "/farm-wizard" ? styles.cardHeaderV2 : styles.receipt
        }
        newDesign={true}
      >
        <section className={styles.contents}>
          {hash && <div className={styles.hash}>{hash}</div>}

          {status === STATUS.FAILURE ? (
            <p className={styles.feedback}>{errorsCast(children)}</p>
          ) : (
            <p className={styles.feedback}>{children} </p>
          )}
        </section>

        {(link || button || resetIt) && (
          <footer>
            <div className={styles.dflex}>
              {link ? (
                <LinkButton {...link} size="lg" submit className={styles.btn} />
              ) : (
                <Button {...button} size="lg" submit className={styles.btn}/>
              )}
              {resetIt && <Button {...resetIt} size="lg" submit className={styles.btn} icon={NEW_CLOSE_ICON}/>}
            </div>
          </footer>
        )}
      </Card>
    </div>
  )
}

export default WaitNewDesign
