import classNames from "classnames"
import { ReactNode } from "react"
import styles from './ValuePlaceholder.module.scss'

interface Props {
    className?: string,
    value: string | ReactNode
}

const ValuePlaceholder = ({className, value}:Props) => {
    return (<span className={classNames(styles.container, className)}>{value}</span>)
}

export default ValuePlaceholder