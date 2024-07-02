import { useEffect, useState } from "react"

import styles from "./FarmRules.module.scss"
import Grid from "./Grid"
import Card from "./Card"
import Button from "./Button"
import { TooltipIcon } from "./Tooltip"
import useLocalStorage from "../libs/useLocalStorage"

const FarmRules = () => {
  const [showRules, setShowRules] = useLocalStorage('farmRules', true)
  const [show, setShow] = useState(false)

  const toggle = () => {
    setShow(!show)
  }
  
  useEffect(()=>{
    if(showRules){
      setShow(true)
      setShowRules(false)
    }
  },[showRules])

  return (
    <div>
      <Grid>
        <div className={styles.tooltip_container}>
          <Button className={styles.toggle_btn} onClick={()=> toggle()}>{ show && 'Hide'} How Farming Works  <TooltipIcon className={styles.tooltip} content={' How Farming Works'} /></Button>
         
        </div>
      </Grid>
      {
        show && <Card className={styles.rules_card}>
          <h2>How Farming Works</h2>
          <br />
          <div style={{display:'flex',flexDirection:'column',justifyContent:'flex-start',alignItems:'flex-start'}}>
            <p>- Rewards Start Accumulating: immediately.</p>
            <p>- Rewards Distributed: every second.</p>
            <p>- Harvest Button: withdraw your rewards - enabled within a few seconds of farming (depends on farm position size). If Farm Boost has been enabled then you can Harvest when min period has been reached.</p>
            <p>-  APY Value: based on users who enable "Farm Boost".</p>
            <p>-  Farm Boost: uses your unharvested Rewards to increase your share of the Reward pool.</p>
            <p>-  Farm Boost Period: 3 months before harvesting your rewards. This period will not reset when adding more to your existing farm position.</p>
            <p>-  Adding To Your Current Farm Position: does not affect any countdowns.</p>
            <p>-  There may be some tax benefits with Farm Boost if Harvesting is a taxable event in your region.</p>
            <p>-  Audited: both internally and by several reputable third parties.</p>
          </div>
        </Card>
      }
    </div>
  )
}

export default FarmRules
