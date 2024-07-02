import { useRecoilValue } from "recoil";
import { getDistributionWaitTimeQuery, getLastDistributionNextPayoutQuery } from "../../../data/farming/stakeUnstake";
import { useEffect, useState } from "react";
import { div, lte, minus, multiple, number, plus } from "../../../libs/math";
import { intervalToDuration } from "date-fns";
import {
  FarmContractTYpe,
  getDistributionWaitTimeQueryFarm2,
  getLastDistributionNextPayoutQueryFarm2,
} from "../../../data/farming/FarmV2";
import { getJunoLastDistributionInPoolFarm4 } from "../../../data/contract/juno_queries";

export default () => {
  const getDistributionNextPayout = useRecoilValue(getLastDistributionNextPayoutQuery)// farm 3

  const getDistributionWaitTime = useRecoilValue(getDistributionWaitTimeQuery)
  const [timeString, setTimeString] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)

  const [currentTime, setTime] = useState(div(Date.now(), 1000));

  useEffect(() => {
    const interval = setInterval(() => setTime(div(Date.now(), 1000)), 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  /*const shorts = {
    hours: "Hours",
    minutes: "Min",
    seconds: "Sec",
  };*/

  useEffect(() => {
    const remaningTime = minus(plus(getDistributionWaitTime, getDistributionNextPayout ?? "0"), currentTime)
    setTimeLeft(number(remaningTime))
    const time = intervalToDuration({ start: 0, end: number(multiple(remaningTime, "1000")) });
    const timeArray = Object.keys(time).filter((item) => ['hours', 'minutes', 'seconds'].includes(item));
    setTimeString(timeArray.map((item) => `${lte(time[item], 9) ? `0${time[item]}` : `${time[item]}`}`).join(':'))
  }, [currentTime])

  return {
    timeString,
    timeLeft,
    formatTime: timeString
  }
}


export const useRewardNextPayoutFarm2 =  (type: FarmContractTYpe, lpToken?: string) => {
  const getDistributionNextPayoutFn = useRecoilValue(getLastDistributionNextPayoutQueryFarm2(FarmContractTYpe.Farm2))
  // const getDistributionNextPayoutFarm4List = useRecoilValue(getJunoLastDistributionInPoolFarm4(lpToken))
  // const getDistributionNextPayoutFarm4 = type === FarmContractTYpe.Farm4 ? getDistributionNextPayoutFarm4List?.[lpToken ?? ""] ?? "0" : null
  const getDistributionNextPayout = getDistributionNextPayoutFn?.[lpToken]
  const getDistributionWaitTime = useRecoilValue(getDistributionWaitTimeQueryFarm2(type))

  const [timeString, setTimeString] = useState('')
  const [timeColorString, setTimeColorString] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [currentTime, setTime] = useState(div(Date.now(), 1000));
  
  useEffect(() => {
    const interval = setInterval(() => setTime(div(Date.now(), 1000)), 1000);
    return () => {
      clearInterval(interval);
    };
  }, [])

  useEffect(() => {
    const remaningTime = minus(plus(getDistributionWaitTime, getDistributionNextPayout ?? "0"), currentTime)
    setTimeLeft(number(remaningTime))
    const time = intervalToDuration({ start: 0, end: number(multiple(remaningTime, "1000")) });
    const timeArray = Object.keys(time).filter((item) => ['hours', 'minutes', 'seconds'].includes(item));
    setTimeString(timeArray.map((item) => `${lte(time[item], 9) ? `0${time[item]}` : `${time[item]}`}`).join(':'))
    setTimeColorString(timeArray.map((item) => lte(time[item], 9) ? `0${time[item]}` : `${time[item]}`))
  }, [currentTime])

  return {
    timeString,
    timeLeft,
    formatTime: timeString,
    formatColorTime: timeString,
    timeColorString
  }
}
