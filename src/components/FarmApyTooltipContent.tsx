import styles from "./FarmApyTooltipContent.module.scss"
import classNames from "classnames/bind"
import { gte, plus } from "../libs/math"
import { commas } from "../libs/parse"

interface FarmTooltip{
  apr:any,
  tx_fee_apy:any,
  apy:any,
  symbol:any,
  rewards?:any,
  isSimplified?:boolean
}
export const lunaArray  = ["LunaX_uluna", "LunaX - LUNA"]

const farmApyTooltipContent = ({ apr, tx_fee_apy, apy, symbol,rewards,isSimplified=false }:FarmTooltip) => {
  const currentAPY = lunaArray.includes(symbol) ? plus(17.06, apy) : apy
  const totalAPR = lunaArray.includes(symbol) ? plus(17.06, apr) : apr
  const totalAPRR = lunaArray.includes(symbol) ? plus(17.06, apy) :  apy
  
  return (
    <div className={styles.tolBox}>
      <div className={styles.d_flex_col}>
        <span className={classNames(styles.d_flex_col)}>
          <h3 className={styles.textDecoration}>Current APY</h3>
          <h2 className={styles.blue}>
            { gte(currentAPY, "5000") ? `${commas(currentAPY)}%+` : `${commas(currentAPY)}%` }*
          </h2>
        </span>
        {isSimplified ? 

        (<span className={classNames(styles.d_flex_col, styles.pt10)}>
        <h3 className={styles.textDecoration}>Breakdown:</h3> 
           <h3>
             Tx Fees : {commas(tx_fee_apy)}% APR
           </h3>
           <h3>
             Rewards: {commas(rewards)}% APR
           </h3>
        </span>)

        :
        <span className={classNames(styles.d_flex_col, styles.pt10)}>
        <h3 className={styles.textDecoration} >Breakdown:</h3>
        {commas(tx_fee_apy)}
      </span>

        }
       
        <span>
          { lunaArray.includes(symbol) && (
            <h3>SD APR 17.06% (excluded from weekly compounding estimation)</h3>
          )}
        </span>
        <span>
          <h3>
            = Total {gte(totalAPR, "5000")? `${commas(totalAPR)}%+` : `${commas(totalAPR)}%`} APR or{" "}
            {gte(totalAPRR, '5000') ? `${commas(totalAPRR)}%+` : `${commas(totalAPRR)}%`} APY*
          </h3>
        </span>

        <span className={classNames(styles.d_flex_col, styles.pt10)}>
          <h3>*Annual Percentage Yield, if Daily Auto Compounding is enabled</h3>
        </span>
      </div>
    </div>
  )
}

export default farmApyTooltipContent
