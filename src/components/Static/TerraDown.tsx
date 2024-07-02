import Empty from "../../components/Empty"
import Grid from "../Grid";
import Button from "../Button";
import styles from "./TerraDown.module.scss";
import down from "../../images/down.svg"
import classNames from "classnames";

const TerraDown = () => {
  return (
    <Empty>
      <div>
        <Grid className={styles.error_container}>
          <Grid className={styles.blankGrid}></Grid>
          <Grid className={styles.container}>
            <div className={styles.CzWelcome}>
              <h6>Platform Delays</h6>
              <p>
                This is actually impressive if you think about it. There are too many of us using Loop.
              </p>
              <img src={down} alt={''} />
              <Button
                  className={styles.button}
                  onClick={() => window.location.reload()}
              >
                Refresh
              </Button>
            </div>
          </Grid>
          <Grid className={styles.blankGrid}></Grid>
        </Grid>
      </div>
    </Empty>
  )
}

export default TerraDown


export const InvalidNetwork = () => {
  return (
    <Empty>
      <div>
        <Grid className={styles.error_container}>
          <Grid className={styles.blankGrid}></Grid>
          <Grid className={styles.container}>
          <div className={classNames(styles.CzWelcome, styles.CzWelcomeNetwork)}>
              <h6>Change Network</h6>
              <p>
                Please select <b className={styles.red}>Classic Network</b> from Terra wallet
              </p>
              <img src={down} alt={''} />
            </div>
          </Grid>
          <Grid className={styles.blankGrid}></Grid>
        </Grid>
      </div>
    </Empty>
  )
}