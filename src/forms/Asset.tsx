import classNames from "classnames"

import { USDC } from "../constants"
import { gt } from "../libs/math"
import {commas, format, lookupSymbol} from "../libs/parse"
import styles from "./Asset.module.scss"
import { AssetBalanceKey } from "../hooks/contractKeys"
import {changedIcons} from "../routes"

interface Props extends AssetItem {
  formatTokenName?: (symbol: string) => string
  formatPairToken?: boolean | undefined
  balanceType?: AssetBalanceKey
  balanceSymbol?: string
  tokenSymbol: string
  showBalance?: boolean
  noPair?: boolean
  logoURI?: string
showAsPairs?: boolean
}

const Asset = ({
  tokenSymbol,
  symbol,
  name,
  price,
  balance,
  formatTokenName,
  formatPairToken,
  balanceSymbol,
  showBalance,
  noPair,
  logoURI,
    showAsPairs,
  balanceType = AssetBalanceKey.BALANCE,
}: Props) => (
  <article className={styles.asset}>
    
    <header className={styles.header}>
    {/* <Tooltip content={noPair ? "Coming Soon" : ""} className={styles.tooltip}> */}

      <h1 className={classNames(styles.symbol, noPair ? styles.blured : '')}>
        
        {
            tokenSymbol && changedIcons[tokenSymbol.toUpperCase()] ? <img height={'30'} className={styles.icons} width={'30'} alt={""} src={changedIcons[tokenSymbol.toUpperCase()] ?? ""} /> : logoURI && <img className={styles.icons} height={'30'} width={'30'} src={logoURI ?? ""} />
        }
       
        {formatTokenName?.(symbol) ??
          (formatPairToken ? symbol : lookupSymbol(symbol))}
          
      </h1>
      {/* </Tooltip> */}
    </header>

    { noPair ? <span className={styles.comingSoon}>Coming Soon</span> : <footer className={styles.footer}>
      {price && gt(price, 0) && name !== USDC && (
        <p className={styles.price}>
          {format(price)} {USDC}
        </p>
      )}

        {!showAsPairs && showBalance && (
          <p className={classNames(styles.balance, !gt(balance ?? "0", 0) ? styles.dimBalance : '')}>
          {" "}
          <strong>
            {balanceType
              ? `${commas(balance ?? "0")} ${balanceSymbol ? balanceSymbol : ""}`
              : format(balance, symbol)}
          </strong>
        </p>

       )

       }
    </footer>
    }
  </article>
)

export default Asset
