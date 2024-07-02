import classNames from "classnames"
import { FC } from "react"
import styles from "./Modal.module.scss"

interface Props {
  isOpen: boolean
  onClose: () => void
  title: string
  titleClass?: string
  className?: string
  headerClassName?: string
  bodyClassName?: string
  closeOnClickOutside?: boolean
  closeClass?: string
}

const Modal: FC<Props> = ({
  isOpen,
  onClose,
    closeClass,
  titleClass,
  className,
  closeOnClickOutside = false,
  title = "Select a Token",
  children,
  headerClassName,
  bodyClassName,
}) =>
  !isOpen ? null : (
    <>
      <div
        className={`${styles.modal} ${
          isOpen ? styles.open_modal : styles.close_modal
        }`}
      >
        {closeOnClickOutside && (
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              left: 0,
              width: "100%",
              bottom: 0,
            }}
            onClick={onClose}
          ></div>
        )}

        <div className={classNames(styles.modalContent, className)}>
          <div
            className={
              headerClassName
                ? classNames(styles.modalHeader, headerClassName)
                : styles.modalHeader
            }
          >
            <div className={styles.title}>
              <h1 className={titleClass}>{title}</h1>
            </div>
            <div className={styles.closeSection}>
                <span className={classNames(styles.close, closeClass ? closeClass : "")} onClick={onClose}>
                &times;
              </span>
            </div>
          </div>
          <div
            className={
              bodyClassName
                ? classNames(styles.modalBody, bodyClassName)
                : styles.modalBody
            }
          >
            {children}
          </div>
          {/*<div className={styles.modalFooter}>
          <h3>Modal Footer</h3>
        </div>*/}
        </div>
      </div>
    </>
  )

export default Modal
