import {useRef} from "react"
import classNames from "classnames"
import Button from "./Button"
import styles from "./WebAppFormGroup.module.scss"
import classnames from "classnames"
import {div, gt, multiple} from "../libs/math";
import {decimal} from "../libs/parse";
import FormVerticalGroup from "./FormVerticalGroup";
import {getPath, MenuKey} from "../routes"

const cx = classNames.bind(styles)

const WebAppFormGroup = ({
                           input,
                           textarea,
                           select,
                           value,
                           unitClass,
                           miniForm,
                           className,
                           showLp = true,
                           multiLines,
                           vertical,
                           inputClass,
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
          type      = 1,
          hideInput = false,
          maxOnly   = false
        }              = props
  const pageName       = window.location.pathname
  const hashName       = window.location.hash
  const {skipFeedback} = props
  const inputRef       = useRef<HTMLInputElement>()
  const handleWheel    = () => {
    inputRef.current?.blur()
  }

  const border = cx(styles.border, {focused, error, readOnly: value})

  return (
    vertical ? <FormVerticalGroup {...{
        input,
        textarea,
        select,
        value,
        unitClass,
        miniForm,
        multiLines,
        vertical,
        className,
        ...props
      }} />
      :
      <div
        className={classNames(
          styles.group,
          styles.component,
          styles.slippageComponent,
          label == "To" ? styles.toSwap : ""
        )}
      >
        {multiLines && label && (
          <header
            className={classNames(styles.header, multiLines ? styles.slippageHeaderMulti : styles.slippageHeader)}>
            <section className={classnames(styles.label, multiLines ? styles.labelMulti : '')}>
              <label htmlFor={input?.id}>{label}</label>
            </section>

            {/*{help && (
              <section className={styles.help}>
                {help.title}: <strong>{help.content}</strong>
              </section>
            )}*/}
            {/*{max && <Button {...maxProps} />}*/}
          </header>
        )}
        <div className={cx(type === 1 && border)}>
          <section
            className={classNames(cx(type === 2 && border), styles.slippagefrom, miniForm ? styles.slippagefrom_mini : '')}
          >
            {!multiLines && label && (
              <header
                className={classNames(styles.header, multiLines ? styles.slippageHeaderMulti : styles.slippageHeader)}>
                <section className={classnames(styles.label, multiLines ? styles.labelMulti : '')}>
                  <label htmlFor={input?.id}>{label}</label>
                </section>

                {/*{help && (
              <section className={styles.help}>
                {help.title}: <strong>{help.content}</strong>
              </section>
            )}*/}
                {/*{max && <Button {...maxProps} />}*/}
              </header>
            )}

            <section
              className={
                classNames(pageName == "/farm" || hashName == "#withdraw"
                    ? styles.wrapper + " " + styles.wrapper2
                    : styles.wrapper,
                  miniForm ? styles.wrapper_mini : '')
              }
            >
              {showLp && unit && (
                <section
                  className={classNames(
                    styles.unit,
                    styles.slippagefromUnit,
                    unitClass,
                    miniForm ? styles.slippagefromUnitMini : '',
                  )}
                >
                  {unit}
                </section>
              )}

              <section
                className={classNames(
                  styles.field + " " + styles.slippagefromFields,
                  smScreen ? styles.sm_field : "",
                  miniForm ? styles.miniField : '',
                  inputClass ? styles.inputClass : ''
                )}
              >
                {help && (
                  <b
                    className={classNames(styles.pendiongSlippage, miniForm ? styles.pendiongSlippageMini : '', multiLines ? styles.slippageFormMultiMeta : '')}>{help.content}</b>
                )}
                {input ? (hideInput ? '' : (
                  <input
                    {...input}
                    onWheel={handleWheel}
                    id={label}
                    ref={inputRef}
                    className={classnames(multiLines ? styles.slippageFormMultiInput : '', className)}
                  />
                )) : textarea ? (
                  <textarea {...textarea} className={className}/>
                ) : select ? (
                  <div className={classnames(styles.select, className)}>{select}</div>
                ) : (
                  <input value={value} className={className} disabled/>
                )}
              </section>
            </section>
            {assets && <section className={styles.assets}>{assets}</section>}
          </section>
        </div>

        {error && !skipFeedback && (
          <p
            className={
              classnames(styles.feedback, pageName !== getPath(MenuKey.YEILD) ? hashName == "#provide" || hashName == "#withdraw"
                ? styles.poolBox
                : styles.swapBox : "")
            }
          >
            {error}
          </p>
        )}
      </div>
  )
}

export default WebAppFormGroup
