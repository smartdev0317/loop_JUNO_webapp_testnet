import {useEffect, useState} from "react"
import { DeliverTxResponse } from "@cosmjs/stargate"
import classNames from "classnames"
import {useHistory} from "react-router-dom"

import {div, gt, multiple} from "../../libs/math"
import {LP, SMALLEST} from "../../constants"
import {decimal, lookup, toAmount} from "../../libs/parse"
import {placeholder, step, validate as v,} from "../../libs/formHelpers"
import FormGroup from "../../components/FormGroup"
import useForm from "../../libs/useForm"
import {Type} from "../../pages/Stake"
import {PostError} from "../FormContainer"
import {useLpTokenBalances} from "../../data/contract/normalize"
import {useFindDevTokensByLp, useFindUsersStakedTime,} from "../../data/farming/stakeUnstake"
import styles from "../../pages/LoopStake.module.scss"
import useUnstakedTimeout, { useLockTimeFrameForAutoCompound } from "../../graphql/queries/Farm/useUnstakedTimeout"
import {useFindTokenDetails} from "../../data/form/select"
import {useFindStakedByUserFarmQuery} from "../../data/contract/farming"
import useNewContractMsg from "../../terra/useNewContractMsg"
import useFarmStakeReceipt from "../receipts/useFarmStakeReceipt"
import {FarmType} from "../../pages/FarmBeta"
import {
  FarmContractTYpe
} from "../../data/farming/FarmV2"
import {useTokenMethods} from "../../data/contract/info"
import {useProtocol} from "../../data/contract/protocol"
import { useDevTokenBalanceQuery, useGetUserAutoCompoundSubription,
} from "../../data/contract/migrate"
import MiniFormContainer from "../MInFormContainer"

import {getPath, MenuKey} from "../../routes"
import FormFeedback from "../../components/FormFeedback"
import contracts from '../../tokens.json'
import { insertIf } from "../../libs/utils"
import classnames from "classnames"
import Loading from "../../components/Loading"

enum Key {
  value = "value",
}

interface Props {
  type: Type
  token: string
  lpToken: string
  tab?: Tab
  /** Gov stake */
  gov?: boolean
  farmResponseFun?: (
    res: DeliverTxResponse | undefined,
    errors: PostError | undefined,
    types?: string | undefined,
    transactionStatus?:boolean | undefined
  ) => void
  partial?: boolean
  pageName?: FarmType
  isOpen?: boolean
  farmContractType?: FarmContractTYpe
  distTimeRecord?: { 
    isValidLastDistTime?: boolean,
    indexLastDistTime?: string | undefined,
    isValidForStaking?: boolean | undefined,
  }
  closeModal?: () => void
  setLoading?: (loading: boolean) => void
}

/**
 * @Instructions-for-unstake
 *
 * @step1: send query with lpToken, you will get a tempToken
 * @step2: send another query for staked balance(max) with temp-token
 * @step3: send balance and temp-token in contract for unstake
 * @note: show staked value to user but send devToken value in contract
 */

