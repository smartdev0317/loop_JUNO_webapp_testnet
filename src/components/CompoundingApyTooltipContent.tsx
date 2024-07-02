import styles from "./FarmApyTooltipContent.module.scss"
import classNames from "classnames/bind"
import { div, gt, gte, multiple, plus } from "../libs/math"
import { commas, decimal } from "../libs/parse"
import {LOOP,USDC} from '../../src/constants'
interface CompoundTooltip {
  compoundingLoopValue: any
  compoundingDollarValue: any
  notCompoundingLoopValue: any
  notCoompoundingDollarValue:any
}

const CompoundingApyTooltipContent = ({
  compoundingLoopValue,
  compoundingDollarValue,
  notCompoundingLoopValue,
  notCoompoundingDollarValue
}: CompoundTooltip) => {

  return (
    <div className={styles.tolBox}>
      <div className={styles.d_flex_col}>
        <span className={classNames(styles.d_flex_col)}>
          <h3 className={styles.textDecoration}>Compounding*</h3>
          <h2 className={styles.white}>
            {`${commas(decimal(compoundingLoopValue, 4))} ${LOOP}`}
          </h2>
          <h2 className={styles.white}>
          {`$${commas(decimal(compoundingDollarValue, 4))} ${USDC}`}
          </h2>
        </span>

        <span className={classNames(styles.d_flex_col, styles.pt10)}>
          <h3 className={styles.textDecoration}>Not Compounding</h3>
          <h2 className={styles.white}>
            {`${commas(decimal(notCompoundingLoopValue, 4))} ${LOOP}`}
          </h2>
          <h2 className={styles.white}>
            {`$${commas(decimal(notCoompoundingDollarValue, 4))} ${USDC}`}
          </h2>
        </span>

        <span
          className={classNames(styles.d_flex_col, styles.pt10, styles.white)}
        >
          <p>*Annual Percentage Yield when user restakes rewards daily</p>
        </span>
      </div>
    </div>
  )
}

export default CompoundingApyTooltipContent
