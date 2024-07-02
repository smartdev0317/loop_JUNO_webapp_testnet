import styles from "./FarmApyTooltipContent.module.scss"
import classNames from "classnames/bind"
import { gte, plus } from "../libs/math"
import { commas, decimal } from "../libs/parse"

interface StakeTooltip{
  apr:any,
  apy:any,
}

const StakingApyTooltipContent = ({ apr,apy, }:StakeTooltip) => {
  const currentAPY =  apy
  const currentAPR = apr
  
  return (
    <div className={styles.tolBox}>
      <div className={styles.d_flex_col}>
        <span className={classNames(styles.d_flex_col)}>
          <h3 className={styles.textDecoration}>Current APY*</h3>
          <h2 className={styles.blue}>
            { gte(currentAPY, "5000") ? `5000%+` : `${commas(decimal((currentAPY),2))}%` }
          </h2>
        </span>
       
        <span className={classNames(styles.d_flex_col, styles.pt10)}>
        <h3 className={styles.textDecoration} >APR:</h3>
        <h2 className={styles.white}>
        { gte(currentAPR, "5000") ? `5000%+` : `${commas(decimal((currentAPR),2))}%` }
        </h2>
        <p className={styles.white}>
            Assuming user does not restake rewards once during the period and user maintains the same staking weight in the pool.
        </p>
      </span>

       
        <span className={classNames(styles.d_flex_col, styles.pt10, styles.white)}>
          <p>*Annual Percentage Yield when user restakes rewards daily.</p>
        </span>
      </div>
    </div>
  )
}

export default StakingApyTooltipContent
