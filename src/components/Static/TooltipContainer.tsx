import styles from "./TooltipContainer.module.scss"
import { ReactChild } from "react"
import classNames from "classnames"
import classnames from "classnames";

const TooltipContainer = ({children, className}:{ children: ReactChild, className?: string}) => {

  return (
    <div className={classnames(styles.tolBox, className)}>
    <div className={styles.d_flex_col}>
      <span className={classNames(styles.d_flex_col)}>
        {children}
      </span></div>
      </div>
  )
}

export default TooltipContainer
