import { FC } from "react"
import Tippy, { TippyProps } from "@tippyjs/react"
import classNames from "classnames"
import { isNil } from "ramda"
import Icon from "./Icon"

import "tippy.js/dist/tippy.css"
import "tippy.js/themes/light-border.css"
import styles from "./Tooltip.module.scss"
import TooltipContainer from "./Static/TooltipContainer"
import classnames from "classnames";

export const DefaultTippyProps: TippyProps = {
  animation: false,
  interactive: true,
  appendTo: document.body,
}

export const DropdownTippyProps: TippyProps = {
  ...DefaultTippyProps,
  placement: "bottom-end",
  trigger: "click",
}

const TooltipTippyProps: TippyProps = {
  ...DefaultTippyProps,
  placement: "top",
  theme: "light-border",
  className: styles.tooltip,
}

interface Props extends Omit<TippyProps, "children"> {
  onClick?: () => void
  alignTextToLeft?: boolean
  className?: string
  delay?:any
  tooltipClass?: string
  iconSize?:number
  arrow?:boolean
iconClassName?:string
}

export const Tooltip: FC<Props> = ({ className,tooltipClass, onClick, children,arrow=true, alignTextToLeft=false,delay,...props }) => {
  const button = (
    <button
      type="button"
      className={classNames(alignTextToLeft ? styles.newButton  :styles.button, className)}
      onClick={onClick}
    >
      {children}
    </button>
  )
  return props.content ? (
    <Tippy
      {...TooltipTippyProps}
      {...props}
      delay={delay}
      content={<TooltipContainer className={tooltipClass} ><h3>{props?.content}</h3></TooltipContainer>}
      hideOnClick={isNil(props.visible) ? false : undefined}
      arrow={arrow}
    >
      {button}
    </Tippy>
  ) : (
    button
  )
}

export const TooltipIcon: FC<Props> = ({ children,iconSize, className, ...props }) => (
  <div className={classNames(styles.flex, className)}>
    {children}
    <div className={styles.icon}>
      <Tooltip {...props}>
        <Icon name="info_outline" className={props?.iconClassName} size={iconSize ? iconSize :16} />
      </Tooltip>
    </div>
  </div>
)

export const TooltipLgIcon: FC<Props> = ({ children,iconSize, className, ...props }) => (
    <div className={classNames(styles.flex, className)}>
      <div className={styles.icon}>
        <Tooltip {...props} >
          {children}
          <Icon name="info_outline" className={classNames(props?.iconClassName, styles?.TooltipLgIcon)} size={iconSize ? iconSize :16} />
        </Tooltip>
      </div>
    </div>
)

export default Tooltip
