import classNames from "classnames"
import styles from "./index.module.scss"

const KeplrConnectionWarning = ({ visible, setVisible }) => {
  const open = () => {
    setVisible(true)
  }
  const close = () => {
    setVisible(false)
  }
  return (
    <>
      {!visible ? null : (
        <div
          className={`${styles.modal} ${
            visible ? styles.open_modal : styles.close_modal
          }`}
        >
          <div className={classNames(styles.modalContent)}>
            <div className={styles.closeSection}>
              <span className={styles.close} onClick={close}>
                &times;
              </span>
            </div>
            <div className={styles.modalHeader}>
              <div className={styles.title}>
                <h1 className={styles.titleClass}>{"Warning"}</h1>
              </div>
            </div>
            <div className={styles.modalBody}>
              <h2>
                Iphones are not working well with Keplr. Please use the Keplr
                Chrome extension on desktop if you have an Iphone
              </h2>
            </div>
          </div>
        </div>
      )}
    </>
  )
  // <div>

  {
    /*
     */
  }
  // </div>
}

export default KeplrConnectionWarning
