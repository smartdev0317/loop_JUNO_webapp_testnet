import { useEffect, useState } from "react"

import styles from "./FarmRules.module.scss"
import Grid from "./Grid"
import Card from "./Card"
import Button from "./Button"
import { TooltipIcon } from "./Tooltip"
import useLocalStorage from "../libs/useLocalStorage"

const StakingRules = () => {
  const [showRules, setShowRules] = useLocalStorage('stakingRules', true)
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
    <div className="mg">
      <Grid>
        <div className={styles.tooltip_container}>
          <Button className={styles.toggle_btn} onClick={()=> toggle()}>{ show && 'Hide'} How LOOP Power Works  <TooltipIcon className={styles.tooltip} content={' How LOOP Power Works'} /></Button>
         
        </div>
      </Grid>
      {
        show && <Card className={styles.rules_card}>
          <h2>How LOOP Power Works</h2>
          <br />
          <div style={{display:'flex',flexDirection:'column',justifyContent:'flex-start',alignItems:'flex-start', padding:'0 20px'}}>
            <ul style={{listStyle: 'disc', lineHeight: '30px'}}>
              <li>Welcome to the new age of single sided token and NFT staking!</li>
              <li>Rewarding our loyal users - the more LOOP Power the more LOOP rewards.</li>
              <li>Revenue based reward boosting from Loop DEX, Loop Aggregator & Loop DeFi NFT Marketplace... more revenue channels will be added later.</li>
              <li>Restake to compound 100% of rewards + reset countdown to maximise LOOP Power & yield every 24hr contract distribution period.</li>
              <li>100% of rewards can be withdrawn at the end of staking term. Users who want to havest their accumulated rewards early can harvest 50% now - the remaining 50% of rewards will be sent to the LOOP Power community wallet for governance voting.</li>
              <li>Staking LOOP Power DeFi NFTs to boost LOOP Power & Converting a Staking position into a DeFi NFT is in development.</li>
              <li>Loop Power = Number of LOOP Staked * Stake Term multiple * (days left/stake term in days).</li>
              <li style={{color: '#01cdfd'}}>Stake Term multiples:
                <ul style={{listStyle: 'inside', color: '#0998b9'}}>
                  <li className={styles.padLef}>1 month = 1x</li>
                  <li className={styles.padLef}>3 month = 3x</li>
                  <li className={styles.padLef}>6 month = 6x</li>
                  <li className={styles.padLef}>12 month = 12x</li>
                </ul>
              </li>

            </ul>
          </div>
        </Card>
      }
    </div>
  )
}

export default StakingRules
