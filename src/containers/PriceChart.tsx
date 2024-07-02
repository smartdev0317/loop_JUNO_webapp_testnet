import { useEffect, useState } from "react"
import classNames from "classnames/bind"
import {
  startOfMinute,
  subDays,
  subHours,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns"
import Button from "@material-ui/core/Button"
import Box from "@material-ui/core/Box"
import classnames from "classnames"

import { adjustAmount, commas, decimal, lookupSymbol } from "../libs/parse"
import Change from "../components/Change"
import ChartContainer from "./ChartContainer"
import styles from "./PriceChart.module.scss"
import { EXCHANGE_TOKEN } from "../pages/Exchange"
import { useTokenMethods } from "../data/contract/info"
import LoadingPlaceholder from "../components/Static/LoadingPlaceholder"
import Tooltip from "../components/Tooltip"
import Loading from "../components/Loading"
import { USDC, USDC_addr } from "../constants"
import GraphLine from "../images/graph_line.svg"
import BackgroundLines from "../images/background_lines.svg"
import {ChartProps, usePriceCharts, useNonDirectPairChart} from "./usePriceChart"
import {gt, number} from "../libs/math";
import { bound } from "components/Boundary"
import TradingChart from "../components/TradingChart";

const cx = classNames.bind(styles)

interface Item {
  timestamp: number
  price: number
}

export interface Data {
  price: string
  priceAt: string
  history: Item[]
}

export interface PriceChartProps {
  token1: EXCHANGE_TOKEN
  token2?: EXCHANGE_TOKEN
  pool: string | undefined
  large?: boolean
  expand?: boolean
  pro?: boolean
  pair?: string
    pairType?: string
}
export interface History {
  timestamp: number
  price: string
}

export const useGetChart = (props: ChartProps) => {
    const {
        token1,
        token2,
        pairType = '',
        range,
        now,
        pool
    } = props

    const { blocksDifference, history, price, priceAt, change } = usePriceCharts({...props})
    const nonDirect = useNonDirectPairChart({pairType, token1, token2, range, now, pool})
    return {
        blocksDifference,
        history: pairType.length <= 0 ? nonDirect.history : history,
        price: pairType.length <= 0 ? nonDirect.lastPrice : price,
        priceAt: pairType.length <= 0 ? nonDirect.lastPrice : priceAt,
        change: change
    }
}

const PriceChart = (props: PriceChartProps) => {
    const {
        token1,
        token2,
        pair = "",
        pool,
        large,
        expand,
        pairType = '',
        pro = false,
    } = props
  const now = startOfMinute(new Date())
  const [mode, setMode] = useState(0)
    // const [priceData, serPriceData] = useState<string>()
    // const [priceAtData, serPriceAtData] = useState<string>()

  const ranges = [
    {
      label: "1h",
      interval: 1, // 1 minute
      from: subHours(now, 1).getTime(),
      fmt: "dd LLL, yy",
    },
    {
      label: "12h",
      interval: 60 / 12, // 5 minutes
      from: subHours(now, 12).getTime(),
      fmt: "dd LLL, yy",
    },
    {
      label: "1d",
      interval: 60 / 4, // 15 minutes
      from: subDays(now, 1).getTime(),
      fmt: "EEE, dd LLL, HH:mm aa",
    },
    {
      label: "1w",
      interval: 60, // 1 hour
      from: subWeeks(now, 1).getTime(),
      fmt: "EEE, dd LLL, HH:mm aa",
    },
    {
      label: "1M",
      interval: 60 * 24, // 1 day
      from: subMonths(now, 1).getTime(),
      fmt: "dd LLL, yy",
    },
    {
      label: "3M",
      interval: 60 * 24 * 3, // 3 day
      from: subMonths(now, 3).getTime(),
      fmt: "dd LLL, yy",
    },
    {
      label: "1y",
      interval: 60 * 24 * 7, // 1 week
      from: subYears(now, 1).getTime(),
      fmt: "dd LLL, yy",
    },
  ]

    const [range, setRange] = useState(ranges[3])
  const { check8decOper, check8decTokens } = useTokenMethods()
  const bothAreWh = check8decTokens(token1.token, token2?.token)
  const { history: historyDataAPI, price: lastPriceData, change, blocksDifference} = useGetChart({...props, range, now})
  const isblocksDifference = gt(blocksDifference, "300")


  if (mode === 0)
    return isblocksDifference ? (
      <div className={styles.container}>
        <div className={styles.component}>
          <div className={styles.headerChartLeft}>
            <section
              className={classNames(styles.PlaceHolder, styles.placeRight)}
            ></section>
            <section
              className={classNames(styles.PlaceHolder, styles.placeLeft)}
            ></section>
          </div>
          <div className={styles.chartContainer}>
            <div className={styles.innerChart}>
              <div className={styles.comingSoon}>
                <img src={BackgroundLines} alt={"img"} />
                <img
                  src={GraphLine}
                  alt={"img"}
                  style={{ position: "absolute" }}
                />
                <span className={styles.text}>
                  <Loading className={styles.progress} size={45} />
            <label>
              Syncing graphs with latest data. You can still transact.
            </label>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className={styles.container}>
        {isblocksDifference && (
          <div className={classNames(styles.loader, styles.zIndex)}>
            <Loading className={styles.progress} size={65} />
            <label>
              Syncing graphs with latest data. You can still transact.
            </label>
          </div>
        )}
        <div
          className={
            isblocksDifference ? styles.backgroundSection : styles.component
          }
        >
          <section className={`${styles.onlyCustomMobile}`}>
            <Box
              style={{
                // backgroundColor: "#222",
                borderRadius: "10px",
                justifyContent: "space-around",
                width: "100%",
                display: "flex",
                padding: "2px",
                borderBottomLeftRadius: "0",
                borderBottomRightRadius: "0",
              }}
            >
              <Button
                style={{
                  // backgroundColor: "rgba(20, 20, 20, 0.6)",
                  color: "rgb(20, 200, 20)",
                  fontSize: "12px",
                  borderRadius: "10px",
                  padding: "2px 3px",
                  marginLeft: "4px",
                }}
                onClick={() => setMode(0)}
              >
                SIMPLE
              </Button>
              <Button
                style={{
                  color: "rgb(200, 200, 200)",
                  fontSize: "12px",
                  borderRadius: "10px",
                }}
                // onClick={() => setMode(1)}
              >
                <Tooltip content={"Coming Soon"}>ADVANCED</Tooltip>
              </Button>
            </Box>
          </section>
          <header className={styles.header}>
            <section className={`${styles.token} ${styles.onlyCustomDesktop}`}>
              {  !lastPriceData ? (
                <LoadingPlaceholder />
              ) : (
                <Change
                  className={styles.price}
                  price={`${commas(
                    decimal(
                      adjustAmount(
                        bothAreWh,
                        check8decOper(token2?.token),
                        lastPriceData ?? "0"
                      ) ?? "0",
                      4
                    )
                  )} ${
                    token2?.token == USDC_addr || token1?.token === USDC_addr
                      ? USDC
                      : lookupSymbol(token2?.symbol) ?? ""
                  }`}
                >
                  {change}
                </Change>
              )}
              <section className={`${styles.onlyCustomPad}`}>
                <Box
                  style={{
                    backgroundColor: "#222",
                    borderRadius: "10px",
                    padding: "2px",
                  }}
                >
                  <Button
                    style={{
                      backgroundColor: "rgba(20, 20, 20, 0.6)",
                      color: "rgb(20, 200, 20)",
                      fontSize: "12px",
                      borderRadius: "10px",
                      padding: "2px 3px",
                      marginLeft: "4px",
                    }}
                    onClick={() => setMode(0)}
                  >
                    SIMPLE
                  </Button>
                  <Button
                    style={{
                      color: "rgb(200, 200, 200)",
                      fontSize: "12px",
                      borderRadius: "20px",
                    }}
                    // onClick={() => setMode(1)}
                  >
                    <Tooltip content={"Coming Soon"}>ADVANCED</Tooltip>
                  </Button>
                </Box>
              </section>
            </section>
            <div className={`${styles.onlyCustomMobile}`}>
              <section className={`${styles.token} ${styles.removeTop}`}>
                {!pair ? (
                  <></>
                ) : !lastPriceData ? (
                  <LoadingPlaceholder />
                ) : (
                  <Change
                    className={styles.price}
                    price={`${commas(
                      decimal(
                        adjustAmount(
                          bothAreWh,
                          check8decOper(token2?.token),
                          lastPriceData ?? "0"
                        ) ?? "0",
                        4
                      )
                    )} ${lookupSymbol(token2?.symbol) ?? ""}`}
                  >
                    {change}
                  </Change>
                )}
              </section>
            </div>
            <div className={styles.headerChartLeft}>
              <section className={classnames(styles.ranges, styles.ml)}>
                {ranges.map((r) => (
                  <button
                    type="button"
                    className={cx(styles.button, {
                      active: r.label === range.label,
                    })}
                    onClick={() => setRange(r)}
                    key={r.label}
                  >
                    {r.label}
                  </button>
                ))}
              </section>
              <section
                className={`${styles.onlyCustomDesktop} ${styles.chartMode}`}
              >
                <Box
                  style={{
                    backgroundColor: "#222",
                    borderRadius: "10px",
                    padding: "2px",
                  }}
                >
                  <Button
                    style={{
                      backgroundColor: "rgba(20, 20, 20, 0.6)",
                      color: "rgb(20, 200, 20)",
                      fontSize: "12px",
                      borderRadius: "10px",
                      padding: "2px 3px",
                      marginLeft: "4px",
                    }}
                    onClick={() => setMode(0)}
                  >
                    SIMPLE
                  </Button>
                  <Button
                    style={{
                      color: "rgb(200, 200, 200)",
                      fontSize: "12px",
                      borderRadius: "10px",
                    }}
                    // onClick={() => setMode(1)}
                  >
                    <Tooltip content={"Coming Soon"}>ADVANCED</Tooltip>
                  </Button>
                </Box>
              </section>
            </div>
          </header>
          <div className={styles.chartContainer}>
            <div className={styles.innerChart}>
                <ChartContainer
                change={change}
                datasets={historyDataAPI?.map(({ timestamp: t, price: y }) => {
                  const price = adjustAmount(
                    bothAreWh,
                    check8decOper(token2?.token),
                    y
                  )
                  return { y: price, t }
                })}
                fmt={{ t: range.fmt }}
                large={large}
                expand={expand}
                currentRangeTab={range.label}
              />
            </div>
          </div>
        </div>
      </div>
    )
  else
    return (
      <>
        <div className={`${styles.onlyCustomDesktop}`}>
          <div
            style={{
              position: "relative",
              backgroundColor: "#1b1b1b",
              borderRadius: "10px",
              height: "100%",
            }}
          >
            <Box
              style={{
                borderRadius: "10px",
                position: "absolute",
                top: "3px",
                right: "120px",
                padding: "2px",
              }}
            >
              <Button
                style={{
                  color: "rgb(200, 200, 200)",
                  fontSize: "12px",
                  borderRadius: "10px",
                }}
                onClick={() => setMode(0)}
              >
                SIMPLE
              </Button>
              <Button
                style={{
                  backgroundColor: "rgba(20, 20, 20)",
                  color: "rgb(20, 200, 20)",
                  fontSize: "12px",
                  borderRadius: "10px",
                  padding: "3px 6px",
                }}
                // onClick={() => setMode(1)}
              >
                <Tooltip content={"Coming Soon"}>ADVANCED</Tooltip>
              </Button>
            </Box>
            {
                bound(
              <TradingChart
                change={change}
                period={range.label}
                token1={token1?.token}
                token2={token2?.token}
                pool={pool}
              />,
              <LoadingPlaceholder size={"sm"} color={"lightGrey"} />
            )
            }
          </div>
        </div>
        <div className={`${styles.onlyCustomPad}`}>
          <div
            style={{
              position: "relative",
              backgroundColor: "#1b1b1b",
              borderRadius: "10px",
              height: "100%",
            }}
          >
            <Box
              style={{
                borderRadius: "10px",
                position: "absolute",
                top: "3px",
                right: "120px",
                padding: "2px",
              }}
            >
              <Button
                style={{
                  color: "rgb(200, 200, 200)",
                  fontSize: "12px",
                  borderRadius: "10px",
                }}
                onClick={() => setMode(0)}
              >
                SIMPLE
              </Button>
              <Button
                style={{
                  backgroundColor: "rgba(20, 20, 20)",
                  color: "rgb(20, 200, 20)",
                  fontSize: "12px",
                  borderRadius: "10px",
                  padding: "3px 6px",
                }}
                // onClick={() => setMode(1)}
              >
                <Tooltip content={"Coming Soon"}>ADVANCED</Tooltip>
              </Button>
            </Box>
            {bound(
              <TradingChart
                change={change}
                period={range.label}
                token1={token1?.token}
                token2={token2?.token}
                pool={pool}
              />,
              <LoadingPlaceholder size={"sm"} color={"lightGrey"} />
            )}
          </div>
        </div>
        <div className={`${styles.onlyCustomMobile}`}>
          <div
            style={{
              position: "relative",
              backgroundColor: "#131722",
              borderRadius: "10px",
              height: "500px",
            }}
          >
            <Box
              style={{
                // backgroundColor: "#222",
                borderRadius: "10px",
                justifyContent: "space-around",
                width: "100%",
                display: "flex",
                borderBottomLeftRadius: "0",
                borderBottomRightRadius: "0",
                padding: "2px",
              }}
            >
              <Button
                style={{
                  color: "rgb(200, 200, 200)",
                  fontSize: "12px",
                  borderRadius: "10px",
                }}
                onClick={() => setMode(0)}
              >
                SIMPLE
              </Button>
              <Button
                style={{
                  // backgroundColor: "rgba(20, 20, 20)",
                  color: "rgb(20, 200, 20)",
                  fontSize: "12px",
                  borderRadius: "10px",
                  padding: "3px 6px",
                }}
                // onClick={() => setMode(1)}
              >
                <Tooltip content={"Coming Soon"}>ADVANCED</Tooltip>
              </Button>
            </Box>
            {bound(
              <TradingChart
                change={change}
                period={range.label}
                token1={token1?.token}
                token2={token2?.token}
                pool={pool}
                removeBorderTop={true}
              />,
              <LoadingPlaceholder size={"sm"} color={"lightGrey"} />
            )}
          </div>
        </div>
      </>
    )
}

export default PriceChart
