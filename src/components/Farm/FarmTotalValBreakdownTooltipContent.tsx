import styles from "./FarmTotalValBreakdownTooltipContent.module.scss"
import classNames from "classnames/bind"
import {commas, decimal, lookupSymbol} from "../../libs/parse";
import {useFindTokenDetails} from "../../data/form/select";

interface FarmTooltip {
    asset1: {
        token: string,
        amount: string,
        dollar: string
    },
    asset2: {
        token: string,
        amount: string,
        dollar: string
    },

    rewards: string | number
    totalRewardsInUst: any
}

const FarmTotalValBreakdownTooltipContent = ({asset1, asset2, rewards, totalRewardsInUst}: FarmTooltip) => {
    const findTokenDetailFn = useFindTokenDetails()
    const token1Detail = findTokenDetailFn(asset1.token)
    const token2Detail = findTokenDetailFn(asset2.token)
    const symbol1 = token1Detail ? lookupSymbol(token1Detail.tokenSymbol) : ""
    const symbol2 = token2Detail ? lookupSymbol(token2Detail.tokenSymbol) : ""

    return (
        <div className={styles.tolBox}>
            <div className={styles.d_flex_col}>
        <span className={classNames(styles.d_flex_col)}>
          <h3 className={styles.textDecoration}>Breakdown</h3>
        </span>

                <span className={styles.d_flex_row}>
          {asset1 && <span>{symbol1} : {commas(asset1.amount)} (${commas(decimal(asset1.dollar, 3))})</span>}
                    {asset2 && <span>{symbol2} : {commas(asset2.amount)} (${commas(decimal(asset2.dollar, 3))})</span>}
                    {asset2 && <span>Value of Rewards : ${totalRewardsInUst}</span>}
        </span>
            </div>
        </div>
    )
}

export default FarmTotalValBreakdownTooltipContent
