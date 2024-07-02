import DataLayer from "../components/DataLayer/DataLayer"
import { formatAsset } from "../libs/parse"
import TxHash from "./TxHash"
import styles from "./TxInfoNewDesign.module.scss"
import { FeeAmount, TxLog } from "../types/tx"
import Grid from "../components/Grid"
import Button from "../components/Button"
import farm_icon from "../images/new_farm_icon.svg"


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
}

const TxInfoNewDesign = ({ txInfo, parser, asset, type }: Props) => {
  // const { txhash: hash, tx,gas_used } = txInfo?.data?.data
  const logs = txInfo?.data?.data?.data?.raw_log
  // const fee = gas_used
  const receipt = parser(logs)
  // const footer = [
  //   {
  //     title: "Gas Fee",
  //     content: `${fee}`
  //   },
  //   {
  //     title: "Tx Hash",
  //     content: <TxHash>{hash}</TxHash>,
  //   },
  // ]

  return (
    <>
    <span>Here to Help</span>
      {/* <DataLayer
        asset={asset}
        receipt={receipt}
        txHash={hash}
        txFee={formatAsset(fee.Amount, fee.Denom)}
        type={type}
      /> */}
      {/* {
        receipt &&
          receipt.map((item, index) => {
            if (item?.title === "Receive") {
              return (
                <article className={styles.wrapper} key={index}>
                  <header className={styles.row}>
                    <h1 className={styles.title}>{item?.title}</h1>
                    <p className={styles.content}>
                      <span>{item?.value}</span>
                      <span className={styles.changeColor}>{item?.pair}</span>
                    </p>
                  </header>
                </article>
              )
            } else {
              return (
                <article className={styles.wrapper} key={index}>
                  <header className={styles.row}>
                    <h1 className={styles.title}>{item?.title}</h1>
                    <p className={styles.content}>
                      <span>
                        {item?.value1}
                        <span className={styles.changeColor}>
                          {item?.token1}
                        </span>
                      </span>
                      <span className={styles.plusIcon}>+</span>
                      <span>
                        {item?.value2}
                        <span className={styles.changeColor}>
                          {item?.token2}
                        </span>
                      </span>
                    </p>
                  </header>
                </article>
              )
            }
          })
        // receipt.map(
        //   ({ title, content, children}) =>
        //     content && (
        //       <article className={styles.wrapper} key={title}>
        //         <header className={styles.row}>
        //           <h1 className={styles.title}>{title}</h1>
        //           <p className={styles.content}>{content}</p>
        //         </header>

        //         {children && (
        //           <section className={styles.children}>
        //             {children.map(
        //               ({ title, content }) =>
        //                 content && (
        //                   <article className={styles.row} key={title}>
        //                     <h1 className={styles.title}>{title}</h1>
        //                     <p className={styles.content}>{content}</p>
        //                   </article>
        //                 )
        //             )}
        //           </section>
        //         )}
        //       </article>
        //     )
        // )
      } */}
{/* 
      <footer className={styles.footer}>
        {footer.map(({ title, content }) => (
          <article className={styles.newRow} key={title}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.content}>{content}</p>
          </article>
        ))}
      </footer>
      <Grid>{<Button children={<>Add to Farm +{receipt[0]?.apy}% APR</>} size="lg" submit className={styles.btn} icon={farm_icon} />}</Grid> */}

    </>
  )
}

export default TxInfoNewDesign
