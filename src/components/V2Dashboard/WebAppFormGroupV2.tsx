import {useRef} from "react"
import classNames from "classnames"
import styles from "./WebAppFormGroupV2.module.scss"
import {multiple} from "../../libs/math"
import {decimal} from "../../libs/parse"
import Tooltip from "../Tooltip"

const cx = classNames.bind(styles)

const FormGroupV2 = ({
                       input,
                       textarea,
                       select,
                       value,
                       unitClass,
                       miniForm,
                       showBalance,
                       zIndex: zIndexProp,
                       tokenDetail,
                       ...props
                     }: FormGroup) => {
  const {
          label,
          help,
          unit,
          max,
          maxValue,
          assets,
          focused,
          error,
          smScreen,
          type = 1,
        }              = props
  const pageName       = window.location.pathname
  const hashName       = window.location.hash
  const {skipFeedback} = props
  const inputRef       = useRef<HTMLInputElement>()
  const handleWheel    = () => {
    inputRef.current?.blur()
  }

  const isGasFeeAvailable = () => {
    const balance = help?.content
    const token   = tokenDetail?.contract_addr
    if (token === "uusd" && balance < 5) {
      return false
    }
    return true
  }

  const border = cx(styles.border, {focused, error, readOnly: value})

  const addedAmountPercent = (val) => {
    inputRef.current?.focus()
    let inputValue = decimal(
      multiple(maxValue?.(), val),
      input.decimal ? input.decimal : 4
    )
    if (inputValue) {
      input?.setValue(input.name, inputValue)
    }
  }

  return (
    <div
      className={classNames(
        styles.group,
        styles.component,
        styles.slippageComponent,
        label == "To" ? styles.toSwap : ""
      )}
    >
      <div className={cx(type === 1 && border)}>
      {label !== "To" && (
          <div style={{display: 'flex'}}>
            <span className={styles.fieldName}>From</span>
            <span className={styles.MyBalance}>
              <span
                style={{
                  marginTop: "1px",
                  color    : "#787B9C",
                  fontSize : "12px",
                }}
              >
                Balance:
              </span>
              <span
                style={{
                  fontSize   : "11px",
                  marginTop  : "3px",
                  paddingLeft: "2px",
                }}
              >
                {help && (
                  <b style={{color: "#fff"}}>{help.content}</b>
                )}
              </span>
            </span>
          </div>
        )}
        {label === "To" && (
          <div style={{display: 'flex'}}>
            <span className={styles.fieldName}>To</span>
            <span className={styles.MyBalance}>
              <span
                style={{
                  marginTop: "1px",
                  color    : "#787B9C",
                  fontSize : "12px",
                }}
              >
                Balance:
              </span>
              <span
                style={{
                  fontSize   : "11px",
                  marginTop  : "3px",
                  paddingLeft: "2px",
                }}
              >
                {help && (
                  <b style={{color: "#fff"}}>{help.content}</b>
                )}
              </span>
            </span>
          </div>
        )}
        <section
          className={classNames(
            cx(type === 2 && border),
            styles.slippagefrom,
            miniForm ? styles.slippagefrom_mini : ""
          )}
        >
          <section
            className={classNames(
              pageName == "/farm" || hashName == "#withdraw"
                ? styles.wrapper + " " + styles.wrapper2
                : styles.wrapper,
              miniForm ? styles.wrapper_mini : ""
            )}
          >
            {" "}
            <div className={styles.fromToken}>
              {" "}
              <section
                className={classNames(
                  styles.field + " " + styles.slippagefromFields,
                  smScreen ? styles.sm_field : "",
                  miniForm ? styles.miniField : ""
                )}
              >
                {input ? (
                  <input
                    {...input}
                    onWheel={handleWheel}
                    id={label}
                    ref={inputRef}
                  />
                ) : textarea ? (
                  <textarea {...textarea} />
                ) : select ? (
                  <div className={styles.select}>{select}</div>
                ) : (
                  <input value={value} disabled/>
                )}
              </section>
              {unit && (
                // <div className={styles.toToken}>
                <>
                  {showBalance && (
                    <>
                      <section
                        className={classNames(
                          styles.unit,
                          styles.slippagefromUnit,
                          unitClass,
                          miniForm ? styles.slippagefromUnitMini : ""
                        )}
                      >
                        {unit}
                      </section>
                    </>
                  )}
                  {!showBalance && (
                    <section
                      className={classNames(
                        styles.unit,
                        styles.slippagefromUnit,
                        unitClass,
                        miniForm ? styles.slippagefromUnitMini : ""
                      )}
                    >
                      {unit}
                    </section>
                  )}
                </>
              )}
            </div>
            
          </section>
          {assets && (
            <section
              className={styles.assets}
              style={zIndexProp ? {zIndex: zIndexProp} : {zIndex: 10}}
            >
              {assets}
            </section>
          )}
        </section>
      </div>

      {error && !skipFeedback && (
        <p
          className={
            hashName == "#provide" || hashName == "#withdraw"
              ? styles.poolBox + " " + styles.feedback
              : styles.swapBox + " " + styles.feedback
          }
        >
          {error}
        </p>
      )}
    </div>
  )
}

export default FormGroupV2