const FarmStakeForm = ({
  type,
  token,
  tab,
  gov,
  farmResponseFun,
  partial,
  lpToken: outerLpToken,
  isOpen,
  closeModal,
  distTimeRecord = { isValidLastDistTime: false, indexLastDistTime: undefined ,isValidForStaking: false},
}: Props) => {  
  /* context */
  const { whitelist } = useProtocol()
  const { getSymbol } = useTokenMethods()
  const { isValidLastDistTime, indexLastDistTime,isValidForStaking } = distTimeRecord
  const [loading,setLoading]=useState(false)

  // const findUserStakedTimeFn = useRecoilValue(findUserStakedTime)
  const findUserStakedTimeFn = useFindUsersStakedTime()
  const findTokenDetailFn = useFindTokenDetails()

  const { lpToken } = whitelist[token] ?? {}

  const [agree, setAgree] = useState(false)

  const findDevTokenFn = useFindDevTokensByLp()
  const devToken = findDevTokenFn?.(lpToken ?? outerLpToken ?? "")
  const {contents:devTokenBalance} = useDevTokenBalanceQuery(devToken)
  const balance=devTokenBalance?.balance

  const findStakedByUserFarm = useFindStakedByUserFarmQuery()
  const lpStaked = findStakedByUserFarm(lpToken ?? outerLpToken ?? "")

  const stakedv2 = findUserStakedTimeFn?.(lpToken ?? outerLpToken ?? "")
  const { timeLeft, timeString,unStakeTimeLeft } = useUnstakedTimeout(
      stakedv2
  )
  const { shortDayString, shortFormatTime} = unStakeTimeLeft

  /* get lp balance */
  const lpTokenBalances = useLpTokenBalances()
  const token1Value = lpTokenBalances[outerLpToken ?? lpToken] ?? "0"
  /* form:validate */
  const validate = ({ value }: Values<Key>) => {
    const symbol = getSymbol(token)
    return {
      [Key.value]: {
        [Type.STAKE]: v.amount(value, {
          symbol,
          max: div(token1Value, SMALLEST) ?? "0",
          min: "0"
        }, undefined,type === Type.STAKE ? '6' : undefined),
        [Type.UNSTAKE]: v.required(value),
      }[type],
    }
  }

  /* form:hook */
  const initial = { [Key.value]: "" }
  const form = useForm<Key>(initial, validate)
  const { values, setValue, getFields, attrs, invalid } = form
  const { value } = values
  const amount = toAmount(value)
  const symbol = getSymbol(token)
  const pairSymbol = findTokenDetailFn?.(lpToken ?? outerLpToken, "lp")

  /* render:form */
  const max =
    outerLpToken !== undefined && type === Type.STAKE
      ? div(token1Value, SMALLEST) ?? "0"
      : "1"

  const fields = getFields({
    [Key.value]: {
      [Type.STAKE]: {
        label: "Amount",
        input: {
          type: "number",
          step: step(symbol),
          placeholder: placeholder(symbol),
          autoFocus: true,
          // setValue: form.setValue,
          // name: Key.value,
          // decimal: 6,
        },
        className: styles.input,
        // help: {
        //   [Type.STAKE]: renderBalance(max, symbol),
        //   [Type.UNSTAKE]: renderBalance(div(farmPage === FarmType.farm ? balance : balanceFarm2, SMALLEST), symbol),
        // }[type],
        unit: pairSymbol ? `${pairSymbol.tokenSymbol} ${LP}` : LP,
        max: gt(max, 0)
          ? () => setValue(Key.value, max)
            : undefined,
      },
      [Type.UNSTAKE]: {
        label: "Amount",
        input: {
          type: "number",
          step: step(symbol),
          placeholder: placeholder(symbol),
          autoFocus: true,
          setValue: form.setValue,
          name: Key.value,
          decimal: 6,
          disabled: true
        },
        className: styles.input,
        // max: gt(max, 0)
        //   ? () => setValue(Key.value, lookup(div(farmPage === FarmType.farm ? balance : balanceFarm2, SMALLEST), symbol))
        //   : undefined,
        // maxValue: gt(max, 0)
        //     ? () => lookup(div(farmPage === FarmType.farm ? balance : balanceFarm2, SMALLEST), symbol)
        //     : undefined,
            max: undefined,
        maxValue: undefined,
      },
    }[type],
  })

  useEffect(() => {
    if (type === Type.UNSTAKE) {
      
      // setValue(Key.value, decimal(div(farmPage === FarmType.farm ? balance : balanceFarm2, SMALLEST), 3))
      setValue(Key.value, decimal(div(lpStaked, SMALLEST), 6))
    }
  }, [type, lpToken, balance, isOpen])


  const contents = undefined

  /* submit */
  const newContractMsg = useNewContractMsg()
//   const unstakeData = type === Type.UNSTAKE ? gt(number(farmPage === FarmType.farm ? timeLeft : timeLeftv2), "0") ? { unstake_without_claim: {
//     pool_address: lpToken ?? outerLpToken ?? ""
// }} : { unstake_and_claim: {
//     pool_address: lpToken ?? outerLpToken ?? ""
//   }} : {}

const { contents: findAutoCompundStatus } = useGetUserAutoCompoundSubription()
const compounding = findAutoCompundStatus[lpToken ?? outerLpToken ?? ""] ?? false

const {
  timeLeft: timeLeftUnstakeCompound,
  timeString: timeStringUnstakeCompound,
    timeArr: compoundTimeArr
} = useLockTimeFrameForAutoCompound(
    findUserStakedTimeFn?.(lpToken ?? outerLpToken ?? "")
)

const withoutClaim = (((timeLeft && gt(timeLeft, "0")) && timeString.length > 0) )

  const data = {
    [Type.STAKE]: [
      ...insertIf(isValidForStaking, newContractMsg(contracts["loop_farm_staking"], {
        distribute_by_limit: indexLastDistTime ? {
          limit: 1,
          start_after: indexLastDistTime
        } : { limit: 1},
      })),
      newContractMsg(lpToken ?? outerLpToken ?? "", {
        send: {
          contract: contracts["loop_farm_staking"],
          amount,
          msg: "eyJzdGFrZSI6e319", //{stake:{}}
        },
      })
    ],
    [Type.UNSTAKE]: devToken
      ? [
        ...insertIf(isValidLastDistTime, newContractMsg(contracts["loop_farm_staking"], {
          distribute_by_limit: indexLastDistTime ? {
            limit: 1,
            start_after: indexLastDistTime
          } : { limit: 1},
        })),
          newContractMsg(devToken, {
            send: {
              contract: contracts["loop_farm_staking"],
              amount: lpStaked,
              msg: withoutClaim ? "eyJ1bnN0YWtlX3dpdGhvdXRfY2xhaW0iOnt9fQ==" : "eyJ1bnN0YWtlX2FuZF9jbGFpbSI6e319", //- {"unstake_without_claim":{}} {unstake_and_claim:{}}
            },
          })
        ]
      : [],
  }[type as Type]

  const timeLeftCompounding = ((timeLeftUnstakeCompound && gt(timeLeftUnstakeCompound, "0")) && timeStringUnstakeCompound.length > 0)
  const timeLeftStaking = ((timeLeft && gt(timeLeft, "0")) && timeString.length > 0)
  const messages = undefined

  const   disabled =
    invalid ||
    (type === Type.STAKE && !gt(token1Value, "0")) ||
    (type === Type.UNSTAKE && (timeLeftStaking) && !agree) ||
    (type === Type.UNSTAKE && (compounding &&  timeLeftCompounding && !agree))


  /* result */
  const parseTx = useFarmStakeReceipt(type, !!gov)

  const msgInfo = {
    max: {
      [Type.STAKE]: multiple(max, SMALLEST),
      [Type.UNSTAKE]: multiple(value, SMALLEST),
    }[type],
    value: value,
    symbol: "LP",
  }

  const container = {
    label: type === Type.STAKE ? "Farm" : "Unfarm",
    tab,
    attrs,
    contents,
    messages,
    disabled,
    data,
    parseTx,
    msgInfo,
    partial,
  }

  const [sumbit, setSumbit] = useState(false)

  const MapTimeChar = (str: string | number) => {
    return `${str}`?.split('').map(s => <i>{s}</i>)
  }
  
  useEffect(()=>{
    type == Type.STAKE && setValue(Key.value, decimal(max, 6))
  },[max, type])

  const farmResponse = (
      res: DeliverTxResponse | undefined,
      error: PostError | undefined,
      types: string = "farm_stake",
      transactionStatus?:boolean | undefined
  ) => {
    farmResponseFun?.(res, error, type === Type.STAKE ? 'farm_stake' : 'farm_unstake',transactionStatus)
  }


  const history = useHistory()
  const resetFunc = () => {
    history.push({
      pathname: getPath(MenuKey.POOL_V2)
    })
  }
  
 
  return (
    <MiniFormContainer
      {...container}
      farmResponseFun={farmResponse}
      label={type}
      closeModal={closeModal}
      setLoading={setLoading}
      // extResponse={response}
      className={styles.mimiContainer}
      customActions={()=><></>}
      formSubmited={sumbit}
      resetFunc={type === Type.UNSTAKE && resetFunc}
    >
      <div className={styles.stakeModal}>
      {type === Type.STAKE  && (!compounding ? (
        (<div className={styles.StakeMsg}>
          <>
            <p>
            Farm your LP tokens to earn more rewards!
            </p>
            <p>Enable Auto Daily Compounding to auto compound your LOOP rewards in the LOOP reward pool. Your min farm period will increase to 3 months and will not reset as you add to your position. You can withdraw early, without rewards. Harvesting rewards will reset the timer.</p>
          </>
        </div>)
      ) :  (compounding && timeLeftCompounding) ? <div className={styles.StakeMsg}>
        <>
        <p>Farm your LP tokens to earn more rewards!</p>
        <p>Auto Daily Compounding is enabled!</p>
        <p>Your min farm period to claim all your rewards will not be affected.</p>
        </>
      </div> : (compounding && !(timeLeftCompounding)) ? (
        <div className={styles.StakeMsg}>
          <>
          <p>Farm your LP tokens to earn more rewards!</p>
        <p>Auto Daily Compounding is enabled!</p>
        <p>You will still not have a min farming period to claim rewards. Harvesting rewards will reset the timer.</p>
          </>
        </div>
      ) : "")}
      


{ type === Type.UNSTAKE && (timeLeftStaking) && <div className={styles.StakeMsg}>
          <>
            <p>
            Your min 1 week farming period is not over. Unfarm without rewards?
            </p>
          </>
        </div>
    }

{ type === Type.UNSTAKE && compounding && (timeLeftStaking) && <div className={styles.StakeMsg}>
            <>
              <p>
                Your 3 month compounding period is not over. unfarm without rewards?
              </p>
            </>
          </div>
       
    }
{type === Type.UNSTAKE ? (timeLeftStaking ? (
                <div className={styles.stakeModalMiddle}>
                      <b>Time left:</b>
                      <div>
                        <>
                          <b className={styles.pinkColor}>{shortDayString}</b><i>{shortDayString && "D"}</i><b className={styles.pinkColor}>{shortFormatTime}</b>
                        </>
                      </div>
                    </div>
                      
            ) : (compounding && (timeLeftCompounding && (<div className={classnames(styles.stakeModalMiddle, styles.stakeModalMiddle2)}>
            <b>Time left (compound):</b>
            <div >
              <span className={styles.pinkColor}>{MapTimeChar(compoundTimeArr['months'])}<i  className={styles.whiteTick}>M</i><span className={classNames(styles.pinkColor,styles.blueTick)}>{MapTimeChar(compoundTimeArr['days'])}<i  className={styles.whiteTick}>D</i></span><span  className={classNames(styles.pinkColor,styles.blueTick)}>{MapTimeChar(compoundTimeArr['hours'])}
                        <i className={styles.whiteTick}>:</i>{MapTimeChar(compoundTimeArr['minutes'])}<i className={styles.whiteTick}>:</i>{MapTimeChar(compoundTimeArr['seconds'])}</span></span>
            </div>
          </div>))) ) : ""
          }


            { (type === Type.UNSTAKE && (
                (timeLeftStaking) && (<div className={styles.stakeModalMiddle}>
                      <b>Time left:</b>
                      <div>
                        <>
                          <b className={styles.pinkColor}>{shortDayString}</b><i>{shortDayString && "D"}</i><b className={styles.pinkColor}>{shortFormatTime}</b>
                        </>
                      </div>
                    </div>
                )
            
            ))}

{type === Type.UNSTAKE && ((timeLeftStaking)
        || (compounding &&  timeLeftCompounding)) && (
        
        <label className={styles.checkBoxCheck}><input onChange={()=> setAgree(!agree)} type="checkbox"/><span></span>Yes, I'm sure I want to unfarm everything without rewards.</label>
      )}

{(type === Type.UNSTAKE && (!(( timeLeftStaking)
            || ( timeLeftCompounding))) && (
            <FormFeedback notice>
              Are you sure you want to unstake your LP and rewards?
            </FormFeedback>
        ))}

       <section>
        {
          type === Type.UNSTAKE && (
                <div className={styles.stakeModalInner}>
                  Tx Fee: <b className={classNames(styles.stakeMarginLeft, styles.fee)}>~ $0.01</b>
                </div>
            )
        }
        { type === Type.STAKE && (<>
          <div className={styles.balanceLine}>
            Balance: <b className={styles.stakeMarginLeft}>{max}</b> LP{" "}
            
            <span
              onClick={() => setValue(Key.value, type == Type.STAKE ? max : lookup(max, symbol))}
              className={styles.maxBtn}
          >
            MAX
          </span>
          
          </div>
          
        </>) }
        <div className={styles.stakeModalForm}>
          <div className={styles.stakeModalLeft}>
            <FormGroup {...fields[Key.value]} miniForm={true} />
           {/* <i>~0.000 UST</i>*/}
          </div>
          <div className={styles.stakeModalRightt}>
            <button className={styles.button} onClick={()=> setSumbit(true)} type='button' disabled={disabled} >{ loading ? <Loading/> : (type === Type.UNSTAKE ? 'UNFARM' : 'FARM') }</button>
          </div>
        </div>
      </section>
      </div>
    </MiniFormContainer>
  )
}

export default FarmStakeForm