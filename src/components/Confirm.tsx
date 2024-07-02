import styles from "./Confirm.module.scss"
import classNames from "classnames";

const Confirm = ({ list, className, webApp, titleClassName }: { list?: Content[], className?: string, titleClassName?: string, webApp?: boolean }) => (
  <ul className={classNames(styles.list, className)} style={(webApp && {background: '#111023'})}>
    {list &&
    list.map(({ title, content }, index) => (
            <li className={styles.item} key={index}>
                <article className={styles.article}>
                    <h1 className={classNames(styles.title, titleClassName)}>{title}</h1>
            <p className={styles.content}>{content}</p>
          </article>
        </li>
      ))}
  </ul>
)

export default Confirm
