import { useWallet } from "@noahsaso/cosmodal"

import TxHash from "./TxHash"
import styles from "./TxInfo.module.scss"
import { SMALLEST } from "../constants"
import { div } from "../libs/math"
import Grid from "components/Grid"
import Button from "components/Button"
import DataLayer from "components/DataLayer/DataLayer"
import {farm_icon} from "images"
import { addTokenToKeplr } from "helpers/addTokenToKeplr"

interface Props {
  type?: any
  txInfo?: any
  // txInfo: {
  //   Success: boolean
  //   RawLog: string

  //   TxHash: string

  //   Tx: {
  //     Fee: { Amount: FeeAmount[] }
  //     Memo: string
  //   }

  //   Logs: TxLog[]
  // }
  parser: any
  asset?: string
  showAddTokenBtn?: boolean
}

const TxInfo = ({ txInfo, parser, asset, type, showAddTokenBtn }: Props) => {
  const txhash = txInfo?.transactionHash ?? ""
  const raw_log = txInfo?.rawLog ?? ""
  const fee = txInfo?.gasUsed
  const parsedLogs = JSON.parse(raw_log)
  const receipt = parser(parsedLogs)
  const { walletClient,status } = useWallet()


  const footer = [
    {
      title: "Gas Fee",
      content: `+ ${div(fee, SMALLEST)}`,
    },
    {
      title: "Tx Hash",
      content: <TxHash>{txhash}</TxHash>,
    },
  ]


  return (
    <>
       <DataLayer
        asset={asset}
        receipt={receipt}
        txHash={txhash}
        txFee={div(fee,SMALLEST)}
        type={type}
      /> 
      {receipt &&
        receipt.map(
          ({ title, content, children }) =>
            content && (
              <article className={styles.wrapper} key={title}>
                <header className={styles.row}>
                  <h1 className={styles.title}>{title}</h1>
                  <p className={styles.content}>{content}</p>
                </header>

                {children && (
                  <section className={styles.children}>
                    {children.map(
                      ({ title, content }) =>
                        content && (
                          <article className={styles.row} key={title}>
                            <h1 className={styles.title}>{title}</h1>
                            <p className={styles.content}>{content}</p>
                          </article>
                        )
                    )}
                  </section>
                )}
              </article>
            )
        )}

      <footer className={styles.footer}>
        {footer.map(({ title, content }) => (
          <article className={styles.row} key={title}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.content}>{content}</p>
          </article>
        ))}
      </footer>
      {showAddTokenBtn && (
        <Grid>
          {
            <Button
              children={<>ADD LOOP TO KEPLR</>}
              size="lg"
              submit
              className={styles.btn}
              icon={farm_icon}
              onClick={()=>addTokenToKeplr("juno1qsrercqegvs4ye0yqg93knv73ye5dc3prqwd6jcdcuj8ggp6w0us66deup",walletClient,status)}
            />
          }
        </Grid>
      )}
    </>
  )
}

export default TxInfo
