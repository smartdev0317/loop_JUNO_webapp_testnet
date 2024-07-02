import DataLayer from "../components/DataLayer/DataLayer"
import { SMALLEST } from "../constants"
import { div } from "../libs/math"
import TxHash from "./TxHash"
import styles from "./TxInfo.module.scss"
import AddToKeplr from "../components/Static/AddToKeplr";
import {insertIf} from "../libs/utils";

interface Props {
  type?: any
  txInfo?: any
  parser: any
  asset?: string
  isSplittedSwap?: boolean
  tokens?: string
}

const TxInfo = ({ txInfo, parser, asset,type,isSplittedSwap, tokens }: Props) => {

  const txhash = txInfo?.transactionHash ?? ""
  const raw_log = txInfo?.rawLog ?? ""

  const fee=txInfo?.gasUsed
  const parsedLogs = JSON.parse(raw_log)
  const receipt = parser(parsedLogs)
  const secSymbol = asset?.split('_')?.[1]
  const secToken = tokens?.split('_')?.[1]

  const footer = [
      ...insertIf(!(receipt && !isSplittedSwap), {
        title: <AddToKeplr title={`Add ${secSymbol} to Keplr`} address={secToken ?? ""} />,
        content: '',
      }),
    {
      title: "Gas Fee",
      content: `+ ${fee}`,
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
        {receipt && !isSplittedSwap &&
            receipt.map(
                ({ title, content, children }, index) =>
                    content && (
                        <article className={styles.wrapper} key={title.toString()}>
                          <header className={styles.row}>
                            <h1 className={styles.title}>{title} { index === 0 && <AddToKeplr title={`Add ${secSymbol} to Keplr`} address={secToken ?? ""} />}</h1>
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
              <article className={styles.row} key={title.toString()}>
                <h1 className={styles.title}>{title}</h1>
                <p className={styles.content}>{content}</p>
              </article>
          ))}
        </footer>
      </>
  )
}

export default TxInfo