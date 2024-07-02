import styles from "./PortFolioAllAssets.module.scss"
import useMy from "../../pages/My/useMy"
import { div, gt, plus } from "../../libs/math"
import { SMALLEST, USDC } from "../../constants"
import { commas, decimal } from "../../libs/parse"
import classNames from "classnames/bind"
import { getStakingPendingRewards } from "../../pages/My/parser"
import useStaking from "../../pages/My/useStaking"
import useFarmList from "../../pages/Farm/useFarmList"

const useFarmTotalValueUstLocked = (): any => {
  const dataList = useFarmList()
  const totalValue =
    dataList && dataList.length > 0
      ? dataList
          ?.filter((farm) => gt(farm.staked ?? "0", "0"))
          ?.map((farm) => {
            return farm?.liquidity ?? "0"
          })
      : []

  const tempArray: any = []
  const depositArray: any = []
  dataList && dataList.length > 0
    ? dataList?.map((item) => {
        tempArray.push(item?.userRewardsDollarPrice)
        depositArray.push(item?.user_liquidity)
      })
    : []

  return {
    totalValue:
      totalValue &&
      totalValue.length > 0 &&
      totalValue?.reduce((a, b) => plus(a, b)),
    farmingPendingReward: tempArray.reduce((a, b) => plus(a, b), 0),
    totalDeposit: depositArray.reduce((a, b) => plus(a, b), 0),
  }
}

// const useStakingPendingRewards = (): any => {
//   const dataList = useStaking()
//   const stakingPendingRewards = getStakingPendingRewards(dataList?.dataSource)
//   return stakingPendingRewards
// }

const PortFolioAllAssets = () => {
  const { holdings, pool, staking } = useMy()
  let farmStaking: string = useFarmTotalValueUstLocked()?.totalValue
  const stakingPendingRewards = null
  // useStakingPendingRewards()
  const farmingPendingRewards =
    useFarmTotalValueUstLocked()?.farmingPendingReward

  const totalDepositInFarm = useFarmTotalValueUstLocked()?.totalDeposit

  const holdingsValue = div(holdings?.totalValue, SMALLEST)
  const poolValue = pool?.totalWithdrawableValue
  const stakeValue = farmStaking
  const stakingValue = staking?.totalUstBalance
  const totalEarnedFromStaking = staking?.totalEarnedFromStaking.toString()

  const totalBalance = decimal(
    plus(plus(holdingsValue, poolValue), plus(stakeValue, stakingValue)),
    2
  )

  const myCurrentDeposit = plus(totalDepositInFarm, poolValue)

  return (
    <div className={styles.assetsContainer}>
      {totalBalance > "0" ? (
        <div className={styles.valuesContainer}>
          <span className={styles.itemWrapper}>
            <span>Total Balance</span>
            <span className={styles.dflex}>
              <span className={classNames(styles.textStyle, styles.changeFont)}>
                ${commas(totalBalance)}
              </span>
              {/* <span className={styles.Style}>{USDC}</span> */}
            </span>
          </span>
          <div className={styles.dFLex}>
            <span
              className={classNames(styles.itemWrapper, styles.paddingData)}
            >
              <span>Current Deposits</span>
              <span className={styles.dflex}>
                <span className={styles.textStyle}>
                  ${commas(decimal(myCurrentDeposit, 2))}
                </span>
                {/* <span className={styles.Style}>{USDC}</span> */}
              </span>
            </span>

            <span
              className={classNames(styles.itemWrapper, styles.paddingData)}
            >
              <span>Total Pending Rewards</span>
              <span className={styles.dflex}>
                <span className={styles.textStyle}>
                  ${commas(
                    decimal(
                      plus(stakingPendingRewards, farmingPendingRewards),
                      6
                    )
                  )}
                </span>
                {/* <span className={styles.Style}>{USDC}</span> */}
              </span>
            </span>
          </div>
        </div>
      ) : (
        <div className={classNames(styles.valuesContainer, styles.emptyAssets)}>
          <span className={styles.itemWrapper}>
            <span>Total Balance</span>
            <span className={styles.dflex}>
              <span className={styles.textStyle}>$0</span>
              {/* <span className={styles.Style}>{USDC}</span> */}
            </span>
          </span>
        </div>
      )}
    </div>
  )
}

export default PortFolioAllAssets
