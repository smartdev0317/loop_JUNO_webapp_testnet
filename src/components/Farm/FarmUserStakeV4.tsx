import {useEffect, useState} from "react"
import classnames from "classnames"

import styles from "./FarmUserStakeV4.module.scss"
import Card from "../Card"
import Grid from "../Grid"
import Button from "../Button"
import Modal from "../Modal"
import {DATASOURCE} from "../../pages/Farm/TopFarming"
import FarmStakeForm from "../../forms/Farm/FarmStakeForm"
import {Type as StakeType} from "../../pages/Stake"
import {PostError} from "../../forms/FormContainer"
import {div, gt, minus, number} from "../../libs/math"
import {commas, decimal} from "../../libs/parse"
import {useLockTimeFrameForAutoCompound, useUnstakeTimoutFarm2,} from "../../graphql/queries/Farm/useUnstakedTimeout"
import {bound} from "../Boundary"
import {
    FarmContractTYpe,
    getLastDistributionInPoolIndex,
    getLockTimeFrameForAutoCompoundQuery,
    getLockTimeFrameQueryFarm2,
    useGetLastDistributionInPool,
} from "../../data/farming/FarmV2"
import {getICon2} from "../../routes"
import LoadingPlaceholder from "../Static/LoadingPlaceholder"
import plus_btn_icon from "../../images/icons/plusblue.svg"
import minus_btn_icon from "../../images/icons/minusblue.svg"
import plus_icon from "../../images/icons/24 expand plus.svg"
import collapsed from "../../images/icons/24-expand minus.svg"
import AutoCompoundBtn from "./AutoCompoundBtn"
import {Tooltip, TooltipIcon} from "../Tooltip"
import harvest_icon from "../../images/icons/harvestblue.svg"
import HarvestButton from "./HarvestButton"
import {DeliverTxResponse} from "@cosmjs/stargate"
import CalculateTVL from "../../pages/Farm/CalculateUserTVL"
import {useRecoilValue} from "recoil"
import {junoUserStakedTimeQuery} from "../../data/contract/juno_queries"
import {useGetUserAutoCompoundSubription} from "../../data/contract/migrate"
import {ApyTooltipIcon} from "../ApyToolTip"
import FarmApyTooltipContent from "../FarmApyTooltipContent"

interface Props {
    farmResponseFun: (
        res: DeliverTxResponse | undefined,
        errors: PostError | undefined,
        type?: string
    ) => void
    dataSource: DATASOURCE
    hidden?: boolean
    type: StakeType
    pageName?: any
    farmContractType: FarmContractTYpe
}

export const useLastDistributionTimeLeftTime = (lp: string, contents: any[]) => {

    const [timeLeft, setTimeLeft] = useState(0)
    const [currentTime, setTime] = useState(div(Date.now(), 1000))

    useEffect(() => {
        const interval = setInterval(() => setTime(div(Date.now(), 1000)), 1000)
        return () => {
            clearInterval(interval)
        }
    }, [])

    useEffect(() => {
        const remaningTime = minus(currentTime, contents[lp] ?? "0")
        setTimeLeft(number(remaningTime))
    }, [currentTime])

    return {
        timeLeft,
        isValidLastDistTime: gt(timeLeft ?? "0", 60),
        isValidForStaking: gt(timeLeft ?? "0", 600),
    }
}

export const useLastDistributionTimeLeft = (lp: string) => {
    const {contents} = useGetLastDistributionInPool()
    const getLastDistributionInPoolIndexFn = useRecoilValue(
        getLastDistributionInPoolIndex
    )

    const time = useLastDistributionTimeLeftTime(lp, contents)

    return {
        ...time,
        indexLastDistTime: getLastDistributionInPoolIndexFn?.(lp),
    }
}

const FarmUserStakeV4 = ({
                             type,
                             dataSource,
                             farmResponseFun,
                             pageName,
                             farmContractType,
                             hidden = true,
                         }: Props) => {
    const [token, setToken] = useState("")
    const [lpToken, setLpToken] = useState("")
    const [expand, setExpand] = useState(false)
    const [symbol, setSymbol] = useState("")
    const [isOpenStakeModal, setIsOpenStakeModal] = useState(false)
    const [stakeDefaultType, setStakeDefaultType] = useState(StakeType.STAKE)

    const disallowContractAddr = [
        "juno18vgue5r3fszgg28y6p5nd6jzf7ugm02xa5ykhdjq30mr9j0h228q0tnjmc",
        "juno1psyaa7vueurhseywuzaguhmhqqqdpu2mmudmk6fj0m65ajgf63ws96uwng",
        "juno14lhqn5pd7lhfgvr80t89094u04swcnpjrn9sjnaxl7uxfhw2przsqpag94",
        "juno1xf92yvhyq4zj4xp3hesfjjzqyc5mk5a8vdcqn8drrghkqcc9np3qfqrz4d"
    ];

    const disableStake = disallowContractAddr.includes(dataSource.contract_addr)

    useEffect(() => {
        if (dataSource) {
            !token && setToken(dataSource?.token)
            !token && setSymbol(dataSource?.symbol)
            !token && setLpToken(dataSource?.lpToken)
        }
    }, [dataSource, token])

    // get reward for claimable by LpToken
    // const userClaimable = useRewardByDistributionToken(lpToken ?? "")

    // const parsePrice = (price: string, def: string) =>
    //   price !== undefined ? commas(decimal(price, 4)) : def


    const modalTitle = {
        [StakeType.STAKE]: "Farm LP",
        [StakeType.UNSTAKE]: "Unfarm LP",
    }[stakeDefaultType]

    const openStakeModal = (type: StakeType): any => {
        setIsOpenStakeModal(!isOpenStakeModal)
        setStakeDefaultType(type)
    }

    const closeStakeModal = () => {
        setIsOpenStakeModal(!isOpenStakeModal)
    }
    const collapsedIcon = (
        <img
            src={expand ? collapsed : plus_icon}
            alt={""}
            className={styles.expand_icon}
            onClick={() => setExpand(!expand)}
        />
    )
    const {contents: findAutoCompundStatus} = useGetUserAutoCompoundSubription()
    const disabled = findAutoCompundStatus[lpToken] ?? false

    useEffect(() => {
        setExpand(findAutoCompundStatus[lpToken] ?? false)
    }, [findAutoCompundStatus])

    const {isValidLastDistTime, indexLastDistTime, isValidForStaking} =
        useLastDistributionTimeLeft(lpToken)

    // const { formatTime, timeString, timeLeft  } = useRewardNextPayoutFarm2(
    //   farmContractType,
    //   lpToken
    // )

    const userStakedTime = useRecoilValue(junoUserStakedTimeQuery(lpToken))
    const {
        timeLeft: timeLeftUnstake,
        timeString: timeStringUnstake,
        shortTimeStringFarm2,
    } = useUnstakeTimoutFarm2(userStakedTime, farmContractType, lpToken)


    const {
        timeLeft: timeLeftUnstakeCompound,
        timeString: timeStringUnstakeCompound,
        shortTimeString,
    } = useLockTimeFrameForAutoCompound(userStakedTime)

    // const nextRewardTimer = timeLeft && timeString.length > 0 ? (
    //     <span className={styles.payoutSection}>
    //                         {timeString && gt(number(timeLeft), "0") && (
    //                             <span>next reward:</span>
    //                         )}
    //       {formatTime && gt(number(timeLeft), "0")
    //           ? ` ${formatTime}`
    //           : ""}
    //                       </span>
    // ) : (
    //     <span>(Few days left)</span>
    // )

    // const { shortDayString: shortDayStringComp, shortMonthsString: shortMonthsStringComp, shortFormatTime: shortFormatTimeComp } = shortTime
    // @ts-ignore
    return (
        <div>
            <Card
                className={classnames(styles.container, expand ? "" : styles.slim)}
                mainSectionClass={styles.main}
            >
                <Grid
                    className={styles.stake_container}
                    // onClick={() => setExpand(!expand)}
                >
                    <Grid
                        className={classnames(styles.cell, styles.mobile_cell)}
                        onClick={() => !expand ? setExpand(!expand) : {}}
                    >
                        <Grid
                            className={classnames(styles.selection, styles.symbol_title)}
                            onClick={() => setExpand(!expand)}
                        >
                            <div className={styles.icontable}>
                                <div className={styles.icontableHub}>
                                    {symbol.split("-")[0] && (
                                        <img
                                            style={{width: "25px", borderRadius: "25px"}}
                                            src={getICon2(symbol.split("-")[0].trim().toUpperCase())}
                                            alt=" "
                                        />
                                    )}
                                    {symbol.split("-")[1] && (
                                        <img
                                            style={{width: "25px", borderRadius: "25px"}}
                                            src={getICon2(symbol.split("-")[1].trim().toUpperCase())}
                                            alt=" "
                                        />
                                    )}
                                </div>
                                <p style={{display: "block"}} className={styles.symbol}>
                                    {symbol}
                                </p>
                            </div>
                        </Grid>
                        {window.innerWidth > 620 && (
                            <Grid
                                className={classnames(
                                    expand ? styles.expanded : styles.closed,
                                    styles.stake_btn
                                )}
                            >
                                <div
                                    className={classnames(styles.grid, styles.comboBtnContainer)}
                                >
                                    <Button
                                        disabled={hidden || disableStake}
                                        className={classnames(
                                            styles.stake_unstake_btn,
                                            styles.smBtn
                                        )}
                                        onClick={() =>
                                            hidden || disableStake ? {} : openStakeModal(StakeType.STAKE)
                                        }
                                    >
                                        {
                                            disableStake ?
                                                <Tooltip content={'you cannot stake'}> <img src={plus_btn_icon}
                                                                                            height={"20px"}
                                                                                            alt={""}/></Tooltip>
                                                : <img src={plus_btn_icon}
                                                                                              height={"20px"} alt={""}/>

                                        }
                                    </Button>

                                    <Button
                                        className={classnames(
                                            styles.stake_unstake_btn,
                                            styles.smBtn
                                        )}
                                        onClick={() => openStakeModal(StakeType.UNSTAKE)}
                                    >
                                        <img src={minus_btn_icon} height={"20px"} alt={""}/>
                                    </Button>
                                    <HarvestButton
                                        classname={classnames(
                                            styles.stake_unstake_btn,
                                            styles.harvestBtn,
                                            timeLeftUnstake &&
                                            timeStringUnstake.length > 0 &&
                                            gt(timeLeftUnstake, "0")
                                                ? ""
                                                : styles.disabled
                                        )}
                                        shortTimeString={
                                            timeLeftUnstake &&
                                            timeStringUnstake.length > 0 &&
                                            gt(timeLeftUnstake, "0")
                                        }
                                        icon={harvest_icon}
                                        lpToken={lpToken}
                                        farmContractType={farmContractType}
                                        farmResponseFun={farmResponseFun}
                                        compoundingTime={gt(timeLeftUnstakeCompound, 0)}
                                        compounding={disabled}
                                        distTimeRecord={{isValidLastDistTime, indexLastDistTime}}
                                    />
                                </div>
                                <div
                                    className={classnames(styles.grid, styles.comboBtnContainer)}
                                >
                                    <AutoCompoundBtn
                                        lp={lpToken}
                                        farmContractType={farmContractType}
                                        farmResponseFun={farmResponseFun}
                                    />
                                </div>
                            </Grid>
                        )}
                        <Grid className={styles.collapsed_mobile_icon}>
                            {collapsedIcon}
                        </Grid>
                    </Grid>
                    {window.innerWidth < 620 && (
                        <Grid
                            className={classnames(
                                expand ? styles.expanded : styles.closed,
                                styles.stake_btn
                            )}
                        >
                            <div
                                className={classnames(styles.grid, styles.comboBtnContainer)}
                            >
                                <Button
                                    disabled={hidden}
                                    className={classnames(styles.stake_unstake_btn, styles.smBtn)}
                                    onClick={() =>
                                        hidden ? {} : openStakeModal(StakeType.STAKE)
                                    }
                                >
                                    <img src={plus_btn_icon} height={"20px"} alt={""}/>
                                </Button>
                                <Button
                                    className={classnames(styles.stake_unstake_btn, styles.smBtn)}
                                    onClick={() => openStakeModal(StakeType.UNSTAKE)}
                                >
                                    <img src={minus_btn_icon} height={"20px"} alt={""}/>
                                </Button>
                                <HarvestButton
                                    classname={classnames(
                                        styles.stake_unstake_btn,
                                        styles.harvestBtn,
                                        timeLeftUnstake &&
                                        timeStringUnstake.length > 0 &&
                                        gt(timeLeftUnstake, "0")
                                            ? ""
                                            : styles.disabled
                                    )}
                                    shortTimeString={
                                        timeLeftUnstake &&
                                        timeStringUnstake.length > 0 &&
                                        gt(timeLeftUnstake, "0")
                                    }
                                    icon={harvest_icon}
                                    lpToken={lpToken}
                                    farmContractType={farmContractType}
                                    farmResponseFun={farmResponseFun}
                                    compoundingTime={gt(timeLeftUnstakeCompound, 0)}
                                    compounding={disabled}
                                    distTimeRecord={{isValidLastDistTime, indexLastDistTime}}
                                />
                            </div>
                            <div
                                className={classnames(styles.grid, styles.comboBtnContainer)}
                            >
                                <AutoCompoundBtn
                                    lp={lpToken}
                                    farmContractType={farmContractType}
                                    farmResponseFun={farmResponseFun}
                                />
                            </div>
                        </Grid>
                    )}
                    <Grid className={styles.cell} onClick={() => setExpand(!expand)}>
                        <Grid className={styles.row}>
                            <div className={styles.content}>
                                <h3 className={styles.title}>APY</h3>
                                <ApyTooltipIcon
                                    content={
                                        <>
                                            <FarmApyTooltipContent
                                                symbol={dataSource?.symbol}
                                                apy={dataSource?.all_apy}
                                                tx_fee_apy={dataSource?.tx_fee_apy}
                                                rewards={dataSource?.rewards_apr}
                                                apr={dataSource?.all_apr}
                                                isSimplified={true}
                                            />
                                        </>
                                    }
                                >
                                    <h2 className={styles.greenColor}>
                                        {gt(dataSource?.all_apy, "5000")
                                            ? "5000%+"
                                            : commas(dataSource?.all_apy)}
                                        %
                                    </h2>
                                </ApyTooltipIcon>

                                {/* <h2 className={styles.greenColor}>
                  {bound(
                    `${
                      gte(dataSource.all_apy ?? "0", "5000")
                        ? `${commas(dataSource.all_apy)}%+`
                        : `${commas(dataSource.all_apy)}%`
                    }`,
                    <LoadingPlaceholder size={"sm"} color={"black"} />
                  )}
                </h2> */}
                                {expand && gt(dataSource?.estAPYInUst, "0") && (
                                    <p className={styles.sm}>
                                        Est. {commas(decimal(dataSource?.estAPYInUst, 2))} UST per
                                        year
                                    </p>
                                )}
                            </div>
                        </Grid>
                        <Grid className={expand ? styles.expanded : styles.closed}>
                            <div className={styles.content}>
                                <TooltipIcon content="This new exciting metric is coming soon.">
                                    <h2 className={styles.title}>Tx Fee</h2>
                                </TooltipIcon>
                                <h2 className={classnames(styles.white, styles.textStyle)}>
                                    TBD
                                </h2>
                            </div>
                        </Grid>
                        {/* <Grid
              className={classnames(expand ? styles.expanded : styles.closed)}
            >
              <div className={styles.content}>
                <TooltipIcon content="Your TX fee profit from the pool, converted to UST. This does not include your farm profits too. Farm profits are included in Total Value.">
                  <h2 className={styles.title}>Tx Fees</h2>
                </TooltipIcon>
                <h2 className={styles.white}>
                  TBD
                {/*  {bound(
                    `$${commas(dataSource.tx_fee)}`,
                    <LoadingPlaceholder size={"sm"} color={"black"} />
                  )}*/}
                        {/* </h2> */}
                        {/* </div> */}
                        {/* </Grid> */}
                    </Grid>
                    <Grid
                        className={classnames(styles.cell, styles.maxCell)}
                        onClick={() => setExpand(!expand)}
                    >
                        <Grid className={styles.row}>
                            <div className={styles.content}>
                                <h3 className={styles.title}>Rewards</h3>
                                <h2>
                                    {bound(
                                        dataSource?.rewards_betaFn(expand),
                                        <LoadingPlaceholder size={"sm"} color={"black"}/>
                                    )}
                                </h2>
                            </div>
                        </Grid>
                        <Grid className={expand ? styles.expanded : styles.closed}>
                            <Grid className={classnames(styles.expanded)}>
                                <div className={styles.content}>
                                    <h3 className={styles.title}>Percentage of Pool</h3>
                                    <h2 className={styles.white}>
                                        {decimal(dataSource?.staked_percentage, 2)}
                                        <span className={styles.whiteSm}>%</span>
                                    </h2>
                                </div>
                            </Grid>
                        </Grid>
                        {/* <Grid  className={styles.row}>
              <div  className={styles.content}>
                <h3>Total Locked</h3>
                <h2>{bound(<Price price={dataSource && dataSource.staked  ? parsePrice(dataSource.staked, '0') ?? "0" : "0"} symbol={'LP'} classNames={styles.value} />, <LoadingPlaceholder size={'sm'} color={'black'} />)}</h2>
              </div>
            </Grid> */}

                        {/* <Grid className={classnames(expand ? styles.expanded : styles.closed)}>
              <div  className={styles.content}>
                <h3>LP vs HODL APY</h3>
              </div>
            </Grid> */}
                    </Grid>
                    <Grid
                        className={classnames(styles.cell, styles.maxCell)}
                        onClick={() => setExpand(!expand)}
                    >
                        <Grid className={classnames(styles.expanded, styles.mt)}>
                            <div className={styles.content}>
                                <TooltipIcon content="This new exciting metric is coming soon.">
                                    <h2 className={styles.title}>LP vs HODL APY</h2>
                                </TooltipIcon>
                                <h2 className={classnames(styles.white, styles.textStyle)}>
                                    TBD
                                </h2>
                            </div>
                        </Grid>
                        {disabled
                            ? timeLeftUnstakeCompound &&
                            timeStringUnstakeCompound.length > 0 &&
                            gt(timeLeftUnstakeCompound, "0") && (
                                <Grid className={expand ? styles.expanded : styles.closed}>
                                    <div className={classnames(styles.title, styles.content)}>
                                        <h3>Min. Farm Period (Auto Boosting)</h3>
                                        <h2>
                                            {bound(
                                                timeLeftUnstakeCompound &&
                                                timeStringUnstakeCompound.length > 0 ? (
                                                    <span
                                                        className={classnames(
                                                            styles.timeLeftSection,
                                                            styles.white
                                                        )}
                                                    >
                              {/*<b className={styles.pinkColor}>{shortMonthsStringComp}</b><b>{shortMonthsStringComp && "M "}</b> <b className={styles.pinkColor}>{shortDayStringComp}</b><b>{shortDayStringComp && "D "} </b><b className={styles.pinkColor}>{shortFormatTimeComp}</b><b>m</b>*/}
                                                        <b className={styles.pinkColor}>
                                <b className={styles.pinkColor}>
                                  {shortTimeString}
                                </b>
                              </b>
                                                        {/*{formatTimeUnstakeCompound &&*/}
                                                        {/*gt(number(timeLeftUnstakeCompound), "0")*/}
                                                        {/*  ? `${formatTimeUnstakeCompound}`*/}
                                                        {/*  : ""}*/}
                            </span>
                                                ) : (
                                                    <span>(Few days left)</span>
                                                ),
                                                <LoadingPlaceholder size={"sm"} color={"black"}/>
                                            )}
                                        </h2>
                                    </div>
                                </Grid>
                            )
                            : timeLeftUnstake &&
                            timeStringUnstake.length > 0 &&
                            gt(timeLeftUnstake, "0") && (
                                <Grid className={expand ? styles.expanded : styles.closed}>
                                    <div className={classnames(styles.content, styles.title)}>
                                        <h3>Min. Farm Period</h3>
                                        <h2>
                                            {bound(
                                                timeLeftUnstake && timeStringUnstake.length > 0 ? (
                                                    <span className={classnames(styles.timer)}>
                              {/*<b className={styles.pinkColor}>{shortMonthsString}</b><b>{shortMonthsString && "M"}</b><b className={styles.pinkColor}>{shortDayString}</b><b>{shortDayString && "D "} </b><b className={styles.pinkColor}>{shortFormatTime}</b><i>m</i>*/}
                                                        <b className={styles.pinkColor}>
                                {shortTimeStringFarm2}
                              </b>
                            </span>
                                                ) : (
                                                    <span>(Few days left)</span>
                                                ),
                                                <LoadingPlaceholder size={"sm"} color={"black"}/>
                                            )}
                                        </h2>
                                    </div>
                                </Grid>
                            )}
                    </Grid>
                    <Grid className={styles.cell} onClick={() => setExpand(!expand)}>
                        <Grid className={styles.row}>
                            <div className={styles.content}>
                                <h3 className={styles.title}>Total Value</h3>
                                <h2>
                                    {bound(
                                        <CalculateTVL
                                            rewardsDollarPrice={dataSource?.userRewardsDollarPrice}
                                            tvl={dataSource.user_liquidity}
                                            expanded={expand}
                                            userPoolAssets={dataSource.userPoolAssets}
                                            totalRewardsInUst={dataSource.totalRewardsInUst}
                                        />,
                                        <LoadingPlaceholder size={"sm"} color={"black"}/>
                                    )}
                                </h2>
                            </div>
                        </Grid>
                    </Grid>
                    <Grid className={styles.cell}>
                        <Grid className={styles.collapsedIcon}>{collapsedIcon}</Grid>
                    </Grid>
                </Grid>
            </Card>
            <Modal
                isOpen={isOpenStakeModal}
                title={modalTitle}
                onClose={closeStakeModal}
                className={styles.marginT}
            >
                {stakeDefaultType && lpToken && token && (
                    <FarmStakeForm
                        type={stakeDefaultType}
                        closeModal={closeStakeModal}
                        token={token}
                        lpToken={lpToken}
                        farmResponseFun={farmResponseFun}
                        partial
                        key={type}
                        pageName={pageName}
                        isOpen={isOpenStakeModal}
                        farmContractType={farmContractType}
                        distTimeRecord={{isValidLastDistTime, indexLastDistTime, isValidForStaking}}
                    />
                )}
            </Modal>
        </div>
    )
}

export default FarmUserStakeV4
